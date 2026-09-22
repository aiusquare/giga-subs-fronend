# Current Provider and Purchase Architecture

Audit date: 2026-09-12

## Scope and confidence

This is a static-code and checked-in-schema audit of the frontend and backend workspaces. No database migration was run, no production configuration was read or changed, and no live provider request was made. Statements about provider guarantees are therefore marked **unverified** unless the repository itself implements them.

Workspace labels used below:

- `backend/` = `C:\DEV\Reatjs\data apps\gigadata\backend`
- `frontend/` = `C:\DEV\Reatjs\data apps\gigadata\frontend`

## Executive summary

Giga Subs currently has a single-active-provider-per-service design. Provider credentials are stored in `provider_configs`; admin activation deactivates every other row for the same `service_type`. Public pricing queries expose only rows whose `api_provider` matches that active provider, and `Vtu_service` rejects a selected plan if it belongs to any other provider.

Ordinary app purchases and reseller/API purchases converge on `Vtu_service` for the general VTU paths. This is the correct seam for one future routing engine. The exception is result-checker fulfillment, which duplicates the wallet/provider/transaction lifecycle directly in `ResultChecker.php` and calls ADE directly.

The present lifecycle is unsafe for automatic failover. It debits before calling the provider, creates the transaction only after the provider call, converts transport and parse failures into ordinary failure, and immediately refunds. It also generates one reference for the upstream/client response and a different reference when inserting the transaction row.

## A. Provider configuration

### Storage

`provider_configs` stores one row per provider name and service type. The checked-in schema contains `name`, `service_type`, `api_url`, `api_token`, `secret_key`, `is_active`, and timestamps (`backend/database/schema.sql:387`). The controller also reads and writes `auth_url`, but that column is absent from every checked-in SQL definition; see the schema issues below.

Credentials are stored as database values, not encrypted application-level ciphertext. `Admin_Providers::_format()` intentionally omits token and secret values and returns only `has_api_key` / `has_secret_key`, so the frontend cannot retrieve stored plaintext (`backend/application/controllers/api/Admin_Providers.php:195`). The frontend clears newly entered secrets from component state after saving (`frontend/src/components/admin/AdminApiSettings.tsx:584`).

### Exclusive activation

`Provider_config_model::activate_exclusive()` starts a transaction, sets all configs for the row's `service_type` inactive, then activates the selected row (`backend/application/models/Provider_config_model.php:135`). It is used by:

- `Provider_config_model::toggle()` when turning a row on (`:118-128`).
- `Admin_Providers::create()` when a new row is created active (`backend/application/controllers/api/Admin_Providers.php:76-79`).
- `Admin_Providers::update()` whenever the updated row is active (`:143-147`).

Exclusivity is application-enforced only. The database has an index on `is_active` but no constraint that prevents two active rows for one service.

### Single-provider assumptions

- `find_by_service_type()` returns only the most recently updated active row (`backend/application/models/Provider_config_model.php:51`).
- All three `Vtu_service` purchase methods resolve exactly one config this way (`backend/application/libraries/Vtu_service.php:89,210,326`).
- Plan-based purchasing requires `plan.api_provider == active config.name` (`Vtu_service.php:93-99`).
- Public plan queries join pricing to an active provider config; changing the active provider changes the visible catalogue (`backend/application/models/Pricing_model.php:35-90`).
- `find_active_plan()` applies the same active-provider join (`Pricing_model.php:108-137`).
- Result-checker repeats the one-active-provider lookup and match check (`backend/application/controllers/api/ResultChecker.php:120-134`).
- Verification/Profile provider selection also calls `find_by_service_type()` (`backend/application/libraries/Verification_service.php:394,435`; `backend/application/controllers/api/Profile.php:1561`).
- Both admin “Live API routing” widgets show one service selector and one active API selector, and call the same toggle endpoint (`frontend/src/components/admin/AdminApiSettings.tsx:639-704`; `frontend/src/components/admin/AdminPricing.tsx:824-880`).
- Analytics fallback-cost subqueries join the currently active API, so historical costs can be attributed using today's provider when `transactions.cost_price` is zero.

