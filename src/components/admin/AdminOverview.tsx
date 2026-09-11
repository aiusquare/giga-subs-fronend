import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CircleDollarSign,
  Clock3,
  Headphones,
  Loader2,
  PackageX,
  ReceiptText,
  RefreshCw,
  ServerCrash,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DashboardSummary {
  revenue: number;
  profit: number;
  transactions: number;
  success_rate: number;
  new_users: number;
  revenue_change: number | null;
  profit_change: number | null;
  tx_change: number | null;
  users_change: number | null;
}

interface DashboardData {
  summary: DashboardSummary;
  attention: {
    pending_total: number;
    aged_pending: number;
    failed_last_24h: number;
    inactive_services: number;
    api_errors_last_24h: number;
    open_tickets: number;
    urgent_tickets: number;
    awaiting_reply: number;
  };
  trend: Array<{
    day: string;
    revenue: number;
    profit: number;
    transactions: number;
  }>;
  services: Array<{
    service_type: string;
    display_name: string;
    is_active: boolean;
    transactions: number;
    revenue: number;
    success_rate: number;
  }>;
  exceptions: Array<{
    id: string;
    reference: string;
    title: string;
    type: string;
    amount: number;
    status: string;
    created_at: string;
    user_name: string | null;
  }>;
  oldest_tickets: Array<{
    id: string;
    subject: string;
    priority: string;
    status: string;
    created_at: string;
    updated_at: string;
    user_name: string | null;
  }>;
  generated_at: string;
}

const money = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

function parseDate(value: string) {
  return new Date(value.includes("T") ? value : value.replace(" ", "T"));
}

function Change({ value }: { value: number | null }) {
  if (value == null) {
    return <span className="text-muted-foreground">No prior-day baseline</span>;
  }
  const up = value >= 0;
  return (
    <span className={cn("flex items-center gap-1", up ? "text-success" : "text-destructive")}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}{value.toFixed(1)}% vs yesterday
    </span>
  );
}

function MetricCard({
  label,
  value,
  change,
  icon: Icon,
}: {
  label: string;
  value: string;
  change?: number | null;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
        {change !== undefined && <p className="mt-1 text-xs"><Change value={change} /></p>}
      </CardContent>
    </Card>
  );
}

const statusStyles: Record<string, string> = {
  pending: "border-warning/30 bg-warning/10 text-warning",
  failed: "border-destructive/30 bg-destructive/10 text-destructive",
  refunded: "border-primary/30 bg-primary/10 text-primary",
};

