import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { TransactionReceiptModal } from "@/components/TransactionReceiptModal";
import {
  Wifi,
  Smartphone,
  Zap,
  Tv,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  History,
  Landmark,
  IdCard,
  Fingerprint,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useTransactions, type Transaction } from "@/hooks/useTransactions";
import { siteConfig } from "@/config/site";
import {
  format,
  startOfMonth,
  subMonths,
  isAfter,
  isBefore,
  endOfDay,
  startOfDay,
} from "date-fns";

type FilterType =
  | "all"
  | "data"
  | "airtime"
  | "electricity"
  | "cable"
  | "funding"
  | "scratch_card"
  | "bvn_verification"
  | "nin_verification"
  | "nin_slip_download"
  | "identity_update";

type PeriodType = "this_month" | "last_month" | "3_months" | "all";

const filters: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "data", label: "Data" },
  { key: "airtime", label: "Airtime" },
  { key: "electricity", label: "Electricity" },
  { key: "cable", label: "Cable TV" },
  { key: "funding", label: "Funding" },
  { key: "bvn_verification", label: "BVN" },
  { key: "nin_verification", label: "NIN" },
  { key: "nin_slip_download", label: "NIN Slip" },
  { key: "identity_update", label: "Identity Updates" },
];

const periodOptions: { key: PeriodType; label: string }[] = [
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "3_months", label: "Last 3 Months" },
  { key: "all", label: "All Time" },
];

const typeIcons: Record<string, React.ElementType> = {
  data: Wifi,
  airtime: Smartphone,
  electricity: Zap,
  cable: Tv,
  funding: ArrowDownLeft,
  scratch_card: CreditCard,
  bvn_verification: Landmark,
  nin_verification: IdCard,
  nin_slip_download: FileText,
  identity_update: Fingerprint,
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "text-success bg-success/10";
    case "pending":
      return "text-warning bg-warning/10";
    case "failed":
      return "text-destructive bg-destructive/10";
    case "refunded":
      return "text-primary bg-primary/10";
    default:
      return "text-muted-foreground bg-muted";
  }
};

function filterByPeriod(txs: Transaction[], period: PeriodType): Transaction[] {
  const now = new Date();
  let from: Date;
  if (period === "this_month") from = startOfMonth(now);
  else if (period === "last_month") from = startOfMonth(subMonths(now, 1));
  else if (period === "3_months") from = startOfMonth(subMonths(now, 3));
  else return txs;

  const to =
    period === "last_month"
      ? endOfDay(new Date(startOfMonth(now).getTime() - 1))
      : endOfDay(now);

  return txs.filter((tx) => {
    const d = new Date(tx.created_at);
    return !isBefore(d, startOfDay(from)) && !isAfter(d, to);
  });
}