## B. Purchase orchestration

### Main app path

`Purchase.php` authenticates and validates the HTTP request, then delegates plan-based, airtime, and electricity operations to `Vtu_service` (`backend/application/controllers/api/Purchase.php:43-158,226-272`).

For plan-based purchases, `Vtu_service::purchase()`:

1. Loads the pricing row by client-supplied `plan_id` and checks `is_active` (`Vtu_service.php:72-78`).
2. Reads `selling_price` as the customer charge.
3. Reads the wallet and performs a preliminary balance check (`:80-86`).
4. Resolves the single active provider and verifies that the plan belongs to it (`:88-99`).
5. Atomically debits the wallet through `Profile_model::adjust_wallet()` (`:101-109`). The model uses a conditional SQL update to prevent the balance going below zero (`backend/application/models/Profile_model.php:85-123`).
6. Generates an upstream request reference only after the debit and calls the provider (`Vtu_service.php:111-125`).
7. Reconnects the database after the long call (`:127-129`).
8. On any adapter `ok=false`, credits the wallet and then inserts a failed transaction (`:131-149`).
9. On adapter success or pending, inserts a transaction with provider metadata (`:151-178`). Pending transactions remain debited.

Airtime and electricity duplicate the same lifecycle inside `Vtu_service` (`:193-289` and `:307-408`). There is no transaction wrapping the debit, provider call, refund, and transaction insert; a database transaction cannot safely span the remote call anyway, so the durable intent must be created before the call in the target design.

### Reference behavior

| Purpose | Current value |
|---|---|
| Plan purchase upstream/client reference | `TXN` + 10 hex chars, generated by `Vtu_service` |
| Airtime upstream/client reference | `ATX` + 10 hex chars |
| Electricity upstream/client reference | `ELX` + 10 hex chars |
| Stored `transactions.reference` | A separate `TXN` + 12 hex chars generated inside `Transaction_model::create*()` |
| Stored `provider_ref` | Provider response ID, only on `create_with_meta()` paths |

Consequently, the reference returned to an app client is not the reference later shown in transaction history, and neither `create()` nor `create_with_meta()` accepts the orchestration reference (`backend/application/models/Transaction_model.php:101-137,158-203`). Failed calls lose the attempted upstream reference and provider identity entirely.

### What is sent upstream

- ADE receives the orchestration reference as `request-id`, with `Airtime_`, `Bill_`, or `RESULTCHECKER_` prefixes for those services.
- SMEPLUG receives it as `customer_reference`.
- MSORG does not send it in any implemented payload.

## C. Provider dispatch

Only three purchase adapter files exist: ADE, MSORG, and SMEPLUG. `Vtu_service::_call_provider()` switches on those hard-coded names (`backend/application/libraries/Vtu_service.php:419-443`). See `02-PROVIDER-CAPABILITY-MATRIX.md` for service-level details.

Important mismatch: the frontend advertises ADE for cable and scratch cards (`frontend/src/components/admin/AdminApiSettings.tsx:48-61`), but `Ade_provider::purchase()` implements only airtime versus “everything else as data.” A cable or scratch-card request routed to ADE would be shaped as a data request. SMEPLUG explicitly rejects unsupported service types; MSORG explicitly supports data, airtime, and cable plus a separate electricity method.

No adapter implements transaction-status lookup or callback reconciliation. `Vtu_http` exposes one JSON POST method only.

## D. Pricing semantics

