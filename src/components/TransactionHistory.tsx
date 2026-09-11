import { ArrowDownLeft, ArrowUpRight, Loader2, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransactions } from "@/hooks/useTransactions";
import { siteConfig } from "@/config/site";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export function TransactionHistory() {
  const { data: transactions = [], isLoading } = useTransactions();
  const navigate = useNavigate();
  const recentTransactions = transactions.slice(0, 5);

  return (
    <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Recent Transactions</h2>
        <button
          onClick={() => navigate("/history")}
          className="text-sm text-primary font-medium hover:underline"
        >
          View All
        </button>
      </div>

      <div className="glass-card divide-y divide-border/50">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && recentTransactions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No transactions yet</p>
          </div>
        )}

        {!isLoading &&
          recentTransactions.map((tx) => {
            const isCredit = tx.amount > 0;
            const isDebit = tx.amount < 0;
            return (
              <div
                key={tx.id}
                className="flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    isCredit
                      ? "bg-success/20 text-success"
                      : isDebit
                        ? "bg-destructive/20 text-destructive"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {isCredit ? (
                    <ArrowDownLeft className="w-5 h-5" />
                  ) : isDebit ? (
                    <ArrowUpRight className="w-5 h-5" />
                  ) : (
                    <Minus className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{tx.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{tx.description}</p>
                </div>

                <div className="text-right">
                  <p
                    className={cn(
                      "font-semibold",
                      isCredit
                        ? "text-success"
                        : isDebit
                          ? "text-foreground"
                          : "text-muted-foreground"
                    )}
                  >
                    {isCredit ? "+" : isDebit ? "-" : ""}{siteConfig.currency.symbol}{Math.abs(tx.amount).toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(tx.created_at), "MMM d, h:mm a")}
                    </span>
                    {tx.status === "pending" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-warning/20 text-warning">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}
