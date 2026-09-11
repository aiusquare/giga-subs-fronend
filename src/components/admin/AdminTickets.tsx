import { useState, useRef, useEffect } from "react";
import {
  useAdminTickets,
  useAdminTicket,
  useAdminReplyTicket,
  useAdminUpdateTicketStatus,
  type Ticket,
} from "@/hooks/useTickets";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Send,
  ChevronRight,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  resolved:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  closed: "bg-muted text-muted-foreground",
};

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-destructive/15 text-destructive",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  normal: "bg-secondary text-muted-foreground",
  low: "bg-muted text-muted-foreground",
};

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

// ── Ticket Thread (detail panel) ──────────────────────────────────────────────

function TicketDetail({
  ticket,
  onBack,
}: {
  ticket: Ticket;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const { data, isLoading } = useAdminTicket(ticket.id);
  const replyMutation = useAdminReplyTicket(ticket.id);
  const statusMutation = useAdminUpdateTicketStatus(ticket.id);
  const [replyText, setReplyText] = useState("");
  const [status, setStatus] = useState(ticket.status);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageCount = data?.messages?.length ?? 0;

  // Auto-scroll to latest message on every poll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageCount]);

  const sendReply = async () => {
    if (!replyText.trim()) return;
    try {
      await replyMutation.mutateAsync(replyText.trim());
      setReplyText();
    } catch (err: unknown) {
      toast({
        title: (err as Error).message || "Failed to send reply",
        variant: "destructive",
      });
    }
  };

  const changeStatus = async (newStatus: string) => {
    setStatus(newStatus);
    try {
      await statusMutation.mutateAsync(newStatus);
      toast({ title: `Status updated to "${newStatus.replace("_", " ")}"` });
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  return (
    <div className="glass-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div>
            <p className="font-semibold text-foreground">{ticket.subject}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data?.user_name ?? ticket.user_id} · {ticket.category} ·
              priority:{" "}
              <span
                className={`px-1.5 py-0.5 rounded text-xs font-medium ${PRIORITY_STYLES[ticket.priority]}`}
              >
                {ticket.priority}
              </span>
            </p>
            {status !== "resolved" && status !== "closed" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            )}
          </div>
        </div>
        <Select value={status} onValueChange={changeStatus}>
          <SelectTrigger className="h-9 w-full sm:h-8 sm:w-36 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Messages */}
      <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        {(data?.messages ?? []).map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.is_staff ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 space-y-1 ${
                msg.is_staff
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-secondary text-foreground rounded-tl-sm"
              }`}
            >
              <p className="text-xs font-medium opacity-70">
                {msg.is_staff
                  ? `You (${msg.sender_name})`
                  : `User — ${msg.sender_name}`}
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.body}
              </p>
              <p className="text-xs opacity-50 text-right">
                {formatDistanceToNow(new Date(msg.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply */}
      {status !== "resolved" && status !== "closed" && (
        <div className="flex items-end gap-2 p-5 border-t border-border">
          <textarea
            rows={2}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendReply();
              }
            }}
            className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <Button
            onClick={sendReply}
            disabled={!replyText.trim() || replyMutation.isPending}
            size="icon"
            className="rounded-xl h-10 w-10 shrink-0"
          >
            {replyMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminTickets() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const { data, isLoading, refetch } = useAdminTickets(
    filterStatus !== "all" ? filterStatus : undefined,
  );

  if (selectedTicket) {
    return (
      <TicketDetail
        ticket={selectedTicket}
        onBack={() => setSelectedTicket(null)}
      />
    );
  }

  return (
    <div className="glass-card overflow-hidden space-y-0">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">
          Support Tickets
        </h2>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 w-full sm:h-8 sm:w-36 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && !data?.tickets?.length && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <MessageSquare className="w-10 h-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No tickets found.</p>
        </div>
      )}

      {/* Table */}
      {!!data?.tickets?.length && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Subject
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  User
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Category
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Priority
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-secondary/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <td className="px-5 py-3 font-medium text-foreground max-w-[220px] truncate">
                    {ticket.subject}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground truncate max-w-[140px]">
                    {ticket.user_name ?? ticket.user_id}
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">
                    {ticket.category}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[ticket.status]}`}
                    >
                      {ticket.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_STYLES[ticket.priority]}`}
                    >
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(ticket.updated_at), {
                      addSuffix: true,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
