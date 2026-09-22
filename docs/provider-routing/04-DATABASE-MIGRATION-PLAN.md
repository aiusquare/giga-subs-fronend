# Database Migration Plan

Audit date: 2026-09-12

This is a plan only. No migration has been executed.

## Existing schema drift to resolve first

### 1. Pricing uniqueness disagrees with application identity

The database unique key is:

```text
(service_type, provider, plan_code)
```

(`backend/database/schema.sql:263`)

The CSV import/upsert identity is:

```text
(service_type, api_provider, provider, plan_code)
```

(`backend/application/controllers/api/Admin_Pricing.php:500-509`)

The database therefore prevents ADE and MSORG rows that use the same customer-facing network and provider plan-code string from coexisting, even though the application considers them different. The canonical existing-row key already includes `api_provider`; the schema should match after duplicate/null analysis.

Recommended replacement key for the legacy pricing table:

```text
UNIQUE(service_type, api_provider, provider, plan_code)
```

Because MySQL permits multiple `NULL` values in a unique key, normalize plan-based routed rows to non-null codes or add a deterministic generated/materialized identity key. Do not silently merge legacy null-code rows.

### 2. `provider_configs.auth_url` is missing

`Admin_Providers` and `Verification_service` consume `auth_url`, and the frontend sends it, but no checked-in SQL creates it. Add an idempotent nullable `VARCHAR(500)` column in the baseline and upgrade migration. Confirm the live table before generating the final SQL.

### 3. `transactions.cost_price` is not in the baseline

Application inserts always include `cost_price`, but `transactions` in `schema.sql` does not define it. A separate `database/add_cost_price_to_transactions.sql` adds it. Fold it into the fresh-install table while retaining an idempotent upgrade step.

### 4. Baseline is not safely rerunnable

`schema.sql` creates tables with `IF NOT EXISTS` and later unconditionally adds columns already present in the create definitions (`transactions.recipient/balance_*`) or previously added on an earlier run (`provider_ref/metadata`, `profiles.topupmates_customer_id`). This makes a second run fail. Some standalone migrations also lack idempotency.

Create a versioned migration ledger and make every new migration one-way, checksum-tracked, and preflighted. Do not use `schema.sql` as an upgrade runner.

### 5. Documentation and identifiers drift

- Schema comments claim `service_pricing.provider` links to `provider_configs.name`; actual code links `api_provider`.
- Service identifiers include both `scratch-card` and `scratch_card` in different locations.
- `provider_configs` has no database-enforced single-active-per-service invariant.
- No foreign key ties pricing `api_provider` to a config, partly because the relation is name-based rather than ID-based.

## Proposed additive schema

Names are recommendations for Phase 1. Final column types must be validated against the deployed MySQL/MariaDB version.

### `provider_routing_rules`

One row represents a routing scope.

| Column | Purpose |
|---|---|
| `id CHAR(36)` | Application UUID primary key |
| `service_type VARCHAR(50)` | Mandatory service key |
| `network_biller_key VARCHAR(100) NOT NULL DEFAULT ''` | Empty means wildcard |
| `plan_category VARCHAR(50) NOT NULL DEFAULT ''` | Empty means wildcard |
| `status VARCHAR(20)` | `draft`, `published`, `disabled` |
| `version INT` | Optimistic locking / snapshot version |
| `created_by`, `updated_by` | Admin audit |
| timestamps | Audit |

Use a unique scope key on `(service_type, network_biller_key, plan_category, status)` only if the lifecycle design guarantees one row per status. A cleaner option is one stable rule row per scope with a separate immutable publication revision. Empty strings avoid MySQL's nullable-unique behavior.

Mandatory publish invariant: each routable service has exactly one published rule where both optional keys are empty.

### `provider_routing_entries`

Ordered providers for a rule.

| Column | Purpose |
|---|---|
| `id` | Primary key |
| `rule_id` | Foreign key to rule |
| `provider_config_id` | Stable FK; do not route by provider name |
| `priority SMALLINT` | Lower value attempted first |
| `is_enabled` | Temporary route membership switch |
| timestamps | Audit |

Constraints: unique `(rule_id, priority)` and unique `(rule_id, provider_config_id)`. Publishing validates contiguous unique priorities and capability compatibility.

### `canonical_products`

Customer-facing identity independent of upstream APIs.

| Column | Purpose |
|---|---|
| `id` | Canonical product ID used by purchases |
| `service_type` | `data`, `cable`, etc. |
| `network_biller_key` | Canonical MTN/DStv/etc. key |
| `plan_category` | Canonical category |
| `code` | Stable public product code |
| `name`, `validity`, `allowance` | Customer descriptors |
| `selling_price`, `price_version` | Current retail offer |
| `is_active` | Sale availability |
| timestamps | Audit |

Unique `(service_type, code)`. For data, also validate semantic uniqueness of network/category/allowance/validity as business rules require.

### `provider_product_mappings`

| Column | Purpose |
|---|---|
| `canonical_product_id` | FK to canonical product |
| `provider_config_id` | FK to provider config |
| `provider_plan_code` | Code sent only to this provider |
| `provider_network_code` | Optional explicit mapped code |
| `provider_biller_code` | Optional explicit mapped code |
| `expected_cost` | Current provider cost |
| `catalog_version` / `verified_at` | Freshness evidence |
| `is_active` | Mapping availability |

