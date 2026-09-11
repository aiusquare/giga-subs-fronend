# Prompt 12 — Dedicated VTU Data and Airtime API Endpoints

Add two new gateway endpoints that expose data and airtime purchases through a familiar
Nigerian VTU-style request/response format — matching the parameter names and response
envelope used by popular upstream providers such as MSORG so resellers can integrate
with minimal translation on their side.

Inspect both applications before editing:

- `frontend/` — React, TypeScript, Vite, TanStack Query and shadcn/ui.
- `backend/` — CodeIgniter 3, located beside `frontend/`.

Preserve unrelated dirty-worktree changes. Both endpoints must share the same
authentication, wallet, and transaction lifecycle used by the existing generic gateway.
Never expose upstream provider credentials or reseller wallet balances beyond what is
described in the response envelope below.

---

## New endpoints

### `POST /api/v1/gateway/data`

Purchase a mobile data bundle.

**Request body (JSON)**

| Field           | Type    | Required | Description                                          |
| --------------- | ------- | -------- | ---------------------------------------------------- |
| `network`       | integer | yes      | `1` = MTN, `2` = Glo, `3` = 9mobile, `4` = Airtel    |
| `mobile_number` | string  | yes      | 11-digit Nigerian phone number                       |
| `plan`          | string  | yes      | `plan_code` from the active pricing table            |
| `Ported_number` | boolean | no       | `true` if the number was ported; defaults to `false` |

**Success response — HTTP 200**

```json
{
  "Status": "successful",
  "status": "success",
  "api_response": {
    "status": "success",
    "message": "Data purchase successful"
  },
  "message": "Data purchase successful",
  "balance_before": "10000.00",
  "balance_after": "9500.00"
}
```

**Failure response — HTTP 200**

```json
{
  "Status": "fail",
  "status": "fail",
  "message": "Insufficient wallet balance",
  "api_response": null,
  "balance_before": "100.00",
  "balance_after": "100.00"
}
```

---

### `POST /api/v1/gateway/airtime`

Purchase airtime (VTU top-up).

**Request body (JSON)**

| Field           | Type          | Required | Description                                          |
| --------------- | ------------- | -------- | ---------------------------------------------------- |
| `amount`        | number        | yes      | Recharge amount in Naira (₦50 – ₦50,000)             |
| `network`       | string or int | yes      | `"MTN"`, `"Airtel"`, `"Glo"`, `"9mobile"` or `1`–`4` |
| `mobile_number` | string        | yes      | 11-digit Nigerian phone number                       |
| `Ported_number` | boolean       | no       | `true` if the number was ported; defaults to `false` |
| `airtime_type`  | string        | no       | Informational; e.g. `"VTU"`. Not forwarded upstream. |

**Success response — HTTP 200**

```json
{
  "Status": "successful",
  "status": "success",
  "api_response": {
    "status": "success",
    "message": "Airtime purchase successful"
  },
  "message": "Airtime purchase successful",
  "balance_before": "10000.00",
  "balance_after": "9000.00"
}
```

**Failure response — HTTP 200**

Same envelope as data: `Status: "fail"`, `status: "fail"`, `api_response: null`,
`balance_before` and `balance_after` both set to the current wallet balance.

---

## Authentication

Both endpoints accept the same authentication methods as the existing generic gateway:

| Method       | Header                        | Notes                                   |
| ------------ | ----------------------------- | --------------------------------------- |
| Bearer token | `Authorization: Bearer <tok>` | Standard user session token             |
| API key      | `X-Api-Key: <key>`            | Reseller key; must have service enabled |

Reseller keys are checked against `ApiSubscription_model::is_service_enabled()` for
`'data'` and `'airtime'` respectively. Return `Status: fail` (not a 401) when the
service is not enabled for a reseller key.

---

## Backend implementation

### Routes — `application/config/routes.php`

Add the two new routes **before** the generic gateway route so they are matched first:

```php
// Dedicated VTU endpoints
$route['api/v1/gateway/data']['POST']    = 'api/Gateway/data_purchase';
$route['api/v1/gateway/airtime']['POST'] = 'api/Gateway/airtime_purchase';
// Generic structured gateway (all other services)
$route['api/v1/gateway']['POST'] = 'api/Gateway/handle';
```

### Controller — `application/controllers/api/Gateway.php`

Add to the `Gateway` class (before the closing brace):

**Public methods**

- `data_purchase()` — calls `Pricing_model::find_active_plan('data', $plan)` to resolve
  the plan UUID, snapshots `wallet_balance` via `Profile_model::get_by_user_id()` before
  the purchase, then calls `vtu_service->purchase()`. Outputs the VTU envelope directly
  via `echo json_encode(...); exit` — never use `$this->respond()`.

- `airtime_purchase()` — same pattern but calls `vtu_service->purchase_airtime()`.
  Accepts both name strings and integer codes for `network` via the
  `_resolve_network_name()` helper.

Both methods call `set_time_limit(90)` at the top.

**Private helpers**

- `_authenticate_caller_vtu(): array` — extracts `X-Api-Key` or `Bearer` token, validates
  via `ApiSubscription_model` or `Auth_token_model`, returns
  `['user_id' => ..., 'is_reseller' => bool]`. Calls `$this->respond_error()` + `exit`
  on failure.

- `_resolve_network_name($value): ?int` — accepts a name (`"MTN"`, `"Airtel"`, `"Glo"`,
  `"9mobile"`, `"etisalat"`) or integer `1`–`4`; returns the internal network code or
  `null` for unrecognised input.

- `_vtu_success(string $message, float $balance_before, float $balance_after): void` —
  sets `Content-Type: application/json`, outputs the success envelope and exits.

- `_vtu_fail(string $message, string $user_id, ?float $balance_before = null): void` —
  fetches the current wallet balance from `Profile_model` when `$balance_before` is
  `null`, outputs the failure envelope and exits. Always returns HTTP 200 so client
  libraries can parse the JSON.

---

## Validation rules

| Rule            | Data endpoint                      | Airtime endpoint                     |
| --------------- | ---------------------------------- | ------------------------------------ |
| Required fields | `network`, `mobile_number`, `plan` | `amount`, `network`, `mobile_number` |
| Network range   | Integer 1–4                        | Name string or integer 1–4           |
| Phone format    | `/^\d{11}$/`                       | `/^\d{11}$/`                         |
| Plan existence  | Must match active `plan_code`      | N/A                                  |
| Amount range    | N/A                                | ₦50 – ₦50,000                        |

---

## Verification

```text
php -l application/controllers/api/Gateway.php
php -l application/config/routes.php
```

No frontend changes are required; reseller clients call the new endpoints directly.
