import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, RotateCcw, Copy, Check, ChevronDown } from "lucide-react";
import { api } from "@/lib/apiClient";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface ExamPin {
  pin: string;
  serial: string;
}

interface ResultCheckerTransaction {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string;
  amount: number;
  status: string;
  reference: string;
  provider_ref: string | null;
  metadata: {
    exam: string;
    quantity: number;
    pins: ExamPin[];
  } | null;
  created_at: string;
}

const statusStyles: Record<string, string> = {
  completed: "bg-success/20 text-success",
  pending: "bg-warning/20 text-warning",
  failed: "bg-destructive/20 text-destructive",
  refunded: "bg-primary/20 text-primary",
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-1.5 p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
      title="Copy"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-success" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

function PinsModal({
  tx,
  open,
  onClose,
}: {
  tx: ResultCheckerTransaction | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!tx) return null;
  const pins = tx.metadata?.pins ?? [];

  const handleCopyAll = async () => {
    const text = pins
      .map((p, i) => `${i + 1}. PIN: ${p.pin}  Serial: ${p.serial}`)
      .join("\n");
    await navigator.clipboard.writeText(text);
    toast({ title: "All pins copied to clipboard" });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Exam Pins — {tx.metadata?.exam ?? "Unknown"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between pb-1 border-b border-border">
            <span className="text-muted-foreground">
              Ref: <span className="font-mono">{tx.reference}</span>
            </span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                statusStyles[tx.status] ??
                  "bg-secondary text-secondary-foreground",
              )}
            >
              {tx.status}
            </span>
          </div>

          {pins.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground">
              No pins found in this transaction.
            </p>
          ) : (
            <>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {pins.map((p, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border bg-secondary/30 p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">
                        PIN #{i + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-sm font-semibold text-foreground">
                      {p.pin}
                      <CopyButton value={p.pin} />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      Serial: <span className="font-mono">{p.serial}</span>
                      <CopyButton value={p.serial} />
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={handleCopyAll}
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy all pins
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AdminResultChecker() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedTx, setSelectedTx] = useState<ResultCheckerTransaction | null>(
    null,
  );

  const {
    data: transactions,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-result-checker", filterStatus],
    queryFn: () => {
      const params = new URLSearchParams({
        type: "result_checker",
        limit: "100",
        offset: "0",
      });
      if (filterStatus !== "all") params.set("status", filterStatus);
      return api.get<ResultCheckerTransaction[]>(
        `/admin/transactions?${params}`,
      );
    },
  });

  const filtered = (transactions ?? []).filter((tx) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      tx.reference?.toLowerCase().includes(q) ||
      tx.user_id?.toLowerCase().includes(q) ||
      tx.metadata?.exam?.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="glass-card overflow-hidden space-y-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Exam Pin Transactions
          </h2>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            <Input
              placeholder="Search ref / user / exam…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="col-span-2 h-9 w-full text-sm sm:h-8 sm:w-52"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 w-full text-sm sm:h-8 sm:w-36">
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
            No result checker transactions found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Reference
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Exam
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Qty
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    User
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    When
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    Pins
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="p-4 text-xs font-mono text-muted-foreground">
                      {tx.reference || tx.id.slice(0, 8)}
                    </td>
                    <td className="p-4 text-sm text-foreground font-medium uppercase">
                      {tx.metadata?.exam ?? "—"}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {tx.metadata?.quantity ?? "—"}
                    </td>
                    <td className="p-4 text-sm font-medium text-foreground">
                      ₦{tx.amount.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                          statusStyles[tx.status] ??
                            "bg-secondary text-secondary-foreground",
                        )}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-mono text-muted-foreground">
                      {tx.user_id.slice(0, 8)}…
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(tx.created_at), {
                        addSuffix: true,
                      })}
                    </td>
                    <td className="p-4">
                      {tx.status === "completed" &&
                      (tx.metadata?.pins?.length ?? 0) > 0 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => setSelectedTx(tx)}
                        >
                          View <ChevronDown className="w-3 h-3" />
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PinsModal
        tx={selectedTx}
        open={!!selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </>
  );
}
