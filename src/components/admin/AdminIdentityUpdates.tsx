import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Eye, Loader2, RotateCcw, XCircle } from "lucide-react";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/apiClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

interface IdentityRequest {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  service_name: string;
  service_type: string;
  service_price: number;
  old_information: Record<string, unknown>;
  new_information: Record<string, unknown>;
  status: string;
  reference: string | null;
  payment_status: string | null;
  admin_note: string | null;
  created_at: string;
}

const statuses = ["pending", "processing", "approved", "completed", "rejected"];
const statusStyles: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  processing: "bg-primary/15 text-primary",
  approved: "bg-success/15 text-success",
  completed: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
};

const currency = (amount: number) =>
  `${siteConfig.currency.symbol}${amount.toLocaleString()}`;

export function AdminIdentityUpdates() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<IdentityRequest | null>(null);
  const [nextStatus, setNextStatus] = useState("");
  const [note, setNote] = useState("");

  const {
    data: requests = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-identity-updates", filterStatus],
    queryFn: () =>
      api.get<IdentityRequest[]>(
        `/admin/identity-updates?status=${filterStatus}`,
      ),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      api.put(`/admin/identity-updates/${selected?.id}`, {
        status: nextStatus,
        admin_note: note,
      }),
    onSuccess: () => {
      toast.success("Identity update request updated");
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ["admin-identity-updates"] });
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Could not update request",
      ),
  });

  const openRequest = (request: IdentityRequest) => {
    setSelected(request);
    setNextStatus(request.status);
    setNote(request.admin_note ?? "");
  };

  const filtered = requests.filter((request) => {
    const query = search.toLowerCase();
    return (
      !query ||
      [
        request.reference,
        request.email,
        request.full_name,
        request.user_id,
        request.service_name,
      ].some((value) => value?.toLowerCase().includes(query))
    );
  });

  return (
    <>
      <div className="glass-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Identity Update Requests
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Review BVN and NIN information change requests.
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            <Input
              className="col-span-2 h-9 w-full text-sm sm:h-8 sm:w-52"
              placeholder="Search reference / user"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 w-full text-sm sm:h-8 sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
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
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : !filtered.length ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No identity update requests found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "Reference",
                    "Service",
                    "User",
                    "Amount",
                    "Status",
                    "Date",
                    "Action",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="p-4 text-left text-sm font-medium text-muted-foreground"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((request) => (
                  <tr
                    key={request.id}
                    className="border-b border-border/50 hover:bg-secondary/30"
                  >
                    <td className="p-4 text-xs font-mono text-muted-foreground">
                      {request.reference ?? request.id.slice(0, 8)}
                    </td>
                    <td className="p-4 text-sm font-medium text-foreground">
                      {request.service_name}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {request.email ?? request.user_id.slice(0, 8)}
                    </td>
                    <td className="p-4 text-sm font-medium text-foreground">
                      {currency(request.service_price)}
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                          statusStyles[request.status] ??
                            "bg-muted text-muted-foreground",
                        )}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => openRequest(request)}
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.service_name}</DialogTitle>
                <DialogDescription>
                  {selected.email ?? selected.user_id} ·{" "}
                  {selected.reference ?? "No reference"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoBlock
                    title="Existing information"
                    values={selected.old_information}
                  />
                  <InfoBlock
                    title="Requested changes"
                    values={selected.new_information}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
                    <p className="text-xs text-muted-foreground">Payment</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {currency(selected.service_price)} ·{" "}
                      {selected.payment_status ?? "pending"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
                    <p className="text-xs text-muted-foreground">
                      Current status
                    </p>
                    <p className="mt-1 text-sm font-semibold capitalize text-foreground">
                      {selected.status}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-foreground"
                    htmlFor="request-status"
                  >
                    Set status
                  </label>
                  <Select value={nextStatus} onValueChange={setNextStatus}>
                    <SelectTrigger id="request-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses
                        .filter((status) => status !== "pending")
                        .map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-foreground"
                    htmlFor="admin-note"
                  >
                    Admin note
                  </label>
                  <Textarea
                    id="admin-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Add a note for the customer"
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={
                    !nextStatus ||
                    updateMutation.isPending ||
                    (["completed", "rejected"].includes(selected.status) &&
                      nextStatus !== selected.status)
                  }
                  onClick={() => updateMutation.mutate()}
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : nextStatus === "rejected" ? (
                    <XCircle className="mr-2 h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Save request status
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function InfoBlock({
  title,
  values,
}: {
  title: string;
  values: Record<string, unknown>;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
      <p className="mb-2 text-sm font-semibold text-foreground">{title}</p>
      <div className="space-y-2">
        {Object.entries(values).map(([key, value]) => {
          if (key === "updates" && Array.isArray(value)) {
            return (
              <div key={key} className="space-y-2">
                {value.map((update, index) => {
                  const item = update as Record<string, unknown>;
                  return (
                    <div
                      key={`${key}-${index}`}
                      className="rounded-lg bg-background/60 p-2 text-xs"
                    >
                      <div className="font-medium text-foreground">
                        {String(item.update_type ?? "Correction")}
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        {String(item.field ?? "").replaceAll("_", " ")}:{" "}
                        {String(item.change_from ?? item.change_to ?? "-")}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }

          const displayValue =
            value && typeof value === "object"
              ? JSON.stringify(value)
              : String(value ?? "-");
          return (
            <div
              key={key}
              className="flex items-start justify-between gap-3 text-xs"
            >
              <span className="capitalize text-muted-foreground">
                {key.replaceAll("_", " ")}
              </span>
              <span className="max-w-[65%] break-words text-right text-foreground">
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
