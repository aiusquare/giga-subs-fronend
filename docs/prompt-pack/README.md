# GigaData Admin Reproduction Prompt Pack

This folder contains the implementation prompts for the admin changes developed in the referenced Codex chat. Run them in numeric order against the GigaData workspace:

- `frontend/` — React, TypeScript, Vite, TanStack Query and shadcn/ui
- `backend/` — CodeIgniter 3 and MySQL, located beside `frontend/`

Each prompt is intentionally self-contained, but later prompts assume earlier database and application changes exist. Give one file at a time to Codex. Let it inspect the repository before editing and require it to preserve unrelated work in the dirty worktree.

## Execution order

1. `01-admin-dashboard-review.md` — read-only product and code audit.
2. `02-operational-admin-dashboard.md` — command-centre dashboard and transaction-route fix.
3. `03-service-pricing-filters.md` — advanced client-side pricing filters.
4. `04-bulk-pricelist-import.md` — CSV template, preview, validation and transactional import.
5. `05-csv-bom-compatibility.md` — UTF-8 BOM and legacy plan-code compatibility.
6. `06-api-specific-pricing-routing.md` — separate API source from network/biller and add exclusive live routing.
7. `07-api-settings-filters.md` — search and filtering on API Settings.
8. `08-provider-credential-reuse.md` — securely reuse saved provider credentials.
9. `09-revenue-profit-accounting.md` — persist transaction costs and repair profit calculation.
10. `10-api-settings-live-routing.md` — add the instant API switcher to API Settings.
11. `11-msorg-api-integration.md` — integrate MSORG data, airtime, electricity and cable services.
12. `12-vtu-gateway-endpoints.md` — dedicated `/gateway/data` and `/gateway/airtime` endpoints with VTU-style request/response envelope.

## Required deployment note

Prompt 06 creates `backend/database/add_api_provider_to_pricing.sql`. Run this one-time migration before deploying the corresponding backend code. Do not expose API secrets in frontend responses or logs.

## Expected verification

At the end of each implementation prompt, Codex should run checks proportionate to the files changed:

```text
npx eslint <changed frontend files>
npm run build
npm test -- --run
php -l <each changed PHP file>
git diff --check -- <changed tracked frontend files>
```

Existing unrelated TypeScript errors or dirty-worktree changes must be reported but not rewritten.
