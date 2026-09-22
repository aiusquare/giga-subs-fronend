# Purchase Lifecycle

Audit date: 2026-09-12

## Current lifecycle

### Plan-based app purchase

```text
Client
  -> Purchase::index (authenticate, validate)
  -> Vtu_service::purchase
       -> load mutable service_pricing row
       -> read wallet and pre-check balance
       -> select one active provider by service_type
       -> reject plan when plan.api_provider != active provider
       -> atomic wallet debit
       -> generate orchestration reference
       -> synchronous provider POST
       -> reconnect database
       -> if adapter says failed:
            wallet credit (refund)
            create a new failed transaction with a different reference
            return HTTP error with empty reference
          else:
            create completed/pending transaction with a different reference
            return orchestration reference/provider_ref/balance
```

The wallet's conditional update prevents two debits from independently driving a balance below zero. It does not make a logical purchase idempotent and does not bind the debit to a transaction row.

### Airtime and electricity

`purchase_airtime()` and `purchase_electricity()` repeat the same order: check, resolve one provider, debit, generate reference, call, reconnect, refund-on-any-failure, then insert the transaction. Electricity has a separate provider dispatch method. Relevant code is `backend/application/libraries/Vtu_service.php:193-289,307-473`.

### Result checker

`ResultChecker::index()` independently repeats plan validation, wallet check/debit, reference generation, direct ADE call, refund, and transaction insert (`backend/application/controllers/api/ResultChecker.php:90-212`). It does not reconnect the database after the remote call. Provider `pending` is converted to failed by ADE's result-checker method, so it can be refunded prematurely.

## Current state and side effects

| Adapter result | Wallet | Stored transaction | Client result |
|---|---|---|---|
| `completed` | Remains debited | Inserted after call as completed; new stored reference | Success, orchestration reference on app/generic gateway |
| `pending` | Remains debited | Inserted after call as pending | Success/pending, orchestration reference on app/generic gateway |
| `failed` (including transport/parse) | Immediately credited | Inserted after refund as failed, generally without provider metadata | Error; `Vtu_service` error reference is empty |
| Process/database failure after debit but before insert | Unknown/manual | May be absent | Connection/500; no durable recovery anchor |

Dedicated reseller data/airtime endpoints replace the normal result with `_vtu_success()` / `_vtu_fail()` and do not include any purchase reference (`backend/application/controllers/api/Gateway.php:858-895`).

## Reference lineage

Example for a data request:

```text
Vtu_service generates TXN + 10 hex
  +-> sent to ADE.request-id or SMEPLUG.customer_reference
  +-> returned to app/generic-gateway client on success
  +-> NOT passed to Transaction_model

Transaction_model generates TXN + 12 hex
  +-> stored in transactions.reference
  +-> displayed in history/admin/receipt
```

For MSORG, the first reference is neither sent upstream nor stored. On failed calls, the provider identity, request reference, raw status, transport details, and possible provider reference are not persisted.

## Current reseller convergence

There are three paths:

1. App `/purchase*` -> `Vtu_service`.
2. Generic `/gateway` -> `_dispatch()` -> `_call_provider()` -> `Vtu_service` for VTU purchases.
3. Dedicated `/gateway/data` and `/gateway/airtime` -> `Vtu_service`.

This confirms that routing belongs behind `Vtu_service`, not in either controller. The generic gateway's identity-verification charging helpers are a different workflow and should not be confused with VTU purchase orchestration.

## Target durable lifecycle

The target must use short local transactions around durable state changes and never hold a database lock during an upstream HTTP call.

```text
1. Validate request and client idempotency key.
2. Resolve canonical product and immutable price snapshot.
3. Resolve and snapshot the published route using precedence.
4. In one short DB transaction:
   - create/reuse purchase_intent with one public reference;
   - reserve/debit wallet exactly once;
   - create customer transaction/ledger link as processing;
   - commit.
5. Choose first eligible mapped provider from route snapshot.
6. Atomically create provider_attempt with stable attempt reference.
7. Send exactly once outside a DB transaction.
8. In one short DB transaction, store transport + normalized outcome.
9. Apply outcome policy:
   - success -> complete intent/transaction once;
   - accepted/pending -> keep debit, reconcile same provider;
   - safe definitive retryable failure -> update circuit and try next eligible provider;
   - definitive final customer failure -> fail and refund once;
   - ambiguous -> stop chain, keep processing, reconcile/manual review.
10. Return the same public reference on every client channel and replay.
```

## Required outcome taxonomy

Adapters must return structured fields, not only `ok/status/message`:

| Outcome | Meaning | Fail over? | Wallet action |
|---|---|---|---|
| `SUCCEEDED` | Provider confirms fulfilment | No | Keep debit; complete once |
| `ACCEPTED_PENDING` | Provider accepted/queued; terminal result unknown | No | Keep debit; reconcile |
| `SAFE_PRE_SEND_FAILURE` | Request conclusively did not leave this system (for example DNS/connect/TLS failure before upload) | Yes, if mapped route remains | Keep one debit |
| `DEFINITIVE_RETRYABLE_FAILURE` | Provider explicitly rejected without fulfilment due to provider-scoped condition (auth, provider low balance, provider product unavailable), verified safe by provider contract | Yes | Keep one debit while trying chain |
| `DEFINITIVE_FINAL_FAILURE` | Explicit customer/request rejection that another provider should not receive, or route exhausted | No | Refund once |
| `AMBIGUOUS` | Request may have been accepted/fulfilled: timeout after send, reset after upload, empty/malformed response, conflicting/unknown status | Never | Keep pending; lookup/manual resolution |

HTTP status alone is not an outcome. Provider business status and send certainty must both be evaluated.

## Transaction and wallet invariants

1. One public reference identifies the purchase everywhere.
2. One accepted client idempotency key maps to at most one purchase intent.
3. A purchase causes at most one customer debit and at most one compensating refund.
4. Provider attempts are append-only; each has a unique stable reference.
5. At most one attempt may be in-flight for a purchase unless the previous result is proven safe for failover.
6. An ambiguous attempt blocks all later attempts.
7. Terminal intent transitions are compare-and-set and irreversible except by audited manual correction.
8. A route and price snapshot do not change underneath an in-progress purchase.
9. Referral/reward side effects occur once after terminal success.
10. A callback or reconciliation replay is a no-op after the same outcome has been applied.

## Recovery paths

- **Client retry:** fetch/replay the existing intent by idempotency key/public reference.
- **PHP termination:** a cron-safe reconciler finds stale `DISPATCHING`/`PENDING` attempts and queries the same provider; it never blindly creates a second attempt.
- **DB failure after provider response:** attempt remains recoverable by its pre-created reference; reconciliation queries provider or enters manual review.
- **No provider lookup:** move to `MANUAL_REVIEW`, preserve debit, show a non-terminal customer message, and enforce an operations SLA.
- **Admin resolution:** require provider evidence, actor/reason, optimistic state check, and idempotent complete/refund action.
