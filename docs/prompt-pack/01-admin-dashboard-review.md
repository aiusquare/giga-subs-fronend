# Prompt 01 — Audit the Admin Dashboard

Without writing or modifying any code, study the GigaData frontend and the sibling CodeIgniter backend. Determine why the Admin Dashboard and Transactions navigation currently show effectively the same content.

Inspect at minimum:

- `frontend/src/pages/AdminDashboard.tsx`
- `frontend/src/components/admin/AdminStats.tsx`
- `frontend/src/components/admin/AdminTransactions.tsx`
- `frontend/src/components/admin/AdminAnalytics.tsx`
- Users, Services, API Logs and Support Tickets admin components/hooks
- Relevant admin routes and aggregation endpoints in `backend/application/`

Produce an evidence-based recommendation for an operational admin landing page. Separate a routing/rendering defect from the dashboard product design. Recommend a dashboard containing today's KPIs, actionable alerts, short trends, service health, transaction exceptions, support queue and quick actions. Keep the complete transaction table on the dedicated Transactions page and historical reporting on Analytics.

Explicitly identify any missing `transactions` render case that causes `/admin/transactions` to fall through to the dashboard default. Reference exact local files and lines in the report. Do not edit files.
