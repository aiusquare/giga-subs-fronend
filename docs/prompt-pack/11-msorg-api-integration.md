# Prompt 11 — Integrate All MSORG / Maskawa VTU Services

Integrate the MSORG API using the published Postman documentation as the source of truth:

```text
https://documenter.getpostman.com/view/25362265/2s8ZDU64ZK?version=latest
```

Inspect both applications before editing:

- `frontend/` — React, TypeScript, Vite, TanStack Query and shadcn/ui.
- `backend/` — CodeIgniter 3, located beside `frontend/`.

Preserve unrelated dirty-worktree changes. Keep the MSORG token exclusively on the backend; never call MSORG directly from browser code or expose credentials in API responses, logs or frontend environment variables.

## Supported services

Implement every purchase service documented by MSORG:

| Service | Method and endpoint | Required MSORG payload |
| --- | --- | --- |
| Data | `POST /api/data/` | `network`, `mobile_number`, `plan`, `Ported_number`; optional `payment_medium` |
| Airtime | `POST /api/topup/` | `network`, `amount`, `mobile_number`, `Ported_number`, `airtime_type: "VTU"` |
| Electricity | `POST /api/billpayment/` | `disco_name`, `amount`, `meter_number`, `MeterType` (`1` prepaid, `2` postpaid) |
| Cable TV | `POST /api/cablesub/` | `cablename`, `cableplan`, `smart_card_number` |

Authenticate upstream requests with:

```text
Authorization: Token <MSORG_API_TOKEN>
Content-Type: application/json
Accept: application/json
```

The configured URL may be the MSORG base API URL or the exact service endpoint. Resolve URLs safely without duplicating `/api` or the service path. Use `https://maskawasubapi.com/api` as the documented base and provide the exact endpoint automatically when an admin selects MSORG for a service.

## Backend adapter

Implement or correct the CodeIgniter MSORG provider adapter so it:

- Dispatches by `service_type` instead of sending one generic payload to every endpoint.
- Maps internal network IDs to MSORG IDs: MTN `1`, Airtel `2`, Glo `3`, 9mobile `4`.
- Converts configured cable provider names such as DStv, GOtv and StarTimes to the corresponding MSORG cable IDs while still accepting numeric IDs.
- Uses the saved pricing `plan_code` as MSORG's data `plan` or cable `cableplan`.
- Supports electricity through the existing wallet-safe electricity purchase lifecycle.
- Normalizes provider status variants into `completed`, `pending` or `failed`.
- Extracts provider references, reported cost and electricity tokens from reasonable documented/provider response variants.
- Treats transport, malformed JSON and definitive provider errors as failures.
- Masks upstream reseller-wallet balance errors from customers.
- Never marks an explicit error response as successful merely because it used an HTTP 2xx status.

Preserve the existing transaction lifecycle: validate the plan, reject stale inactive-provider plans, check and debit the local wallet, call MSORG, refund definitive failures, retain debits for pending requests, and store transaction/provider metadata.

## Frontend and admin

- List MSORG as supporting Data, Airtime, Electricity and Cable TV in API Settings.
- Auto-fill the correct published endpoint for the selected service while allowing a valid base URL override.
- Continue storing and reusing credentials separately for each provider/service configuration.
- Fix data purchases to send the backend's expected `ported` property.
- Replace hard-coded cable providers and prices with active `/pricing?service_type=cable` results.
- Derive cable providers from returned pricing rows, submit the selected pricing ID through the existing `/purchase` endpoint, require transaction-PIN confirmation, show loading/error/success/pending states, refresh the wallet and link successful or pending purchases to history.
- Do not embed upstream plan IDs, prices, tokens or provider secrets in frontend source.

## Acceptance criteria

- Switching a service's active provider to MSORG immediately selects only its MSORG pricelist.
- Data, airtime, electricity and cable requests each reach their documented MSORG endpoint with the documented field names and value types.
- Cable is a real purchase flow rather than a static demonstration screen.
- A failed upstream request refunds the customer exactly once; a pending request is not refunded.
- Electricity tokens are persisted in transaction metadata and returned to the customer flow.
- Existing ADE and other provider integrations continue to work.
- No real purchase is made during automated verification unless dedicated sandbox credentials are explicitly supplied.

Run targeted frontend lint, the production build, tests and PHP syntax checks for every changed PHP file. Report unrelated pre-existing warnings without rewriting unrelated files.