| Field | Current meaning |
|---|---|
| `service_type` | Product family / dispatch key, such as `data`, `airtime`, `cable`, `electricity`, or `result_checker`. |
| `provider` | Customer-facing network or biller for common VTU rows (MTN, GLO, Airtel, DStv); it is also passed as `provider_code` for adapter-specific biller mapping. Some legacy comments incorrectly call it the API provider. |
| `api_provider` | Upstream adapter/config identity (ADE, MSORG, SMEPLUG, INTERNAL). It is matched to `provider_configs.name`. |
| `plan_code` | Upstream-provider-specific product/plan identifier. It is not canonical across APIs. |
| `plan_category` | Display/group label (`NORMAL`, `SME`, `GIFTING`, `CORPORATE`, `CORPORATE2`). DataPage uses it as a customer filter; it does not affect routing. |
| `cost_price` | Expected provider acquisition cost, copied to transactions for margin reporting when the relevant path supplies it. |
| `selling_price` | Customer debit amount for plan purchases and retail basis for API price calculations. |

The admin UI separately edits API provider, network/biller, plan code, category, cost, selling price, and active status (`frontend/src/components/admin/AdminPricing.tsx:1283-1409`). It supports search and filters for service, API provider, network/biller, category, status, and margin; filters are client-side and persisted in the query string (`:262-338,507-527`). CSV import uses a canonical key containing `service_type + api_provider + provider + plan_code` (`backend/application/controllers/api/Admin_Pricing.php:500-518`).

## E. Gateway convergence

The generic gateway accepts either a bearer token or reseller `X-Api-Key`, checks reseller service access, and dispatches VTU purchase actions to `_call_provider()` (`backend/application/controllers/api/Gateway.php:28-168`). That method calls the same `Vtu_service` functions used by the app (`:253-359`). Dedicated `/gateway/data` and `/gateway/airtime` routes also call `Vtu_service` (`:662-791`).

Therefore, one routing implementation inside the orchestration layer can serve both user classes. Do not build routing logic in `Gateway.php`.

Two caveats:

- Dedicated reseller data/airtime success responses omit both internal and provider references (`Gateway.php:858-873`).
- Result checker still has a separate direct-ADE orchestration in `ResultChecker.php`, even though the generic gateway can dispatch `result_checker` through the generic plan path. That duplication must be removed or delegated before failover is enabled for that service.

## F. Current UI and navigation

- `/admin/*` renders `AdminDashboard`; the sidebar section IDs select components rather than distinct React route definitions (`frontend/src/App.tsx:80`; `frontend/src/pages/AdminDashboard.tsx:34-73`).
- Sidebar and permission catalog expose separate `pricing` and `api-settings` sections (`frontend/src/components/admin/AdminSidebar.tsx:34-40`; `frontend/src/config/adminPermissions.ts:8-14`).
- API Settings loads all provider rows, chooses the active row (or first row) for each service card, saves credentials, and activates via `/admin/providers/:id/toggle`.
- Live API Routing is duplicated in API Settings and Pricing. Both are service-level exclusive switches, not ordered routes and not network/category-specific rules.
- Pricing fetches all pricing plus all provider configs. It supports CRUD, CSV validate/commit, filters, margin display, and manual activation of price rows.
- Public DataPage filters visible active data rows by network and category. Public Airtime/Cable filter by the customer-facing `provider`. Provider API identity is returned by endpoints but is not a routing choice exposed to customers.

## Blocking findings

1. Transport ambiguity is treated as definitive failure and refunded.
2. There is no durable pre-call purchase intent or provider-attempt journal.
3. Upstream/client/stored references are fragmented.
4. Provider idempotency and status-lookup guarantees are unverified; MSORG sends no request reference.
5. Data plan codes are provider-specific with no canonical product map.
6. No routing-rule, ordered priority, health, or circuit-breaker schema exists.
7. Schema drift prevents reliable deployment of the current application, let alone routing foundations.
8. ADE's advertised service list does not match its implemented request shapes.
9. Result checker duplicates orchestration outside `Vtu_service`.

These are release blockers for automatic failover, not reasons to change current production routing during this audit phase.
