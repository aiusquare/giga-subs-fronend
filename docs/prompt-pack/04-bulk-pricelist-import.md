# Prompt 04 — Add Safe Bulk Pricelist CSV Import

Implement a safe CSV bulk-pricing workflow spanning the React frontend and sibling CodeIgniter backend.

## CSV columns

Use these initial columns:

```text
service_type,provider,plan_name,plan_code,plan_category,cost_price,selling_price,is_active
```

Profit and margin are calculated, never uploaded. Require plan code for new bulk rows and match existing rows by normalized `service_type + provider + plan_code`.

## Backend requirements

Add admin endpoints for validation and commit. Validation must:

- Accept only CSV, at most 2 MB and 1,000 non-empty rows.
- Validate required headers and reject duplicate headers.
- Validate service, category, lengths, booleans, non-negative numeric prices and selling price not below cost.
- Detect duplicate identities inside the uploaded file.
- Support `upsert`, `add_only` and `update_only` modes.
- Return row number, normalized data, action (`new`, `update`, `unchanged`, `skipped`, `error`), errors, warnings, matching row ID and previous values.
- Warn for margins below 5% and price changes of 20% or more.

Commit must revalidate the submitted rows, enforce the 1,000-row limit and apply all writes inside one database transaction. Return created, updated, unchanged and skipped counts. Never trust client-only validation.

## Frontend requirements

Add Template, Export and Upload Pricelist actions. The upload dialog must provide:

- CSV file selection and import-mode selection.
- Validate-and-preview before commit.
- Summary counts and a scrollable row preview.
- Old-to-new cost and price comparison.
- Clear invalid/error and warning presentation.
- Download of rejected rows with their original values and error messages.
- Import only valid/actionable changes and refresh pricing afterward.

Generate CSV downloads safely, including formula-injection protection. Preserve existing filters after import. Verify backend PHP and frontend lint/build/tests.
