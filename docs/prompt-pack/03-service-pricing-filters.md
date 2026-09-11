# Prompt 03 — Improve Service Pricing Filters

Improve filtering in `frontend/src/components/admin/AdminPricing.tsx` without adding backend pagination, because the current dataset is small.

Implement:

- Search across plan name, plan code and provider.
- Service filter.
- Dynamic provider filter derived from loaded pricing and narrowed by selected service.
- Plan-category filter.
- Active/inactive status filter.
- Margin-health filters: loss-making, zero margin, below 5%, 5–10%, and 10%+.
- Sorting by recent update, provider, price, profit and margin in both useful directions.
- Clear filters, active-filter count and `Showing X of Y` result text.
- URL persistence for search, filters and non-default sorting.
- Automatic provider reset when a service selection makes the current provider invalid.

Keep all mutations, add/edit dialog behavior and pricing calculations intact. Use memoized derived lists/results and preserve responsive layout. Run targeted lint, build and tests.
