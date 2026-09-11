import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { 
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Activity,
  CreditCard,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatItem {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: React.ElementType;
}

function formatNaira(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`;
  return `₦${n.toLocaleString()}`;
}

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function AdminStats() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.get("/admin/stats"),
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-5 flex items-center justify-center h-24">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ))}
      </div>
    );
  }

  const stats: StatItem[] = [
    {
      label: "Total Revenue",
      value: formatNaira(data?.total_revenue ?? 0),
      change: data?.revenue_change != null ? `${data.revenue_change > 0 ? "+" : ""}${data.revenue_change.toFixed(1)}%` : "—",
      trend: (data?.revenue_change ?? 0) >= 0 ? "up" : "down",
      icon: Wallet,
    },
    {
      label: "Total Users",
      value: formatCount(data?.total_users ?? 0),
      change: data?.user_change != null ? `+${data.user_change}` : "—",
      trend: "up",
      icon: Users,
    },
    {
      label: "Transactions",
      value: formatCount(data?.total_transactions ?? 0),
      change: data?.tx_change != null ? `${data.tx_change > 0 ? "+" : ""}${data.tx_change.toFixed(1)}%` : "—",
      trend: (data?.tx_change ?? 0) >= 0 ? "up" : "down",
      icon: Activity,
    },
    {
      label: "Pending",
      value: formatCount(data?.pending_transactions ?? 0),
      change: "—",
      trend: "neutral",
      icon: CreditCard,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <stat.icon className="w-5 h-5 text-primary" />
            </div>
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              stat.trend === "up" && "text-success",
              stat.trend === "down" && "text-destructive",
              stat.trend === "neutral" && "text-muted-foreground",
            )}>
              {stat.trend === "up" && <TrendingUp className="w-4 h-4" />}
              {stat.trend === "down" && <TrendingDown className="w-4 h-4" />}
              {stat.change}
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          <p className="text-sm text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