Unique `(canonical_product_id, provider_config_id)`. Optionally unique provider-side identity within a config. A route is not publishable for data failover unless every enabled entry has an active mapping for every eligible canonical product.

### `purchase_intents`

Durable record created before debit and HTTP.

Key fields:

- `id`, unique `public_reference`.
- `actor_user_id`, `channel` (`app`/`reseller`), nullable `client_idempotency_key` with a normalized uniqueness strategy.
- Canonical product/service/network/category and recipient/request snapshot.
- `selling_price_snapshot`, `cost_basis_snapshot`, pricing ID/version.
- Published route rule/revision and serialized ordered route snapshot.
- State such as `CREATED`, `DEBITED`, `DISPATCHING`, `PENDING`, `SUCCEEDED`, `FAILED`, `MANUAL_REVIEW`, `REFUNDED`.
- Wallet transaction/ledger ID, selected successful attempt, terminal reason, timestamps, lock version.

Recommended unique idempotency identity: `(actor_user_id, channel, idempotency_key_hash)` for non-null keys. On database versions where null/generated behavior is problematic, use a separate `purchase_idempotency_keys` table.

### `provider_attempts`

Append-only journal for every provider contact:

- Intent ID, provider config ID, route position, unique attempt number.
- Unique stable `attempt_reference`; provider-specific wire reference.
- Canonical product mapping ID and exact provider plan/network/biller codes sent.
- State (`CREATED`, `SENDING`, `PENDING`, `SUCCEEDED`, `DEFINITIVE_FAILED`, `AMBIGUOUS`).
- Transport phase, cURL errno/error category, HTTP status, timing, request-sent certainty.
- Provider reference/status/error code, normalized outcome class, circuit-relevant flag.
- Redacted request/response digest and bounded diagnostic payload.
- Started/completed/reconcile timestamps.

Constraints: unique `(purchase_intent_id, attempt_no)`, unique `(provider_config_id, attempt_reference)`. Index `(provider_config_id, service_type, completed_at, outcome_class)` for rolling-window health computation.

### `provider_circuit_state`

| Column | Purpose |
|---|---|
| `provider_config_id`, `service_type` | Circuit identity |
| `state` | `CLOSED`, `OPEN`, `HALF_OPEN` |
| `failure_threshold`, `window_seconds`, `cooldown_seconds` | Effective policy snapshot/config |
| `opened_at`, `next_probe_at` | Cooldown |
| `probe_lease_owner`, `probe_lease_expires_at` | One half-open probe |
| `last_success_at`, `last_failure_at`, `version` | Health and compare-and-set |

Unique `(provider_config_id, service_type)`. Rolling counts should come from indexed attempt events; the state row is the concurrency-control/cache record.

### `provider_callback_events`

Store callback dedupe and audit: provider, event ID (or payload hash), signature result, received time, matched attempt, apply status. Unique `(provider_config_id, external_event_id)` where available.

### Wallet linkage

The current balance column can remain initially, but routing safety needs a unique, auditable side-effect record. Either introduce `wallet_ledger_entries` or add a unique purchase-intent link to the existing transaction model. Enforce one debit and one optional refund per intent with unique keys; do not rely only on checking balance values.

## Migration sequence

1. **Preflight read-only report:** server/version, engine, collation, JSON support, current columns/indexes, duplicate provider configs, multiple active rows, pricing collisions under both old/new keys, null plan codes, orphan API-provider names, and transaction column presence.
2. **Repair baseline definitions:** add `auth_url` and `transactions.cost_price` idempotently; correct comments; normalize service identifiers through an explicit reviewed map.
3. **Pricing key migration:** report collisions, resolve data manually, add the new key including `api_provider`, then drop the old key. Never choose a winner automatically.
4. **Create additive routing/product/intent/attempt/circuit tables:** no code reads them for routing yet.
5. **Backfill canonical products and mappings in draft state:** generate reports; require admin verification of semantic matches and provider codes.
6. **Backfill mandatory service-default draft rules:** seed from the currently active provider only, preserving present behavior. Do not publish failover entries automatically.
7. **Deploy code in shadow-read mode:** compare the resolver's first choice with current `find_by_service_type`; record discrepancies without changing dispatch.
8. **Only after later rollout gates:** publish routes and switch orchestration behind a feature flag.

## Operational requirements

- Take a verified backup and record migration checksum before execution.
- Run against a staging copy with production engine/version and representative data.
- Use online/low-lock index changes appropriate to table size and hosting capabilities.
- Abort when preflight finds unresolved collisions or missing provider configs.
- Keep DDL separate from data backfill and from feature activation.
- Every migration writes its version only after successful completion.
- Rollback for additive Phase 1 is application rollback/feature disable; do not drop populated audit tables during an incident.

## Verification queries/tests after eventual execution

- Exactly one service-default published rule per enabled routed service.
- No duplicate priority or provider within a rule.
- No active route entry to inactive/missing provider config.
- Every failover-enabled canonical data product has a mapping for every entry.
- No two intents share an actor/channel/idempotency key.
- No intent has more than one debit or refund ledger entry.
- No ambiguous attempt has a later attempt.
- At most one unexpired half-open lease per circuit.
- Schema diff from the canonical baseline is empty.
