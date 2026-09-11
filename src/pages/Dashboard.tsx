import { Header } from "@/components/Header";
import { BalanceCard } from "@/components/BalanceCard";
import { QuickActions } from "@/components/QuickActions";
import { PromotionalCards } from "@/components/PromotionalCards";
import { TransactionHistory } from "@/components/TransactionHistory";
import { BottomNav } from "@/components/BottomNav";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Dashboard = () => {
  const { isAdmin } = useAdminRole();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container max-w-lg mx-auto px-4">
        <Header />

        <div className="space-y-6">
          <BalanceCard />

          {isAdmin && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate("/admin")}
                  className="w-full flex items-center gap-3 p-3 md:p-4 rounded-2xl bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-primary-foreground"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">
                      Admin Dashboard
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Manage users, services & more
                    </p>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Go to Admin Dashboard</p>
              </TooltipContent>
            </Tooltip>
          )}

          <PromotionalCards />
          <QuickActions />
          <TransactionHistory />
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
