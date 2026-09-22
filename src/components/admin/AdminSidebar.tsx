import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  X,
  Key,
  DollarSign,
  Megaphone,
  Bell,
  Package,
  Globe,
  Activity,
  UserRoundPlus,
  GraduationCap as _GraduationCap,
  Ticket,
  RefreshCw,
  Fingerprint,
  Route,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { siteConfig } from "@/config/site";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: Users, label: "Users", id: "users" },
  { icon: UserRoundPlus, label: "Migrations", id: "migrations" },
  { icon: CreditCard, label: "Transactions", id: "transactions" },
  { icon: BarChart3, label: "Analytics", id: "analytics" },
  { icon: Package, label: "Services", id: "services" },
  { icon: DollarSign, label: "Pricing", id: "pricing" },
  { icon: Route, label: "Routing & Failover", id: "routing-failover" },
  { icon: Ticket, label: "Support Tickets", id: "tickets" },
  { icon: Megaphone, label: "Promotions", id: "promotions" },
  { icon: Bell, label: "Notifications", id: "notifications" },
  { icon: Key, label: "API Settings", id: "api-settings" },
  { icon: Globe, label: "API Reseller", id: "api-reseller" },
  { icon: Activity, label: "API Logs", id: "api-logs" },
  { icon: Fingerprint, label: "Identity Updates", id: "identity-updates" },
  // { icon: RefreshCw, label: "Rebrand / Reset", id: "reset" },
  { icon: Settings, label: "Settings", id: "settings" },
];

interface AdminSidebarProps {
  activeItem: string;
  onItemClick: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({
  activeItem,
  onItemClick,
  isOpen,
  onClose,
}: AdminSidebarProps) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const visibleItems = sidebarItems.filter(
    (item) => user?.role === "admin" || user?.permissions?.includes(item.id),
  );

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <>
      {/* Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-full min-h-0 flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm"
                style={{ background: "var(--gradient-primary)" }}
              >
                {siteConfig.name
                  .split(" ")
                  .map((w: string) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <span className="font-bold text-lg text-sidebar-foreground">
                {siteConfig.name} Admin
              </span>
            </div>
            <button
              className="lg:hidden text-sidebar-foreground"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4 overscroll-contain">
            {visibleItems.map((item) => (
              <button
                key={item.label}
                onClick={() => onItemClick(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  activeItem === item.id
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-sidebar-border">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
