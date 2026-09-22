# Provider Capability Matrix

Audit date: 2026-09-12

## Reading this matrix

This matrix records what the checked-in adapters actually do. It does not infer upstream guarantees from field names or comments. In particular:

- **Reference sent** means the adapter includes a client-generated value in the request.
- **Idempotency support** remains **unverified** until authoritative provider documentation and replay tests establish uniqueness scope, retention, and response behavior.
- **Status lookup** means a callable lookup/requery implementation in this repository. None exists.
- **Safe retry** means retry after an ambiguous first attempt. No provider/service is approved for this today.
- “Definitive failure” below describes response shapes the adapter labels failed. It does not certify all of them as safe for failover; that needs provider-specific fixtures and documentation.

## Implemented purchase capabilities

| Provider | Service | Idempotency support | Reference field | Supports status lookup | Safe retry capability | Plan-code type | Network / biller mapping | Known definitive failures | Known ambiguous failures |
|---|---|---|---|---|---|---|---|---|---|
| ADE | Data | Reference sent; provider guarantee unverified | `request-id = TXN…` | No implementation; upstream unknown | No | Opaque provider code sent as `data_plan` | App `1/2/3/4` (MTN/GLO/9mobile/Airtel) -> ADE `1/3/4/2` | Any business status outside success/pending vocabulary; explicit insufficient text is masked | cURL error/timeout, empty body, invalid JSON; unknown or missing status may also be ambiguous but is currently failed |
| ADE | Airtime | Reference sent with prefix; guarantee unverified | `request-id = Airtime_ATX…` | No implementation; upstream unknown | No | None; `plan_type=VTU`, free amount | Same `1/3/4/2` mapping | Any non-success/non-pending status; insufficient text masked | Same transport/parse cases; malformed/unknown status after send |
| ADE | Electricity | Reference sent with prefix; guarantee unverified | `request-id = Bill_ELX…` | No implementation; upstream unknown | No | `disco` integer plus meter type; not a pricing plan code | Disco is passed through as an ADE integer; controller exposes 1-11 static ADE mapping | Any non-success/non-pending status; insufficient message masked | Same transport/parse cases; missing token on claimed success is not treated as failure |
| ADE | Result checker | Reference sent with prefix; guarantee unverified | `request-id = RESULTCHECKER_RC…` | No implementation; upstream unknown | No | Numeric exam ID from `service_pricing.plan_code` | No mobile network; exam ID mapping only | Anything not normalized `completed`, including provider pending, is returned as failed by this method | Transport/parse cases; a pending provider result is incorrectly collapsed to failed/refund |
| MSORG | Data | No client reference sent | None | No implementation; upstream unknown | No | Numeric strings cast to integer; otherwise opaque string in `plan` | App codes map 1:1 to MSORG `1/2/3/4` | Explicit error fields, false/failure status, unrecognized terminal status; low balance text masked | Transport/parse cases; missing status on 2xx is currently assumed completed, which can hide ambiguity |
| MSORG | Airtime | No client reference sent | None | No implementation; upstream unknown | No | None; `airtime_type=VTU`, free amount | 1:1 `1/2/3/4` | Same MSORG parser behavior | Same; no stable request key for reconciliation is sent |
| MSORG | Cable | No client reference sent | None | No implementation; upstream unknown | No | `cableplan`, numeric-or-string | `provider_code`: DStv->1, GOtv->2, StarTimes->3; numeric values pass through | Same MSORG parser behavior | Same; provider/biller fallback value may pass through unchecked |
| MSORG | Electricity | No client reference sent | None | No implementation; upstream unknown | No | `disco_name` numeric-or-string; `MeterType` 1 prepaid / 2 postpaid | Disco value passes through | Same MSORG parser behavior | Same; token absence is allowed even on completed result |
| SMEPLUG | Data | `customer_reference` sent; provider guarantee unverified | `customer_reference = TXN…` | No implementation; upstream unknown | No | Numeric strings cast to integer; otherwise opaque `plan_id` | App `1/2/3/4` -> SMEPLUG `1/4/3/2` | Explicit `error/errors/detail`, or `status` not strictly true; wallet/low-balance message masked | Transport/parse cases; HTTP status is ignored by parser; pending is not represented and becomes failed |
| SMEPLUG | Airtime | `customer_reference` sent; provider guarantee unverified | `customer_reference = ATX…` | No implementation; upstream unknown | No | None; free amount | Same `1/4/3/2` mapping | Same SMEPLUG parser behavior | Same transport/parse and pending-collapse risks |

