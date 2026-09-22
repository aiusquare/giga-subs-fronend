# Target Provider Routing Architecture

Audit date: 2026-09-12

## Design goals

The target architecture provides hierarchical ordered routing, safe failover, circuit breaking, canonical product mapping, one durable purchase lifecycle, and identical routing for app and reseller/API callers. It must work on database-backed shared hosting without requiring Redis or a permanent worker.

## Component boundaries

```text
App Purchase controller ----\
                             -> Purchase Orchestrator -> Route Resolver
Reseller Gateway -----------/           |                  |
                                        |                  +-> published rules/entries
                                        |                  +-> circuit eligibility
                                        |                  +-> product mappings
                                        |
                                        +-> Wallet service / durable intent
                                        +-> Provider adapter registry
                                        +-> Attempt journal
                                        +-> Reconciler / callback handler
```

Controllers authenticate, validate envelopes, and format responses. They do not select providers, debit/refund, interpret provider statuses, or implement failover. Result checker must delegate to the same orchestrator instead of calling ADE directly.

## Routing model

### Rule scopes and precedence

For a canonical request `(service, network_or_biller, category)`, resolve exactly one published rule in this order:

1. service + network/biller + category
2. service + network/biller
3. service + category
4. service default

The service-default rule is mandatory. Network/biller and category rules are optional. An override replaces the less-specific chain; it does not implicitly append the default chain. If operators want the default providers after override-specific entries, they add them explicitly to that override.

Example:

| Request | Winning scope | Ordered chain |
|---|---|---|
| DATA / MTN / SME | DATA + MTN + SME | ADE -> SMEPLUG -> MSORG |
| DATA / MTN / GIFTING | DATA + MTN + GIFTING | MSORG -> ADE |
| DATA / GLO / SME, no network+category rule | DATA + SME | ADE -> MSORG |
| DATA / Airtel / NORMAL, no overrides | DATA default | ADE -> MSORG -> SMEPLUG |

### Deterministic resolver

1. Normalize service, network/biller, and category to canonical keys.
2. Query the four candidate scopes in precedence order or compute a specificity rank.
3. Choose the single highest-specificity published rule. Duplicate published scopes are a configuration error, not a tie to resolve by timestamps.
4. Load enabled entries ordered by unique `priority ASC`.
5. Filter entries by provider config enabled state, server-side capability registry, circuit eligibility, and product mapping availability.
6. Persist the original rule revision and ordered chain snapshot on the purchase intent.

If the winning override exists but all its entries are ineligible, the request fails/pends according to policy; silently falling back to a less-specific rule would make admin intent unpredictable.

## Canonical product and provider mapping

Customers purchase a canonical product, never an ADE/MSORG/SMEPLUG plan row. The canonical product owns customer-visible name, network/biller, category, allowance/validity, and retail price. Each provider mapping owns that provider's plan code, mapped network/biller code, expected cost, and catalog freshness.

For each attempt, the orchestrator resolves:

```text
(canonical_product_id, provider_config_id)
    -> provider_plan_code + provider network/biller code
```

If no active verified mapping exists, skip the provider as configuration-ineligible before any HTTP call. Data failover remains disabled until mapping completeness reaches 100% for every product and every enabled provider in the applicable chains.

The existing `service_pricing` rows can be an import source during transition, but `plan_code` must never be reused across providers simply because the strings happen to match.

## Purchase orchestrator

The orchestrator owns one state machine and one public reference. It creates the intent before debit/provider contact, snapshots price/route, ensures a single debit, and appends attempts. It invokes adapters through a registry keyed by provider and service capability rather than a permissive hard-coded default branch.

Suggested intent state transitions:

```text
CREATED -> DEBITED -> DISPATCHING
DISPATCHING -> SUCCEEDED
DISPATCHING -> PENDING -> SUCCEEDED | FAILED | MANUAL_REVIEW
DISPATCHING -> FAILED -> REFUNDED
DISPATCHING -> MANUAL_REVIEW -> SUCCEEDED | FAILED -> optional REFUNDED
```

Every transition uses an expected prior state/version. Completion, debit, refund, and reward operations are idempotent.

## Provider adapter contract

Each adapter/service method returns a structured result:

```text
outcome_class
provider_business_status
provider_reference
provider_error_code
customer_safe_message
circuit_relevant
request_send_state (NOT_SENT | POSSIBLY_SENT | SENT)
http_status / transport category / timing
status_lookup_key
redacted diagnostic metadata
```

