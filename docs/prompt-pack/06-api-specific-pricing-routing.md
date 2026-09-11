# Prompt 06 — Add API-Specific Pricelists and Instant Routing

GigaData supports multiple upstream APIs such as ADE and MSORG. Separate the upstream API source from the customer-facing network/biller in pricing.

Example: Data can have an ADE pricelist and an MSORG pricelist for MTN/Airtel/Glo. When Data's active API changes from ADE to MSORG, only MSORG Data prices and plan codes must be exposed and used immediately.

## Database

Create a one-time migration adding `service_pricing.api_provider`. Backfill rows that previously stored the API name in `provider`, otherwise inherit the active API for that service, and mark unresolved rows clearly. Replace the old pricing unique index with:

```text
service_type + api_provider + provider + plan_code
```

Add an API-provider index and update the canonical schema/seeds. Normalize legacy multiple-active provider configs to one active row per service.

## Backend behavior

- Keep `service_pricing.provider` as network/biller.
- Make provider activation exclusive per service in `Provider_config_model`; activating MSORG Data deactivates ADE Data.
- Scope public pricing, active-plan lookup and purchase-plan lookup to the currently active provider config through `api_provider`.
- Preserve INTERNAL pricing behavior.
- Reject stale plan IDs from an API that became inactive, before wallet debit.
- Apply stale-plan protection to result-checker purchases too.
- Return `api_provider` in appropriate pricing/admin/API responses.
- Avoid duplicated analytics caused by joining multiple API pricelists; prefer stored transaction cost and safe scalar fallbacks.

## Pricing admin

- Add API Provider separately from Network/Biller in add/edit, table, search and filters.
- Mark the active API as Live.
- Add a Live API Routing panel with Service and Active API selects.
- Switching must call the exclusive backend toggle immediately.
- Extend CSV template/export/import with `api_provider`; older CSVs may infer the active provider with a warning.
- Include `api_provider` in bulk row identity.

## API Settings

Make the provider selector load an existing provider row for the selected service/name instead of overwriting a different provider. Allow creating a new provider configuration while retaining existing configurations. Saving an active config must make it exclusive.

Run the migration before deploying the matching backend. Verify all affected PHP files, targeted frontend lint, production build and tests.