## Claimed versus callable capability

| Provider/service | Repository claim | Actual dispatch behavior | Decision |
|---|---|---|---|
| ADE cable | Admin UI lists ADE as supporting cable. | `Ade_provider::purchase()` has only `airtime` and an `else` branch shaped as data. | Treat as unsupported. Do not configure or route until a cable-specific adapter method and tests exist. |
| ADE scratch card | Admin UI lists support. | Same non-airtime path would send a data payload. | Treat as unsupported. |
| ADE result checker | UI lists support. | A working specialized method exists, but `ResultChecker.php` calls it directly; generic `Vtu_service::purchase()` does not dispatch to it. | Supported only through the dedicated controller today; orchestration must be unified. |
| SMEPLUG pending | File header claims normalized `pending`. | Parser returns only completed or failed. | Pending is not supported by the implementation. |
| MSORG request identity | `Vtu_service` gives every adapter a `reference`. | MSORG payload builders never include it. | No application request identity reaches MSORG. |

## Response normalization details

### ADE

- Completed vocabulary: `successful`, `success`, `delivered`, `complete`, `completed`.
- Pending vocabulary: `pending`, `process`, `processing`, `queued`, `initiated`.
- Every other value, including a missing status, becomes `failed`.
- Provider reference is taken from `request-id` or `id` for data/airtime, and `request-id` for electricity.
- Result checker accepts only completed; normalized pending is turned into `_failed_rc()`.

Evidence: `backend/application/libraries/providers/Ade_provider.php:46-159,191-242,268-336`.

### MSORG

- Reads `status`, `Status`, `transaction_status`, or `success`.
- Completed and pending vocabularies are broader than ADE's.
- `error`, `errors`, `non_field_errors`, or boolean `success=false` override status to failure.
- A 2xx response with no status and no recognized error becomes completed.
- Provider reference is opportunistically read from five possible fields.

Evidence: `backend/application/libraries/providers/Msorg_provider.php:94-198`.

### SMEPLUG

- Explicit `error`, `errors`, or `detail` fails first.
- Only `status === true`, `'true'`, or `1` is success.
- Success always becomes completed; there is no pending branch.
- Provider reference comes from `data.reference` or root `reference`.

Evidence: `backend/application/libraries/providers/Smeplug_provider.php:128-207`.

## HTTP behavior shared by all adapters

`Vtu_http::post()` uses JSON POST, IPv4, a 10-second connect timeout, a configured/default total timeout (default 25 seconds), optional SSL verification that currently defaults false, and Authorization `Token` or `Bearer` (`backend/application/libraries/Vtu_http.php:51-71`). It returns `ok=false` only for cURL error, empty raw response, or JSON decode error. It returns `ok=true` for any HTTP status when JSON decoded, so adapters must interpret status codes but currently do so incompletely.

The client logs the full response body (`Vtu_http.php:80-98`). Provider bodies may contain electricity tokens, exam PINs, customer identifiers, internal pricing, or other sensitive data; redaction is required.

## Evidence needed before enabling failover

For every provider/service pair, obtain and test:

1. Authoritative request/response documentation and version.
2. Reference uniqueness scope, maximum length/characters, retention, and duplicate-request semantics.
3. Status lookup endpoint, lookup key, terminal/pending states, and retention.
4. Exact validation, authentication, provider-balance, product-unavailable, and rate-limit responses.
5. Timeout behavior and whether the provider may fulfil after the client disconnects.
6. Sandbox replay tests using the same reference before and after success, pending, and timeout.
7. Network/biller IDs and plan catalog export with version/timestamp.
8. Confirmation that a rejected response guarantees no later fulfilment.

Until those artifacts exist, the only safe policy is: unknown/transport/parse outcome after a possible send becomes pending/ambiguous, and no next provider is called.
