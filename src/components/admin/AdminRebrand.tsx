import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { api } from "@/lib/apiClient";
import { AlertTriangle, RefreshCw, ShieldAlert, Trash2 } from "lucide-react";

interface ResetResult {
  cleared_tables: Record<string, number>;
  superadmin: { user_id: string; email: string; name: string };
  preserved_tables: string[];
}

export function AdminRebrand() {
  const [adminEmail, setAdminEmail] = useState("superadmin@admin.com");
  const [adminPassword, setAdminPassword] = useState("Admin@1234");
  const [adminName, setAdminName] = useState("Super Admin");
  const [confirmText, setConfirmText] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResetResult | null>(null);

  const handleOpenDialog = () => {
    if (!adminEmail || !adminPassword || !adminName) {
      toast.error("Fill in all superadmin fields before proceeding.");
      return;
    }
    if (adminPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setConfirmText("");
    setDialogOpen(true);
  };

  const handleReset = async () => {
    if (confirmText !== "RESET") {
      toast.error('Type exactly "RESET" to confirm.');
      return;
    }
    setLoading(true);
    try {
      const data = await api.post<ResetResult>("/admin/rebrand/reset", {
        confirm: "RESET",
        admin_email: adminEmail,
        admin_password: adminPassword,
        admin_name: adminName,
      });
      setResult(data);
      setDialogOpen(false);
      toast.success("Database reset complete. You will be logged out.");
      // Give the user a moment to read the toast, then force re-login
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  const totalRows = result
    ? Object.values(result.cleared_tables).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Warning Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-destructive/40 bg-destructive/10">
        <ShieldAlert className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-destructive">
            Destructive Operation
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            This permanently deletes all users, transactions, notifications, API
            keys and promotions. Pricing, services and provider configs are
            preserved. Use this only when rebranding to a new identity.
          </p>
        </div>
      </div>

      {/* New Superadmin Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Rebrand — Database Reset
          </CardTitle>
          <CardDescription>
            Set the superadmin credentials that will be seeded after the reset.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-name">Full Name</Label>
            <Input
              id="admin-name"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="Super Admin"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="superadmin@admin.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Min. 8 characters"
            />
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3">
              <strong>Will be cleared:</strong> users, profiles, user_roles,
              transactions, notifications, auth_tokens, api_users,
              api_request_logs, promotions, support_tickets,
              support_ticket_messages
              <br />
              <strong>Will be kept:</strong> services, service_pricing,
              provider_configs, api_pricing_tiers, api_service_access
            </p>
            <Button
              variant="destructive"
              onClick={handleOpenDialog}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Reset Database for Rebrand
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Confirm Database Reset
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all user accounts and data. This
              action <strong>cannot be undone</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              New superadmin: <strong>{adminEmail}</strong>
            </p>
            <div className="space-y-1">
              <Label htmlFor="confirm-input">
                Type <span className="font-mono font-bold">RESET</span> to
                confirm
              </Label>
              <Input
                id="confirm-input"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="RESET"
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReset}
              disabled={loading || confirmText !== "RESET"}
            >
              {loading ? "Resetting…" : "Confirm Reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Summary (shown after reset, before redirect) */}
      {result && (
        <Card className="border-green-500/40 bg-green-500/5">
          <CardHeader>
            <CardTitle className="text-green-500 text-sm">
              Reset Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              {totalRows} total rows cleared across{" "}
              {Object.keys(result.cleared_tables).length} tables.
            </p>
            <p>
              New superadmin: <strong>{result.superadmin.email}</strong>
            </p>
            <p className="text-muted-foreground">Redirecting to login…</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
