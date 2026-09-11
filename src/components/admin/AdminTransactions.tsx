import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import { api } from "@/lib/apiClient";
import { Transaction } from "@/hooks/useTransactions";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const statusStyles: Record<string, string> = {
  completed: "bg-success/20 text-success",
  pending: "bg-warning/20 text-warning",
  failed: "bg-destructive/20 text-destructive",
  refunded: "bg-primary/20 text-primary",
};

export function AdminTransactions() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [filterType, setFilterType] = useState(
    searchParams.get("type") || "all",
  );
  const [filterStatus, setFilterStatus] = useState(
    searchParams.get("status") || "all",
  );
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [resolvingTx, setResolvingTx] = useState<{
    tx: Transaction;
    action: "complete" | "refund";
  } | null>(null);

  const {
    data: transactions,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-transactions", filterType, filterStatus],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "100", offset: "0" });
      if (filterType !== "all") params.set("type", filterType);
      if (filterStatus !== "all") params.set("status", filterStatus);
      return api.get<Transaction[]>(`/admin/transactions?${params}`);
    },
  });

  const resolveMutation = useMutation({
    mutationFn: ({
      txId,
      action,
    }: {
      txId: string;
      action: "complete" | "refund";
    }) => api.post(`/admin/transactions/${txId}/resolve`, { action }),
    onSuccess: (_data, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-transactions"] });
      setResolvingTx(null);
      toast.success(
        action === "complete"
          ? "Transaction marked as completed"
          : "Transaction refunded and marked as failed",
      );
    },
    onError: () => toast.error("Failed to resolve transaction"),
  });

  const filtered = (transactions ?? []).filter((tx) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      tx.reference?.toLowerCase().includes(q) ||
      tx.title.toLowerCase().includes(q) ||
      tx.user_id.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="glass-card overflow-hidden space-y-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Transactions
          </h2>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            <Input
              placeholder="Search ref / title / user…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="col-span-2 h-9 w-full text-sm sm:h-8 sm:w-48"
            />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-9 w-full text-sm sm:h-8 sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {(
                  [
                    ["data", "Data"],
                    ["airtime", "Airtime"],
                    ["electricity", "Electricity"],
                    ["cable", "Cable TV"],
                    ["wallet", "Wallet"],
                    ["result_checker", "Exam Pins"],
                    ["admin_credit", "Admin Credit"],
                    ["admin_debit", "Admin Debit"],
                  ] as [string, string][]
                ).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 w-full text-sm sm:h-8 sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {["completed", "pending", "failed", "refunded"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-full sm:h-8 sm:w-auto"
              onClick={() => refetch()}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : !filtered.length ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No transactions found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="whitespace-nowrap px-2 py-3 text-left text-sm font-medium text-muted-foreground sm:p-4">
                    Reference
                  </th>
                  <th className="whitespace-nowrap px-2 py-3 text-left text-sm font-medium text-muted-foreground sm:p-4">
                    Title
                  </th>
                  <th className="hidden whitespace-nowrap px-2 py-3 text-left text-sm font-medium text-muted-foreground sm:table-cell sm:p-4">
                    Type
                  </th>
                  <th className="whitespace-nowrap px-2 py-3 text-left text-sm font-medium text-muted-foreground sm:p-4">
                    Amount
                  </th>
                  <th className="whitespace-nowrap px-2 py-3 text-left text-sm font-medium text-muted-foreground sm:p-4">
                    Status
                  </th>
                  <th className="hidden whitespace-nowrap px-2 py-3 text-left text-sm font-medium text-muted-foreground sm:table-cell sm:p-4">
                    When
                  </th>
                  <th className="whitespace-nowrap px-2 py-3 text-left text-sm font-medium text-muted-foreground sm:p-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="max-w-[8rem] truncate whitespace-nowrap px-2 py-3 text-xs font-mono text-muted-foreground sm:max-w-none sm:p-4">
                      {tx.reference || tx.id.slice(0, 8)}
                    </td>
                    <td className="max-w-[9rem] truncate whitespace-nowrap px-2 py-3 text-sm text-foreground sm:max-w-none sm:p-4">
                      {tx.title}
                    </td>
                    <td className="hidden p-4 text-sm capitalize text-muted-foreground sm:table-cell">
                      {tx.type}
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 text-sm font-medium text-foreground sm:p-4">
                      ₦{tx.amount.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 sm:p-4">
                      <span
                        className={cn(
                          "text-xs font-medium px-2.5 py-1 rounded-full",
                          statusStyles[tx.status] ??
                            "bg-muted text-muted-foreground",
                        )}
                      >
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </span>
                    </td>
                    <td className="hidden p-4 text-xs text-muted-foreground sm:table-cell">
                      {formatDistanceToNow(new Date(tx.created_at), {
                        addSuffix: true,
                      })}
                    </td>
                    <td className="px-2 py-3 sm:p-4">
                      {tx.status === "pending" && (
                        <div className="flex flex-col items-stretch gap-1.5 sm:flex-row sm:items-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs gap-1 text-green-600 border-green-600/40 hover:bg-green-500/10"
                            onClick={() =>
                              setResolvingTx({ tx, action: "complete" })
                            }
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs gap-1 text-destructive border-destructive/40 hover:bg-destructive/10"
                            onClick={() =>
                              setResolvingTx({ tx, action: "refund" })
                            }
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Refund
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolve Confirmation Dialog */}
      {resolvingTx && (
        <Dialog
          open
          onOpenChange={(o) => {
            if (!o) setResolvingTx(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {resolvingTx.action === "complete" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
                {resolvingTx.action === "complete"
                  ? "Mark as Completed"
                  : "Refund & Mark as Failed"}
              </DialogTitle>
              <DialogDescription>
                {resolvingTx.action === "complete"
                  ? "This will mark the transaction as completed. No wallet changes will be made."
                  : `This will refund ₦${Math.abs(resolvingTx.tx.amount).toLocaleString()} to the user's wallet and mark the transaction as failed.`}
              </DialogDescription>
            </DialogHeader>
            <div className="py-2 px-1 rounded-lg bg-secondary/50 space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Reference:</span>{" "}
                <span className="font-mono">{resolvingTx.tx.reference}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Title:</span>{" "}
                {resolvingTx.tx.title}
              </p>
              <p>
                <span className="text-muted-foreground">Amount:</span> ₦
                {Math.abs(resolvingTx.tx.amount).toLocaleString()}
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setResolvingTx(null)}
                disabled={resolveMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant={
                  resolvingTx.action === "complete" ? "default" : "destructive"
                }
                onClick={() =>
                  resolveMutation.mutate({
                    txId: resolvingTx.tx.id,
                    action: resolvingTx.action,
                  })
                }
                disabled={resolveMutation.isPending}
              >
                {resolveMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {resolvingTx.action === "complete"
                  ? "Mark Completed"
                  : "Refund & Fail"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
