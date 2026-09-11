# Prompt 02 — Build the Operational Admin Dashboard

Implement the operational Admin Dashboard recommended by the audit. The backend folder is a sibling of the frontend folder. Preserve unrelated work already present in both trees.

## Backend

Add an authenticated admin endpoint such as `GET /api/v1/admin/dashboard` that returns one compact payload containing:

- Today's completed service revenue and profit, excluding funding/admin-credit/admin-debit/wallet transaction types.
- Today's transaction count, success rate and new-user count.
- Percentage comparisons against yesterday, with `null` when no baseline exists.
- Attention counts: all pending, pending older than 30 minutes, failed in 24 hours, inactive services, API errors in 24 hours, open tickets, urgent/high tickets and tickets awaiting staff reply.
- A filled seven-day revenue/profit/transaction trend.
- Thirty-day service performance: active state, transaction count, revenue and success rate.
- Recent transaction exceptions: failed, refunded or aged pending.
- Oldest unresolved support tickets.

Use configured pricing cost for profit and store numbers with explicit numeric casts. Add the route and require admin authorization.

## Frontend

Create an `AdminOverview` component using the existing design system. It must include:

- Revenue today, profit today, transactions, success rate and new users.
- Clear yesterday comparisons.
- Clickable attention cards that route to the appropriate filtered admin page.
- Seven-day revenue/profit chart.
- Service-performance table.
- Exception-only transaction feed, not the entire transaction table.
- Support queue and quick actions.
- Loading, empty and API-error states, plus a manual refresh action and periodic refresh.

Fix `AdminDashboard.tsx` so `/admin/transactions` explicitly renders `AdminTransactions`, while `/admin` renders `AdminOverview`. Make `AdminTransactions` initialize its status, type and search state from URL query parameters so dashboard links work.

Do not remove Analytics or the dedicated management pages. Verify PHP syntax, targeted frontend lint, production build and tests.