Provider parsers must be fixture-tested. Unknown/missing/conflicting response data is `AMBIGUOUS`, never inferred success/failure. The capability registry declares supported services, reference constraints, lookup capability, and adapter method; the admin UI consumes server capabilities rather than maintaining a conflicting hard-coded list.

## Failover policy

Proceed to the next priority only when all conditions hold:

1. The current result is `SAFE_PRE_SEND_FAILURE` or a provider-contract-verified `DEFINITIVE_RETRYABLE_FAILURE`.
2. No earlier attempt is pending or ambiguous.
3. A verified mapping exists for the next provider.
4. The next provider is circuit-eligible.
5. The route snapshot still has an entry and the overall time/attempt budget permits it.

Never fail over on timeout-after-send, connection reset after upload, empty/malformed response after a possible send, unknown status, accepted/pending, or lost local persistence after send. Reconcile the same provider/reference instead.

Customer validation failures (bad recipient, unsupported meter/card, invalid request) are normally final and should not be sprayed across providers. Provider auth failure, provider low balance, or provider-specific product unavailability may be definitive retryable only when exact response fixtures prove no fulfilment was accepted.

## Circuit breaker

Circuit identity is provider config + service. Policy supplies failure threshold, rolling window, and cooldown.

### CLOSED

- Provider is eligible.
- Circuit-relevant definitive failures and safe transport failures are recorded in the attempt journal.
- When the threshold within the rolling window is reached, atomically set OPEN and `next_probe_at`.
- Customer/input failures do not count.

### OPEN

- Provider is skipped before an attempt is created/sent.
- When cooldown expires, one requester/reconciler atomically acquires a probe lease and transitions to HALF_OPEN.

### HALF_OPEN

- Exactly one controlled probe is allowed; other traffic skips the provider.
- Probe success -> CLOSED and reset/age out failure state.
- Definitive circuit-relevant failure -> OPEN with a new cooldown.
- Ambiguous/pending probe -> OPEN/degraded and reconciliation; never send another probe until resolved or lease policy expires safely.

Use database compare-and-set on `state/version` and a lease expiry to survive PHP termination. The rolling failure count should be derived from indexed provider attempts so multiple web processes share the same truth.

## Idempotency and references

- Accept a client idempotency key for reseller and app channels; generate one client-side for app submissions where practical.
- Generate the public purchase reference before debit and store it on intent and customer transaction.
- Return it on success, pending, failure, and idempotent replay, including dedicated gateway endpoints.
- Derive a stable attempt reference from purchase reference + provider + attempt number while respecting provider length/character rules.
- Retrying status lookup uses the same attempt reference. A new provider gets a new attempt reference but remains under the same purchase reference.
- Provider callbacks are deduplicated by external event ID/hash and matched to an existing attempt.

## Pricing behavior

Route selection and customer pricing are separate concerns:

- Customer charge is snapshotted once from the canonical offer/API tier at intent creation.
- Provider expected cost is snapshotted per attempt mapping.
- Failover does not reprice the customer's already accepted purchase.
- If all eligible provider costs exceed configured margin/ceiling, reject before debit or route according to an explicit commercial policy.
- Historical reporting uses snapshots, never the current active provider's pricing.

## Shared-hosting operation

- Keep requests bounded; do not attempt an unbounded chain synchronously.
- Store all state in MySQL/MariaDB with short transactions.
- Use a cron-invoked reconciler with a database lease/advisory lock and small batches.
- Make reconciliation overlap-safe and restartable.
- Provide an admin queue for aged pending/ambiguous intents when provider lookup is unavailable.
- Respect PHP/proxy time budgets and stop before the next attempt if insufficient time remains.
- Avoid reliance on Redis, process supervisors, or long-lived consumers.

## Observability and admin controls

Expose, with credential/PII redaction:

- Resolved rule/revision and why it won.
- Attempt chain, provider, mapping, timings, HTTP/business status, and normalized outcome.
- Circuit state, rolling failures, cooldown, and probe lease.
- Mapping completeness and catalog freshness.
- Aged pending/ambiguous queue and audited resolution actions.

Admin publishing must validate the mandatory default, priorities, capabilities, mappings, and enabled provider configs transactionally. Editing credentials must remain separate from route ordering. Both existing duplicated Live API Routing widgets should ultimately be replaced by one routing-management surface.
