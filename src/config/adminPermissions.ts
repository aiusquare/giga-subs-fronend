export const ADMIN_PAGE_PERMISSIONS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "users", label: "Users" },
  { id: "migrations", label: "Migrations" },
  { id: "transactions", label: "Transactions" },
  { id: "analytics", label: "Analytics" },
  { id: "services", label: "Services" },
  { id: "pricing", label: "Pricing" },
  { id: "tickets", label: "Support Tickets" },
  { id: "promotions", label: "Promotions" },
  { id: "notifications", label: "Notifications" },
  { id: "api-settings", label: "API Settings" },
  { id: "api-reseller", label: "API Reseller" },
  { id: "api-logs", label: "API Logs" },
  { id: "result-checker", label: "Exam Pins" },
  { id: "identity-updates", label: "Identity Updates" },
  { id: "settings", label: "Settings" },
] as const;

export type AdminPagePermission = (typeof ADMIN_PAGE_PERMISSIONS)[number]["id"];