function groupByDate(
  txs: Transaction[],
): { date: string; items: Transaction[] }[] {
  const map = new Map<string, Transaction[]>();
  for (const tx of txs) {
    const key = format(new Date(tx.created_at), "yyyy-MM-dd");
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(tx);
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}

// ── Statement View ────────────────────────────────────────────────────────────
function StatementView({ transactions }: { transactions: Transaction[] }) {
  const [period, setPeriod] = useState<PeriodType>("this_month");

  const filtered = useMemo(
    () => filterByPeriod(transactions, period),
    [transactions, period],
  );

  const { totalIn, totalOut, net } = useMemo(() => {
    let totalIn = 0,
      totalOut = 0;
    for (const tx of filtered) {
      if (tx.status === "failed") continue;
      if (tx.amount > 0) totalIn += tx.amount;
      else totalOut += Math.abs(tx.amount);
    }
    return { totalIn, totalOut, net: totalIn - totalOut };
  }, [filtered]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  const sym = siteConfig.currency.symbol;

  return (
    <div className="space-y-4">
      {/* Period filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {periodOptions.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              period === p.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/50 text-foreground hover:bg-secondary"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/40 p-3 space-y-1">
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Credits</span>
          </div>
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 truncate">
            {sym}
            {totalIn.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-800/40 p-3 space-y-1">
          <div className="flex items-center gap-1 text-red-500 dark:text-red-400">
            <TrendingDown className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Debits</span>
          </div>
          <p className="text-sm font-bold text-red-600 dark:text-red-400 truncate">
            {sym}
            {totalOut.toLocaleString()}
          </p>
        </div>
        <div
          className={`rounded-2xl border p-3 space-y-1 ${
            net >= 0
              ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-800/40"
              : "bg-orange-50 dark:bg-orange-950/30 border-orange-200/50 dark:border-orange-800/40"
          }`}
        >
          <div
            className={`flex items-center gap-1 ${net >= 0 ? "text-blue-600 dark:text-blue-400" : "text-orange-500"}`}
          >
            <Minus className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Net</span>
          </div>
          <p
            className={`text-sm font-bold truncate ${net >= 0 ? "text-blue-700 dark:text-blue-300" : "text-orange-600"}`}
          >
            {net >= 0 ? "+" : ""}
            {sym}
            {Math.abs(net).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Ledger */}
      {filtered.length === 0 && (
        <div className="text-center py-10 text-muted-foreground text-sm">
          No transactions in this period.
        </div>
      )}

      {groups.map(({ date, items }) => {
        const dayTotal = items
          .filter((tx) => tx.status !== "failed")
          .reduce((sum, tx) => sum + tx.amount, 0);

        return (
          <div key={date} className="space-y-1">
            {/* Date header */}
            <div className="flex items-center justify-between px-1 mb-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {format(new Date(date), "EEE, MMM d yyyy")}
              </p>
              <p
                className={`text-xs font-semibold ${dayTotal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}
              >
                {dayTotal >= 0 ? "+" : ""}
                {sym}
                {Math.abs(dayTotal).toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl bg-card border border-border/50 divide-y divide-border/50 overflow-hidden">
              {items.map((tx) => {
                const isCredit = tx.amount > 0;
                const isDebit = tx.amount < 0;
                const Icon = isCredit
                  ? ArrowDownLeft
                  : isDebit
                    ? ArrowUpRight
                    : Minus;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isCredit
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                          : isDebit
                            ? "bg-red-100 dark:bg-red-900/30 text-red-500"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {tx.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tx.created_at), "h:mm a")}
                        {tx.status !== "completed" && (
                          <span
                            className={`ml-2 capitalize ${getStatusColor(tx.status)} px-1.5 py-0.5 rounded text-xs`}
                          >
                            {tx.status}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`text-sm font-bold ${isCredit ? "text-emerald-600 dark:text-emerald-400" : isDebit ? "text-red-500" : "text-muted-foreground"}`}
                      >
                        {isCredit ? "+" : isDebit ? "-" : ""}
                        {sym}
                        {Math.abs(tx.amount).toLocaleString()}
                      </p>
                      {tx.balance_after != null && (
                        <p className="text-xs text-muted-foreground">
                          Bal: {sym}
                          {Number(tx.balance_after).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const HistoryPage = () => {
  const [activeView, setActiveView] = useState<"history" | "statement">(
    "history",
  );
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const { data: transactions = [], isLoading } = useTransactions(
    activeView === "history" ? activeFilter : undefined,
  );

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container max-w-lg mx-auto px-4">
        <PageHeader title="Transaction History" showBack={true} />

        <div className="space-y-4">
          {/* View toggle */}
          <div className="flex rounded-xl bg-secondary/50 p-1 gap-1 animate-slide-up">
            <button
              onClick={() => setActiveView("history")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeView === "history"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              History
            </button>
            <button
              onClick={() => setActiveView("statement")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeView === "statement"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Statement
            </button>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {/* ── History view ── */}
          {!isLoading && activeView === "history" && (
            <>
              {/* Filters */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide animate-slide-up">
                {filters.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setActiveFilter(filter.key)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                      activeFilter === filter.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/50 text-foreground hover:bg-secondary"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div
                className="space-y-3 animate-slide-up"
                style={{ animationDelay: "0.1s" }}
              >
                {transactions.map((transaction) => {
                  const Icon = typeIcons[transaction.type] || ArrowUpRight;
                  const isCredit = transaction.amount > 0;
                  const isDebit = transaction.amount < 0;
                  return (
                    <div
                      key={transaction.id}
                      onClick={() => setSelectedTx(transaction)}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 border border-border/50 cursor-pointer hover:bg-secondary/80 transition-colors active:scale-[0.99]"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isCredit
                            ? "bg-success/20 text-success"
                            : isDebit
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {transaction.title}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(
                            new Date(transaction.created_at),
                            "MMM d, yyyy h:mm a",
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${isCredit ? "text-success" : isDebit ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {isCredit ? "+" : isDebit ? "-" : ""}
                          {siteConfig.currency.symbol}
                          {Math.abs(transaction.amount).toLocaleString()}
                        </p>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(transaction.status)}`}
                        >
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {transactions.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No transactions found</p>
                </div>
              )}
            </>
          )}

          {/* ── Statement view ── */}
          {!isLoading && activeView === "statement" && (
            <StatementView transactions={transactions} />
          )}
        </div>
      </div>

      <TransactionReceiptModal
        transaction={selectedTx}
        open={!!selectedTx}
        onOpenChange={(open) => {
          if (!open) setSelectedTx(null);
        }}
      />

      <BottomNav />
    </div>
  );
};

export default HistoryPage;
