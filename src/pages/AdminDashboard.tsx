import { Menu } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTransactions } from "@/components/admin/AdminTransactions";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminApiSettings } from "@/components/admin/AdminApiSettings";
import { AdminApiReseller } from "@/components/admin/AdminApiReseller";
import { AdminApiLogs } from "@/components/admin/AdminApiLogs";
import { AdminPricing } from "@/components/admin/AdminPricing";
import { AdminPromotions } from "@/components/admin/AdminPromotions";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminServices } from "@/components/admin/AdminServices";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { AdminResultChecker } from "@/components/admin/AdminResultChecker";
import { AdminTickets } from "@/components/admin/AdminTickets";
import { AdminRebrand } from "@/components/admin/AdminRebrand";
import { AdminMigrations } from "@/components/admin/AdminMigrations";
import { AdminIdentityUpdates } from "@/components/admin/AdminIdentityUpdates";
import { AdminProviderRouting } from "@/components/admin/AdminProviderRouting";
import { ShieldX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { "*": sectionParam } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const activeSection = sectionParam || "dashboard";
  const canAccessSection =
    user?.role === "admin" || user?.permissions?.includes(activeSection);

  const setActiveSection = (section: string) => {
    navigate(section === "dashboard" ? "/admin" : `/admin/${section}`);
    setSidebarOpen(false);
  };

  const renderContent = () => {
    if (!canAccessSection) {
      return (
        <div className="glass-card mx-auto flex max-w-lg flex-col items-center gap-4 p-8 text-center">
          <ShieldX className="h-10 w-10 text-destructive" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Page access denied
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask an administrator to grant access to this admin page.
            </p>
          </div>
        </div>
      );
    }
    switch (activeSection) {
      case "analytics":
        return <AdminAnalytics />;
      case "users":
        return <AdminUsers />;
      case "migrations":
        return <AdminMigrations />;
      case "transactions":
        return <AdminTransactions />;
      case "services":
        return <AdminServices />;
      case "pricing":
        return <AdminPricing />;
      case "routing-failover":
        return <AdminProviderRouting />;
      case "promotions":
        return <AdminPromotions />;
      case "notifications":
        return <AdminNotifications />;
      case "api-settings":
        return <AdminApiSettings />;
      case "api-reseller":
        return <AdminApiReseller />;
      case "api-logs":
        return <AdminApiLogs />;
      case "result-checker":
        return <AdminResultChecker />;
      case "identity-updates":
        return <AdminIdentityUpdates />;
      case "tickets":
        return <AdminTickets />;
      case "reset":
        return <AdminRebrand />;
      case "settings":
        return <AdminSettings />;
      case "dashboard":
      default:
        return <AdminOverview />;
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case "users":
        return "User Management";
      case "migrations":
        return "Customer Migrations";
      case "transactions":
        return "Transactions";
      case "analytics":
        return "Analytics";
      case "services":
        return "Services Management";
      case "pricing":
        return "Service Pricing";
      case "routing-failover":
        return "Routing & Failover";
      case "promotions":
        return "Promotions";
      case "notifications":
        return "Notifications";
      case "api-settings":
        return "API Settings";
      case "api-reseller":
        return "API Reseller Management";
      case "api-logs":
        return "API Usage Logs";
      case "result-checker":
        return "Exam Pins";
      case "identity-updates":
        return "Identity Update Requests";
      case "tickets":
        return "Support Tickets";
      case "reset":
        return "Rebrand / Reset";
      case "settings":
        return "Settings";
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="flex min-h-screen min-w-0 bg-background">
      <AdminSidebar
        activeItem={activeSection}
        onItemClick={setActiveSection}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="min-h-screen min-w-0 flex-1 overflow-x-hidden">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <button
                className="lg:hidden text-foreground"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold text-foreground sm:text-xl">
                  {getSectionTitle()}
                </h1>
                <p className="hidden text-sm text-muted-foreground sm:block">
                  Welcome back, Admin
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-sm font-bold text-primary-foreground sm:h-10 sm:w-10">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="min-w-0 p-3 sm:p-4 lg:p-8">{renderContent()}</div>
      </main>
    </div>
  );
};

export default AdminDashboard;
