import { useState, useRef, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import {
  useTickets,
  useTicket,
  useCreateTicket,
  useReplyTicket,
  useCloseTicket,
  type Ticket,
} from "@/hooks/useTickets";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  ChevronRight,
  Send,
  X,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  resolved:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  closed: "bg-muted text-muted-foreground",
};

const STATUS_ICON: Record<string, JSX.Element> = {
  open: <Clock className="w-3 h-3" />,
  in_progress: <AlertCircle className="w-3 h-3" />,
  resolved: <CheckCircle className="w-3 h-3" />,
  closed: <X className="w-3 h-3" />,
};

const CATEGORY_OPTIONS = [
  { value: "general", label: "General" },
  { value: "billing", label: "Billing / Wallet" },
  { value: "technical", label: "Technical Issue" },
  { value: "account", label: "Account" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function NewTicketForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const createTicket = useCreateTicket();
  const [form, setForm] = useState({
    subject: "",
    message: "",
    category: "general",
    priority: "normal",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      toast({
        title: "Subject and message are required",
        variant: "destructive",
      });
      return;
    }
    try {
      await createTicket.mutateAsync(form);
      toast({
        title: "Ticket submitted!",
        description: "We'll get back to you soon.",
      });
      onClose();
    } catch (err: unknown) {
      toast({
        title: (err as Error).message || "Failed to create ticket",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          Subject *
        </label>
        <input
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          placeholder="Brief description of your issue"
          className="rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            Category
          </label>
          <select
            value={form.category}
            onChange={(e) =>
              setForm((f) => ({ ...f, category: e.target.value }))
            }
            className="rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            Priority
          </label>
          <select
            value={form.priority}
            onChange={(e) =>
              setForm((f) => ({ ...f, priority: e.target.value }))
            }
            className="rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          Message *
        </label>
        <textarea
          rows={5}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          placeholder="Describe your issue in detail..."
          className="rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={createTicket.isPending}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {createTicket.isPending && (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}
          Submit Ticket
        </button>
      </div>
    </form>
  );
}

function TicketThread({
  ticket,
  onBack,
}: {
  ticket: Ticket;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const { data, isLoading } = useTicket(ticket.id);
  const replyMutation = useReplyTicket(ticket.id);
  const closeMutation = useCloseTicket();
  const [replyText, setReplyText] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageCount = data?.messages?.length ?? 0;

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageCount]);

  const isClosed = ticket.status === "closed" || ticket.status === "resolved";

  const sendReply = async () => {
    if (!replyText.trim()) return;
    try {
      await replyMutation.mutateAsync(replyText.trim());
      setReplyText("");
    } catch (err: unknown) {
      toast({
        title: (err as Error).message || "Failed to send reply",
        variant: "destructive",
      });
    }
  };

  const closeTicket = async () => {
    try {
      await closeMutation.mutateAsync(ticket.id);
      toast({ title: "Ticket closed" });
      onBack();
    } catch {
      toast({ title: "Failed to close ticket", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl bg-card border border-border/50 p-4 space-y-2">
        <div className="flex items-start gap-3">
          <button
            onClick={onBack}
            className="mt-0.5 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">
              {ticket.subject}
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[ticket.status]}`}
              >
                {STATUS_ICON[ticket.status]}
                {ticket.status.replace("_", " ")}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {ticket.category}
              </span>
              {!isClosed && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live
                </span>
              )}
            </div>
          </div>
          {!isClosed && (
            <button
              onClick={() => setConfirmClose(true)}
              disabled={closeMutation.isPending}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0"
            >
              Close ticket
            </button>
          )}
        </div>
      </div>

      {/* Close confirmation */}
      {confirmClose && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">
            Close this ticket?
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Once closed, you won't be able to reply to this ticket. Open a new
            ticket if you need further help.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmClose(false)}
              className="flex-1 rounded-xl border border-border py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={closeTicket}
              disabled={closeMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-destructive text-destructive-foreground py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {closeMutation.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              Yes, close it
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="space-y-3">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        {data?.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.is_staff ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 space-y-1 ${
                msg.is_staff
                  ? "bg-secondary text-foreground rounded-tl-sm"
                  : "bg-primary text-primary-foreground rounded-tr-sm"
              }`}
            >
              <p className="text-xs font-medium opacity-70">
                {msg.is_staff ? `Support — ${msg.sender_name}` : "You"}
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

      {/* Reply input */}
      {!isClosed && (
        <div className="flex items-end gap-2">
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
          <button
            onClick={sendReply}
            disabled={!replyText.trim() || replyMutation.isPending}
            className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0"
          >
            {replyMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      {isClosed && (
        <p className="text-center text-sm text-muted-foreground py-2">
          This ticket is {ticket.status}. Open a new ticket if you need further
          help.
        </p>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const SupportTicketsPage = () => {
  const { data, isLoading } = useTickets();
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  if (selectedTicket) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <div className="container max-w-lg mx-auto px-4">
          <PageHeader title="Ticket" />
          <TicketThread
            ticket={selectedTicket}
            onBack={() => setSelectedTicket(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container max-w-lg mx-auto px-4">
        <PageHeader title="Support Tickets" />

        <div className="space-y-4 animate-slide-up">
          {/* New ticket button / form */}
          {showNewForm ? (
            <div className="rounded-2xl bg-card border border-border/50 p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-foreground">New Ticket</p>
                <button onClick={() => setShowNewForm(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <NewTicketForm onClose={() => setShowNewForm(false)} />
            </div>
          ) : (
            <button
              onClick={() => setShowNewForm(true)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 py-4 text-primary font-medium text-sm hover:bg-primary/5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Open New Ticket
            </button>
          )}

          {/* Ticket list */}
          {isLoading && (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && !data?.tickets?.length && (
            <div className="rounded-2xl bg-card border border-border/50 p-8 text-center space-y-2">
              <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="font-semibold text-foreground">No tickets yet</p>
              <p className="text-sm text-muted-foreground">
                Open a ticket and our team will respond shortly.
              </p>
            </div>
          )}

          {data?.tickets?.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className="w-full text-left rounded-2xl bg-card border border-border/50 px-4 py-4 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {ticket.subject}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                    {ticket.category}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[ticket.status]}`}
                  >
                    {STATUS_ICON[ticket.status]}
                    {ticket.status.replace("_", " ")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {ticket.message_count} msg
                    {ticket.message_count !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {formatDistanceToNow(new Date(ticket.updated_at), {
                  addSuffix: true,
                })}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SupportTicketsPage;
