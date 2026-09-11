import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Activity,
  Clock,
  Loader2,
  DollarSign,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface StatsData {
  total_revenue: number;
  revenue_this_month: number;
  revenue_last_month: number;
  revenue_change: number | null;
  total_users: number;
  user_change: number;
  total_transactions: number;
  tx_change: number | null;
  pending_transactions: number;
  total_profit: number;
  profit_this_month: number;
  profit_last_month: number;
  profit_change: number | null;
}

interface MonthRevenue {
  month: string; // "2025-04"
  revenue: number;
  tx_count: number;
}

interface MonthUsers {
  month: string;
  new_users: number;
}

interface ServiceBreakdown {
  type: string;
  tx_count: number;
  revenue: number;
}

interface StatusBreakdown {
  status: string;
  tx_count: number;
  volume: number;
}

interface MonthProfit {
  month: string;
  revenue: number;
  cost: number;
  profit: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatNaira(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`;
  return `₦${n.toLocaleString()}`;
}

function shortMonth(ym: string) {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("default", {
    month: "short",
    year: "2-digit",
  });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const SERVICE_COLORS: Record<string, string> = {
  data: "#6366f1",
  airtime: "#22c55e",
  scratch_card: "#f59e0b",
  funding: "#14b8a6",
  electricity: "#f97316",
  cable: "#8b5cf6",
};

const STATUS_COLORS: Record<string, string> = {
  completed: "#22c55e",
  pending: "#f59e0b",
  failed: "#ef4444",
  refunded: "#6366f1",
};

function serviceColor(type: string) {
  return SERVICE_COLORS[type] ?? "#94a3b8";
}
function statusColor(status: string) {
  return STATUS_COLORS[status] ?? "#94a3b8";
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------
interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ElementType;
}

function KpiCard({
  label,
  value,
  sub,
  trend = "neutral",
  icon: Icon,
}: KpiCardProps) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p
              className={`text-xs flex items-center gap-1 ${
                trend === "up"
                  ? "text-green-500"
                  : trend === "down"
                    ? "text-red-500"
                    : "text-muted-foreground"
              }`}
            >
              {trend === "up" && <TrendingUp className="w-3 h-3" />}
              {trend === "down" && <TrendingDown className="w-3 h-3" />}
              {sub}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------
function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div
      className="flex items-center justify-center bg-secondary/30 rounded-lg"
      style={{ height }}
    >
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function AdminAnalytics() {
  const { data: stats, isLoading: statsLoading } = useQuery<StatsData>({
    queryKey: ["admin-stats"],
    queryFn: () => api.get("/admin/stats"),
  });

  const { data: revenueData = [], isLoading: revenueLoading } = useQuery<
    MonthRevenue[]
  >({
    queryKey: ["analytics-revenue"],
    queryFn: () => api.get("/admin/analytics/revenue"),
  });

  const { data: usersData = [], isLoading: usersLoading } = useQuery<
    MonthUsers[]
  >({
    queryKey: ["analytics-users"],
    queryFn: () => api.get("/admin/analytics/users"),
  });

  const { data: servicesData = [], isLoading: servicesLoading } = useQuery<
    ServiceBreakdown[]
  >({
    queryKey: ["analytics-services"],
    queryFn: () => api.get("/admin/analytics/services"),
  });

  const { data: profitData = [], isLoading: profitLoading } = useQuery<
    MonthProfit[]
  >({
    queryKey: ["analytics-profit"],
    queryFn: () => api.get("/admin/analytics/profit"),
  });

  const { data: statusData = [], isLoading: statusLoading } = useQuery<
    StatusBreakdown[]
  >({
    queryKey: ["analytics-status"],
    queryFn: () => api.get("/admin/analytics/status"),
  });

  // Reshape for recharts
  const revenueChartData = revenueData.map((d) => ({
    ...d,
    month: shortMonth(d.month),
    revenue: Number(d.revenue),
  }));

  const usersChartData = usersData.map((d) => ({
    ...d,
    month: shortMonth(d.month),
    new_users: Number(d.new_users),
  }));

  const servicesChartData = servicesData.map((d) => ({
    ...d,
    name: capitalize(d.type.replace(/_/g, " ")),
    revenue: Number(d.revenue),
  }));

  const profitChartData = profitData.map((d) => ({
    month: shortMonth(d.month),
    revenue: Number(d.revenue),
    cost: Number(d.cost),
    profit: Number(d.profit),
  }));

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* KPI Cards                                                            */}
      {/* ------------------------------------------------------------------ */}
      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-5 flex justify-center items-center h-24">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard
            label="Total Revenue"
            value={formatNaira(stats?.total_revenue ?? 0)}
            sub={
              stats?.revenue_change != null
                ? `${stats.revenue_change >= 0 ? "+" : ""}${stats.revenue_change.toFixed(1)}% vs last month`
                : "vs last month"
            }
            trend={
              stats?.revenue_change == null
                ? "neutral"
                : stats.revenue_change >= 0
                  ? "up"
                  : "down"
            }
            icon={Wallet}
          />
          <KpiCard
            label="Revenue This Month"
            value={formatNaira(stats?.revenue_this_month ?? 0)}
            sub={`Last month: ${formatNaira(stats?.revenue_last_month ?? 0)}`}
            trend="neutral"
            icon={TrendingUp}
          />
          <KpiCard
            label="Total Users"
            value={(stats?.total_users ?? 0).toLocaleString()}
            sub={`+${stats?.user_change ?? 0} this month`}
            trend="up"
            icon={Users}
          />
          <KpiCard
            label="Pending Transactions"
            value={(stats?.pending_transactions ?? 0).toLocaleString()}
            sub={`${stats?.total_transactions ?? 0} total`}
            trend={(stats?.pending_transactions ?? 0) > 50 ? "down" : "neutral"}
            icon={Clock}
          />
          <KpiCard
            label="Total Profit"
            value={formatNaira(stats?.total_profit ?? 0)}
            sub={
              stats?.profit_change != null
                ? `${stats.profit_change >= 0 ? "+" : ""}${stats.profit_change.toFixed(1)}% vs last month`
                : "vs last month"
            }
            trend={
              stats?.profit_change == null
                ? "neutral"
                : stats.profit_change >= 0
                  ? "up"
                  : "down"
            }
            icon={DollarSign}
          />
          <KpiCard
            label="Profit This Month"
            value={formatNaira(stats?.profit_this_month ?? 0)}
            sub={`Last month: ${formatNaira(stats?.profit_last_month ?? 0)}`}
            trend="neutral"
            icon={TrendingUp}
          />
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Revenue Over Time + User Growth                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="w-4 h-4 text-primary" />
              Monthly Revenue (12 months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient
                      id="revenueGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => formatNaira(v)}
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    tickLine={false}
                    axisLine={false}
                    width={60}
                  />
                  <Tooltip
                    formatter={(v: number) => [formatNaira(v), "Revenue"]}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4 text-primary" />
              New Users (12 months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={usersChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={40}
                  />
                  <Tooltip
                    formatter={(v: number) => [v, "New Users"]}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="new_users"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#22c55e" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Service Breakdown + Status Distribution                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-4 h-4 text-primary" />
              Revenue by Service
            </CardTitle>
          </CardHeader>
          <CardContent>
            {servicesLoading ? (
              <ChartSkeleton />
            ) : servicesChartData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                No completed transactions yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={servicesChartData}
                  layout="vertical"
                  margin={{ left: 16, right: 24 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => formatNaira(v)}
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{
                      fontSize: 12,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    tickLine={false}
                    axisLine={false}
                    width={90}
                  />
                  <Tooltip
                    formatter={(v: number, _name, props) => [
                      `${formatNaira(v)} (${props.payload.tx_count} txns)`,
                      "Revenue",
                    ]}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                    {servicesChartData.map((entry) => (
                      <Cell key={entry.type} fill={serviceColor(entry.type)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-4 h-4 text-primary" />
              Transaction Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <ChartSkeleton />
            ) : statusData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                No transactions yet
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="tx_count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {statusData.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={statusColor(entry.status)}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number, _n, props) => [
                        `${v} txns — ${formatNaira(props.payload.volume)}`,
                        capitalize(props.payload.status),
                      ]}
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-3">
                  {statusData.map((entry) => (
                    <div
                      key={entry.status}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: statusColor(entry.status) }}
                      />
                      <span className="text-muted-foreground">
                        {capitalize(entry.status)}
                      </span>
                      <span className="font-medium">
                        {entry.tx_count.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Transaction volume over time                                         */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="w-4 h-4 text-primary" />
            Transaction Volume (12 months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {revenueLoading ? (
            <ChartSkeleton height={220} />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={40}
                />
                <Tooltip
                  formatter={(v: number) => [v, "Transactions"]}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="tx_count"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  name="Transactions"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Revenue vs Cost vs Profit                                           */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="w-4 h-4 text-primary" />
            Revenue vs Cost vs Profit (12 months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profitLoading ? (
            <ChartSkeleton height={280} />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={profitChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="month"
                  tick={{
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v) => formatNaira(v)}
                  tick={{
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <Tooltip
                  formatter={(v: number, name: string) => [
                    formatNaira(v),
                    name,
                  ]}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="cost"
                  name="Cost"
                  fill="#f97316"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="profit"
                  name="Profit"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