export function AdminOverview() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => api.get<DashboardData>("/admin/dashboard"),
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }

  if (isError || !data) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <div><p className="font-semibold">Dashboard data could not be loaded</p><p className="text-sm text-muted-foreground">Check the API connection and try again.</p></div>
          <Button variant="outline" onClick={() => refetch()}><RefreshCw className="mr-2 h-4 w-4" />Try again</Button>
        </CardContent>
      </Card>
    );
  }

  const attentionItems = [
    { label: "Pending transactions", value: data.attention.pending_total, detail: `${data.attention.aged_pending} older than 30 min`, icon: Clock3, danger: data.attention.aged_pending > 0, path: "/admin/transactions?status=pending" },
    { label: "Failed in 24 hours", value: data.attention.failed_last_24h, detail: "Review provider failures", icon: AlertTriangle, danger: data.attention.failed_last_24h > 0, path: "/admin/transactions?status=failed" },
    { label: "Services offline", value: data.attention.inactive_services, detail: "Unavailable to customers", icon: PackageX, danger: data.attention.inactive_services > 0, path: "/admin/services" },
    { label: "API errors in 24h", value: data.attention.api_errors_last_24h, detail: "External API requests", icon: ServerCrash, danger: data.attention.api_errors_last_24h > 0, path: "/admin/api-logs" },
    { label: "Awaiting support reply", value: data.attention.awaiting_reply, detail: `${data.attention.urgent_tickets} high or urgent`, icon: Headphones, danger: data.attention.urgent_tickets > 0, path: "/admin/tickets" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Today at a glance</h2>
          <p className="text-sm text-muted-foreground">Live operational health, exceptions, and actions that need attention.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/transactions?status=pending")}><Clock3 className="mr-2 h-4 w-4" />Review pending</Button>
          <Button size="sm" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />Refresh</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Revenue today" value={money.format(data.summary.revenue)} change={data.summary.revenue_change} icon={Wallet} />
        <MetricCard label="Profit today" value={money.format(data.summary.profit)} change={data.summary.profit_change} icon={CircleDollarSign} />
        <MetricCard label="Transactions today" value={data.summary.transactions.toLocaleString()} change={data.summary.tx_change} icon={ReceiptText} />
        <MetricCard label="Success rate" value={`${data.summary.success_rate.toFixed(1)}%`} icon={Activity} />
        <MetricCard label="New users today" value={data.summary.new_users.toLocaleString()} change={data.summary.users_change} icon={UserPlus} />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="text-base font-semibold">Needs attention</h2><span className="text-xs text-muted-foreground">Click a card to investigate</span></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {attentionItems.map((item) => (
            <button key={item.label} onClick={() => navigate(item.path)} className={cn("group rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/30", item.danger && "border-destructive/30")}>
              <div className="flex items-start justify-between"><item.icon className={cn("h-5 w-5", item.danger ? "text-destructive" : "text-muted-foreground")} /><ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" /></div>
              <p className="mt-3 text-2xl font-bold">{item.value}</p><p className="text-sm font-medium">{item.label}</p><p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Revenue and profit — last 7 days</CardTitle><CardDescription>Completed service purchases; wallet funding is excluded.</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={270}>
              <AreaChart data={data.trend} margin={{ left: 4, right: 8, top: 8 }}>
                <defs><linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tickFormatter={(v) => format(parseDate(v), "EEE")} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `₦${Number(v).toLocaleString()}`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={72} />
                <Tooltip formatter={(value: number, name: string) => [money.format(value), name === "revenue" ? "Revenue" : "Profit"]} labelFormatter={(v) => format(parseDate(String(v)), "EEEE, d MMM")} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend formatter={(value) => value === "revenue" ? "Revenue" : "Profit"} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#dashboardRevenue)" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" stroke="#22c55e" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between space-y-0 pb-2"><div><CardTitle className="text-base">Service performance</CardTitle><CardDescription>Last 30 days</CardDescription></div><Button variant="ghost" size="sm" onClick={() => navigate("/admin/analytics")}>Full analytics<ArrowRight className="ml-1 h-3.5 w-3.5" /></Button></CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-y bg-muted/30 text-left text-xs text-muted-foreground"><th className="px-5 py-2.5 font-medium">Service</th><th className="px-3 py-2.5 text-right font-medium">Txns</th><th className="px-3 py-2.5 text-right font-medium">Revenue</th><th className="px-5 py-2.5 text-right font-medium">Success</th></tr></thead><tbody className="divide-y divide-border">{data.services.map((service) => (
              <tr key={service.service_type} className="hover:bg-muted/20"><td className="px-5 py-3"><div className="flex items-center gap-2"><span className={cn("h-2 w-2 rounded-full", service.is_active ? "bg-success" : "bg-destructive")} /><span className="font-medium">{service.display_name}</span></div></td><td className="px-3 py-3 text-right">{service.transactions}</td><td className="px-3 py-3 text-right">{money.format(service.revenue)}</td><td className={cn("px-5 py-3 text-right font-medium", service.transactions > 0 && service.success_rate < 80 ? "text-destructive" : "text-foreground")}>{service.transactions ? `${service.success_rate.toFixed(1)}%` : "—"}</td></tr>
            ))}</tbody></table></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between space-y-0"><div><CardTitle className="text-base">Transaction exceptions</CardTitle><CardDescription>Failed, refunded, and aged pending transactions only.</CardDescription></div><Button variant="ghost" size="sm" onClick={() => navigate("/admin/transactions")}>View all<ArrowRight className="ml-1 h-3.5 w-3.5" /></Button></CardHeader>
          <CardContent className="px-0 pb-0">
            {!data.exceptions.length ? <p className="px-6 pb-6 text-sm text-muted-foreground">No transaction exceptions. Everything looks calm.</p> : <div className="divide-y divide-border">{data.exceptions.map((tx) => (
              <button key={tx.id} onClick={() => navigate(`/admin/transactions?status=${tx.status}&search=${encodeURIComponent(tx.reference || tx.id)}`)} className="flex w-full items-center gap-3 px-6 py-3 text-left hover:bg-muted/30"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted"><Zap className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{tx.title}</span><span className="block truncate text-xs text-muted-foreground">{tx.user_name || "Unknown user"} · {tx.reference}</span></span><span className="text-right"><Badge variant="outline" className={cn("capitalize", statusStyles[tx.status])}>{tx.status}</Badge><span className="mt-1 block text-xs text-muted-foreground">{formatDistanceToNow(parseDate(tx.created_at), { addSuffix: true })}</span></span></button>
            ))}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between space-y-0"><div><CardTitle className="text-base">Support queue</CardTitle><CardDescription>{data.attention.open_tickets} open or in progress</CardDescription></div><Button variant="ghost" size="sm" onClick={() => navigate("/admin/tickets")}>Open tickets<ArrowRight className="ml-1 h-3.5 w-3.5" /></Button></CardHeader>
          <CardContent className="px-0 pb-0">
            {!data.oldest_tickets.length ? <p className="px-6 pb-6 text-sm text-muted-foreground">No unresolved support tickets.</p> : <div className="divide-y divide-border">{data.oldest_tickets.map((ticket) => (
              <button key={ticket.id} onClick={() => navigate("/admin/tickets")} className="flex w-full items-center gap-3 px-6 py-3 text-left hover:bg-muted/30"><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{ticket.subject}</span><span className="block truncate text-xs text-muted-foreground">{ticket.user_name || "Unknown user"} · opened {formatDistanceToNow(parseDate(ticket.created_at), { addSuffix: true })}</span></span><Badge variant={ticket.priority === "urgent" ? "destructive" : "outline"} className="capitalize">{ticket.priority}</Badge></button>
            ))}</div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><span className="text-sm font-medium">Quick actions</span><div className="flex flex-wrap gap-2 sm:ml-auto"><Button variant="outline" size="sm" onClick={() => navigate("/admin/users")}><Users className="mr-2 h-4 w-4" />Find a user</Button><Button variant="outline" size="sm" onClick={() => navigate("/admin/services")}><Activity className="mr-2 h-4 w-4" />Manage services</Button><Button variant="outline" size="sm" onClick={() => navigate("/admin/notifications")}><Zap className="mr-2 h-4 w-4" />Send notification</Button><Button variant="outline" size="sm" onClick={() => navigate("/admin/tickets")}><Headphones className="mr-2 h-4 w-4" />Support tickets</Button></div></CardContent>
      </Card>
    </div>
  );
}
