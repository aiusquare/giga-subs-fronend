import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Upload,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MigrationBatch,
  MigrationPreview,
  MigrationUserPayload,
  useAdminMigrations,
  useMigrationBatch,
  useMigrationBatches,
  useMigrationSearch,
} from "@/hooks/useAdminMigrations";
import { cn } from "@/lib/utils";

const templateHeaders = [
  "legacy_user_id",
  "full_name",
  "email",
  "phone",
  "wallet_balance",
  "role",
  "virtual_account_number",
  "virtual_account_bank",
  "virtual_account_name",
  "old_created_at",
];

const sampleRow = [
  "OLD-10001",
  "Ada Okafor",
  "ada@example.com",
  "08031234567",
  "2500",
  "user",
  "1234567890",
  "Wema Bank",
  "Ada Okafor",
  "2025-11-18 10:15:00",
];

const emptyIndividual: MigrationUserPayload = {
  legacy_user_id: "",
  full_name: "",
  email: "",
  phone: "",
  wallet_balance: "0",
  role: "user",
  virtual_account_number: "",
  virtual_account_bank: "",
  virtual_account_name: "",
  old_created_at: "",
};

function formatCurrency(value?: number | string | null) {
  const amount = Number(value || 0);
  return `NGN ${amount.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
}

function statusBadge(status: string) {
  const normalized = status.toLowerCase();
  if (["completed", "migrated", "valid"].includes(normalized)) {
    return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  }
  if (["completed_with_errors", "skipped", "pending", "running"].includes(normalized)) {
    return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  }
  if (["failed", "invalid", "error"].includes(normalized)) {
    return "bg-destructive/10 text-destructive border-destructive/20";
  }
  return "bg-secondary text-secondary-foreground border-border";
}

function downloadTemplate() {
  const csv = [templateHeaders, sampleRow]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "user-migration-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function SummaryTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        tone === "success" && "bg-emerald-500/5 border-emerald-500/20",
        tone === "warning" && "bg-amber-500/5 border-amber-500/20",
        tone === "danger" && "bg-destructive/5 border-destructive/20",
        tone === "default" && "bg-card border-border",
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
    </div>
  );
}

function PreviewTable({ preview }: { preview: MigrationPreview }) {
  const rows = preview.rows.slice(0, 25);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryTile label="Rows" value={preview.summary.total} />
        <SummaryTile label="Valid" value={preview.summary.valid} tone="success" />
        <SummaryTile label="Invalid" value={preview.summary.invalid} tone="danger" />
        <SummaryTile label="Existing" value={preview.summary.existing || 0} tone="warning" />
        <SummaryTile
          label="Wallet total"
          value={formatCurrency(preview.summary.wallet_total || 0)}
        />
      </div>

      <div className="rounded-2xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Row</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Email / Phone</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.row_number}>
                <TableCell className="font-mono text-xs">{row.row_number}</TableCell>
                <TableCell>
                  <p className="font-medium text-sm">{row.data.full_name || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.data.legacy_user_id || "No legacy ID"}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{row.data.email || "-"}</p>
                  <p className="text-xs text-muted-foreground">{row.data.phone || "-"}</p>
                </TableCell>
                <TableCell>{formatCurrency(row.data.wallet_balance)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusBadge(row.status)}>
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs">
                  {[...row.errors, ...row.warnings].length === 0 ? (
                    <span className="text-xs text-muted-foreground">Ready</span>
                  ) : (
                    <div className="space-y-1">
                      {[...row.errors, ...row.warnings].slice(0, 2).map((note) => (
                        <p key={note} className="text-xs text-muted-foreground line-clamp-1">
                          {note}
                        </p>
                      ))}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {preview.rows.length > rows.length && (
        <p className="text-xs text-muted-foreground text-center">
          Showing first {rows.length} of {preview.rows.length} rows.
        </p>
      )}
    </div>
  );
}

export function AdminMigrations() {
  const { dryRun, importRows, migrateIndividual, sendInvite } = useAdminMigrations();
  const { data: batches = [], isLoading: batchesLoading } = useMigrationBatches();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<MigrationPreview | null>(null);
  const [batchName, setBatchName] = useState("Legacy customer migration");
  const [sendBulkInvites, setSendBulkInvites] = useState(true);
  const [sendSingleInvite, setSendSingleInvite] = useState(true);
  const [individual, setIndividual] = useState<MigrationUserPayload>(emptyIndividual);
  const [search, setSearch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<MigrationBatch | null>(null);

  const { data: searchResults = [], isFetching: searching } = useMigrationSearch(search);
  const { data: batchDetail, isLoading: batchLoading } = useMigrationBatch(
    selectedBatch?.id || null,
  );

  const validPreviewRows = useMemo(
    () => preview?.rows.filter((row) => row.status === "valid" && row.action === "create") || [],
    [preview],
  );

  const handleDryRun = () => {
    if (!file) {
      toast.error("Choose a CSV file first");
      return;
    }
    dryRun.mutate(file, {
      onSuccess: (result) => {
        setPreview(result);
        toast.success("Migration file validated");
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const handleImport = () => {
    if (!preview || validPreviewRows.length === 0) {
      toast.error("There are no valid new users to import");
      return;
    }
    importRows.mutate(
      {
        rows: validPreviewRows.map((row) => row.data),
        batchName: batchName.trim() || "Legacy customer migration",
        sendInvites: sendBulkInvites,
      },
      {
        onSuccess: (result) => {
          toast.success(`Migration completed: ${result.summary.migrated || 0} users migrated`);
          setPreview(null);
          setFile(null);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const handleIndividualChange = (key: keyof MigrationUserPayload, value: string) => {
    setIndividual((prev) => ({ ...prev, [key]: value }));
  };

  const handleIndividualSubmit = () => {
    migrateIndividual.mutate(
      { user: individual, sendInvite: sendSingleInvite },
      {
        onSuccess: (result) => {
          const migrated = result.summary.migrated || 0;
          if (migrated > 0) {
            toast.success("Customer migrated successfully");
            setIndividual(emptyIndividual);
          } else {
            toast.warning("Customer was not migrated. Check validation notes.");
          }
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const handleSendInvite = (userId: string) => {
    sendInvite.mutate(userId, {
      onSuccess: (result) => {
        toast.success(
          result.reset_code
            ? `Invite sent. Dev reset code: ${result.reset_code}`
            : "Invite sent",
        );
      },
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <div className="space-y-6">
      <Alert className="border-primary/20 bg-primary/5">
        <UsersRound className="h-4 w-4" />
        <AlertTitle>Migration command center</AlertTitle>
        <AlertDescription>
          Move legacy customers in audited batches or one at a time. Wallet balances are
          imported as opening-balance transactions so reconciliation stays traceable.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="bulk" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="bulk">Bulk import</TabsTrigger>
          <TabsTrigger value="individual">Individual</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
        </TabsList>

        <TabsContent value="bulk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileSpreadsheet className="w-5 h-5" />
                Bulk customer onboarding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
                <div className="space-y-2">
                  <Label>Batch name</Label>
                  <Input value={batchName} onChange={(e) => setBatchName(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button variant="outline" onClick={downloadTemplate} className="w-full lg:w-auto">
                    <Download className="w-4 h-4 mr-2" />
                    Download template
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-dashed p-5 space-y-4">
                <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-sm">Upload CSV export</p>
                    <p className="text-xs text-muted-foreground">
                      Required columns: legacy ID, name, email, phone, wallet balance.
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept=".csv,text/csv"
                    className="md:max-w-sm"
                    onChange={(event) => setFile(event.target.files?.[0] || null)}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={handleDryRun} disabled={dryRun.isPending || !file}>
                    {dryRun.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Validate file
                  </Button>
                  <div className="flex items-center gap-2">
                    <Switch checked={sendBulkInvites} onCheckedChange={setSendBulkInvites} />
                    <Label className="text-sm">Send onboarding invites after import</Label>
                  </div>
                </div>
              </div>

              {preview && <PreviewTable preview={preview} />}

              {preview && (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-2xl bg-secondary/50 border p-4">
                  <div>
                    <p className="text-sm font-medium">Ready to migrate</p>
                    <p className="text-xs text-muted-foreground">
                      {validPreviewRows.length} valid new customers will be created. Invalid and
                      existing rows will be left untouched.
                    </p>
                  </div>
                  <Button onClick={handleImport} disabled={importRows.isPending || validPreviewRows.length === 0}>
                    {importRows.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Import valid users
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individual" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_0.8fr] gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserPlus className="w-5 h-5" />
                  Migrate one customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Legacy user ID</Label>
                    <Input
                      value={individual.legacy_user_id || ""}
                      onChange={(e) => handleIndividualChange("legacy_user_id", e.target.value)}
                      placeholder="OLD-10001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Full name</Label>
                    <Input
                      value={individual.full_name || ""}
                      onChange={(e) => handleIndividualChange("full_name", e.target.value)}
                      placeholder="Customer name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={individual.email || ""}
                      onChange={(e) => handleIndividualChange("email", e.target.value)}
                      placeholder="customer@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={individual.phone || ""}
                      onChange={(e) => handleIndividualChange("phone", e.target.value)}
                      placeholder="08031234567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Wallet balance</Label>
                    <Input
                      type="number"
                      min="0"
                      value={individual.wallet_balance || ""}
                      onChange={(e) => handleIndividualChange("wallet_balance", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input
                      value={individual.role || "user"}
                      onChange={(e) => handleIndividualChange("role", e.target.value)}
                      placeholder="user"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Virtual account number</Label>
                    <Input
                      value={individual.virtual_account_number || ""}
                      onChange={(e) =>
                        handleIndividualChange("virtual_account_number", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Virtual account bank</Label>
                    <Input
                      value={individual.virtual_account_bank || ""}
                      onChange={(e) =>
                        handleIndividualChange("virtual_account_bank", e.target.value)
                      }
                      placeholder="Wema Bank"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={sendSingleInvite} onCheckedChange={setSendSingleInvite} />
                  <Label>Send onboarding invite immediately</Label>
                </div>
                <Button onClick={handleIndividualSubmit} disabled={migrateIndividual.isPending}>
                  {migrateIndividual.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Migrate customer
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Search className="w-5 h-5" />
                  Find migrated customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search email, phone, name, or legacy ID"
                />
                {searching && (
                  <p className="flex items-center text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Searching...
                  </p>
                )}
                <div className="space-y-3">
                  {search.trim().length >= 2 && !searching && searchResults.length === 0 && (
                    <p className="text-sm text-muted-foreground">No migrated users found.</p>
                  )}
                  {searchResults.map((user) => (
                    <div key={user.user_id} className="rounded-2xl border p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-sm">{user.full_name || user.email}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground">{user.phone || "No phone"}</p>
                        </div>
                        <Badge variant="outline" className={statusBadge(user.migration_status || "unknown")}>
                          {user.migration_status || "unknown"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-muted-foreground">
                          {user.legacy_user_id || "No legacy ID"} - {formatCurrency(user.wallet_balance)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendInvite(user.user_id)}
                          disabled={sendInvite.isPending}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Send invite
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="batches" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <RefreshCw className="w-5 h-5" />
                Migration batches
              </CardTitle>
            </CardHeader>
            <CardContent>
              {batchesLoading ? (
                <div className="py-10 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : batches.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No migration batches yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rows</TableHead>
                      <TableHead>Wallet total</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell>
                          <p className="font-medium text-sm">{batch.name}</p>
                          <p className="text-xs text-muted-foreground">{batch.source}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusBadge(batch.status)}>
                            {batch.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {batch.migrated_rows} migrated / {batch.total_rows} total
                          {batch.failed_rows > 0 && (
                            <p className="text-xs text-destructive">{batch.failed_rows} failed</p>
                          )}
                        </TableCell>
                        <TableCell>{formatCurrency(batch.wallet_total)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(batch.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => setSelectedBatch(batch)}>
                            View rows
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedBatch} onOpenChange={(open) => !open && setSelectedBatch(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedBatch?.name || "Migration batch"}</DialogTitle>
          </DialogHeader>
          {batchLoading ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : batchDetail ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <SummaryTile label="Migrated" value={batchDetail.migrated_rows} tone="success" />
                <SummaryTile label="Failed" value={batchDetail.failed_rows} tone="danger" />
                <SummaryTile label="Skipped" value={batchDetail.skipped_rows} tone="warning" />
                <SummaryTile label="Wallet" value={formatCurrency(batchDetail.wallet_total)} />
              </div>
              <div className="max-h-[420px] overflow-auto rounded-2xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batchDetail.rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono text-xs">{row.row_number}</TableCell>
                        <TableCell>
                          <p className="text-sm">{row.email || row.phone || "-"}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.legacy_user_id || "No legacy ID"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusBadge(row.status)}>
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-sm">
                          {row.message || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Could not load batch</AlertTitle>
              <AlertDescription>Try closing this dialog and opening it again.</AlertDescription>
            </Alert>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
