import { useState } from "react";
import {
  Users,
  Shield,
  ShieldCheck,
  User,
  MoreVertical,
  Loader2,
  Plus,
  Minus,
  RotateCcw,
  Wallet,
  Eye,
  KeyRound,
  Lock,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ADMIN_PAGE_PERMISSIONS } from "@/config/adminPermissions";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAdminUsers,
  useAdminUserDetail,
  useAdminResetPassword,
  useAdminResetPin,
} from "@/hooks/useAdminUsers";

type FundAction = "fund" | "deduct" | "reset";

interface SelectedUser {
  user_id: string;
  full_name: string | null;
  wallet_balance: number | null;
}

interface PageAccessUser {
  user_id: string;
  full_name: string | null;
  permissions: string[];
}

// ─── User Detail Panel ─────────────────────────────────────────────────────────

function UserDetailPanel({
  userId,
  onBack,
}: {
  userId: string;
  onBack: () => void;
}) {
  const { data, isLoading } = useAdminUserDetail(userId);
  const resetPassword = useAdminResetPassword();
  const resetPin = useAdminResetPin();

  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showResetPinDialog, setShowResetPinDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const handleResetPassword = () => {
    if (!newPassword || newPassword.length < 6) return;
    resetPassword.mutate(
      { userId, password: newPassword },
      {
        onSuccess: () => {
          setShowResetPasswordDialog(false);
          setNewPassword("");
        },
      },
    );
  };

  const handleResetPin = () => {
    resetPin.mutate(userId, { onSuccess: () => setShowResetPinDialog(false) });
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString("en-NG", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500/10 text-green-500";
      case "failed":
        return "bg-destructive/10 text-destructive";
      case "pending":
        return "bg-warning/10 text-warning";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ChevronLeft className="w-4 h-4" /> Back to Users
        </Button>
        <p className="text-muted-foreground text-sm">
          Failed to load user details.
        </p>
      </div>
    );
  }

  const { profile, transactions } = data;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="gap-2 -ml-2"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Users
      </Button>

      {/* Profile Card */}
      <div className="glass-card p-5 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-xl">
              {profile.full_name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {profile.full_name || "Unknown User"}
              </h3>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              {profile.phone && (
                <p className="text-xs text-muted-foreground">{profile.phone}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.role && (
              <span
                className={cn(
                  "text-xs font-medium px-2.5 py-1 rounded-full",
                  profile.role === "admin"
                    ? "bg-primary/20 text-primary"
                    : profile.role === "moderator"
                      ? "bg-warning/20 text-warning"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </span>
            )}
            <span
              className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full",
                profile.has_pin
                  ? "bg-green-500/10 text-green-500"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {profile.has_pin ? "PIN set" : "No PIN"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground mb-1">Wallet Balance</p>
            <p className="text-base font-semibold text-foreground">
              ₦{(profile.wallet_balance || 0).toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground mb-1">Joined</p>
            <p className="text-sm font-medium text-foreground">
              {formatDate(profile.created_at)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground mb-1">User ID</p>
            <p className="text-xs font-mono text-muted-foreground truncate">
              {profile.user_id}
            </p>
          </div>
        </div>

        {/* Security Actions */}
        <div className="flex flex-wrap gap-3 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowResetPasswordDialog(true)}
          >
            <KeyRound className="w-4 h-4" />
            Reset Password
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowResetPinDialog(true)}
          >
            <Lock className="w-4 h-4" />
            Clear PIN
          </Button>
        </div>
      </div>

      {/* Transactions */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h4 className="text-sm font-semibold text-foreground">
            Recent Transactions
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Last {transactions.length} transactions
          </p>
        </div>
        {transactions.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No transactions found
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {transactions.map((tx) => {
              const isCredit = tx.amount >= 0;
              return (
                <div
                  key={tx.id}
                  className="flex items-start gap-3 p-4 hover:bg-secondary/30 transition-colors"
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      isCredit ? "bg-green-500/10" : "bg-destructive/10",
                    )}
                  >
                    {isCredit ? (
                      <ArrowDownLeft className="w-4 h-4 text-green-500" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground break-words leading-snug">
                      {tx.description || tx.type}
                    </p>
                    <div className="flex items-center flex-wrap gap-2 mt-1">
                      <span
                        className={cn(
                          "text-xs font-medium px-1.5 py-0.5 rounded",
                          getStatusBadge(tx.status),
                        )}
                      >
                        {tx.status}
                      </span>
                      {tx.reference && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {tx.reference}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(tx.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        isCredit ? "text-green-500" : "text-destructive",
                      )}
                    >
                      {isCredit ? "+" : ""}₦
                      {Math.abs(tx.amount).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reset Password Dialog */}
      <Dialog
        open={showResetPasswordDialog}
        onOpenChange={(o) => {
          if (!o) {
            setShowResetPasswordDialog(false);
            setNewPassword("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-warning" />
              Reset User Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for{" "}
              <strong>{profile.full_name || profile.email}</strong>. Share it
              securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm font-medium text-foreground">
              New Password
            </label>
            <Input
              type="text"
              placeholder="Min. 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="off"
            />
            {newPassword.length > 0 && newPassword.length < 6 && (
              <p className="text-xs text-destructive">
                Password must be at least 6 characters
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowResetPasswordDialog(false);
                setNewPassword("");
              }}
              disabled={resetPassword.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={
                resetPassword.isPending ||
                !newPassword ||
                newPassword.length < 6
              }
            >
              {resetPassword.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset PIN Dialog */}
      <Dialog open={showResetPinDialog} onOpenChange={setShowResetPinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-destructive" />
              Clear User PIN
            </DialogTitle>
            <DialogDescription>
              This will clear the PIN for{" "}
              <strong>{profile.full_name || profile.email}</strong>. They will
              need to set a new PIN on their next transaction.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResetPinDialog(false)}
              disabled={resetPin.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetPin}
              disabled={resetPin.isPending}
            >
              {resetPin.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Clear PIN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function AdminUsers() {
  const { user: currentUser } = useAuth();
  const {
    users,
    isLoading,
    assignRole,
    removeRole,
    updatePermissions,
    fundWallet,
    deductWallet,
    resetWallet,
  } = useAdminUsers();
  const [fundAction, setFundAction] = useState<FundAction | null>(null);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [amount, setAmount] = useState("");
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pageAccessUser, setPageAccessUser] = useState<PageAccessUser | null>(
    null,
  );
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.user_id.toLowerCase().includes(q)
    );
  });

  const openFundDialog = (user: SelectedUser, action: FundAction) => {
    setSelectedUser(user);
    setFundAction(action);
    setAmount("");
  };

  const closeFundDialog = () => {
    setSelectedUser(null);
    setFundAction(null);
    setAmount("");
  };

  const openPageAccessDialog = (user: PageAccessUser) => {
    setPageAccessUser(user);
    setSelectedPermissions(user.permissions ?? []);
  };

  const closePageAccessDialog = () => {
    setPageAccessUser(null);
    setSelectedPermissions([]);
  };

  const savePageAccess = () => {
    if (!pageAccessUser) return;
    updatePermissions.mutate(
      { userId: pageAccessUser.user_id, permissions: selectedPermissions },
      { onSuccess: closePageAccessDialog },
    );
  };

  const handleConfirm = () => {
    if (!selectedUser) return;
    if (fundAction === "reset") {
      resetWallet.mutate(selectedUser.user_id, { onSuccess: closeFundDialog });
    } else if (fundAction === "fund") {
      const num = parseFloat(amount);
      if (!num || num <= 0) return;
      fundWallet.mutate(
        { userId: selectedUser.user_id, amount: num },
        { onSuccess: closeFundDialog },
      );
    } else if (fundAction === "deduct") {
      const num = parseFloat(amount);
      if (!num || num <= 0) return;
      deductWallet.mutate(
        { userId: selectedUser.user_id, amount: num },
        { onSuccess: closeFundDialog },
      );
    }
  };

  const isMutating =
    fundWallet.isPending || deductWallet.isPending || resetWallet.isPending;

  const dialogConfig = {
    fund: {
      title: "Fund Wallet",
      description: "Add funds to this user's wallet.",
      icon: Plus,
      color: "text-green-500",
    },
    deduct: {
      title: "Deduct from Wallet",
      description: "Remove funds from this user's wallet.",
      icon: Minus,
      color: "text-destructive",
    },
    reset: {
      title: "Reset Wallet",
      description:
        "Reset this user's wallet balance to ₦0. This cannot be undone.",
      icon: RotateCcw,
      color: "text-warning",
    },
  };

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case "admin":
        return <ShieldCheck className="w-4 h-4 text-primary" />;
      case "moderator":
        return <Shield className="w-4 h-4 text-warning" />;
      default:
        return <User className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRoleBadgeStyles = (role: string | null) => {
    switch (role) {
      case "admin":
        return "bg-primary/20 text-primary";
      case "moderator":
        return "bg-warning/20 text-warning";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (viewingUserId) {
    return (
      <UserDetailPanel
        userId={viewingUserId}
        onBack={() => setViewingUserId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              User Management
            </h2>
            <p className="text-sm text-muted-foreground">
              {filtered.length === users.length
                ? `${users.length} total users`
                : `${filtered.length} of ${users.length} users`}
            </p>
          </div>
        </div>
        <Input
          placeholder="Search name, email, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full text-sm sm:w-64"
        />
      </div>

      {/* Users Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="whitespace-nowrap px-2 py-3 text-left text-sm font-medium text-muted-foreground sm:p-4">
                  User
                </th>
                <th className="hidden whitespace-nowrap px-2 py-3 text-left text-sm font-medium text-muted-foreground sm:table-cell sm:p-4">
                  Phone
                </th>
                <th className="whitespace-nowrap px-2 py-3 text-left text-sm font-medium text-muted-foreground sm:p-4">
                  Balance
                </th>
                <th className="hidden whitespace-nowrap px-2 py-3 text-left text-sm font-medium text-muted-foreground sm:table-cell sm:p-4">
                  Role
                </th>
                <th className="hidden whitespace-nowrap px-2 py-3 text-left text-sm font-medium text-muted-foreground sm:table-cell sm:p-4">
                  Joined
                </th>
                <th className="whitespace-nowrap px-2 py-3 text-left text-sm font-medium text-muted-foreground sm:p-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-sm text-muted-foreground"
                  >
                    No users match your search
                  </td>
                </tr>
              ) : null}
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                >
                  <td className="max-w-[11rem] px-2 py-3 sm:max-w-none sm:p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-medium text-sm">
                        {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {user.full_name || "Unknown User"}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {user.user_id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden p-4 text-sm text-muted-foreground sm:table-cell">
                    {user.phone || "Not set"}
                  </td>
                  <td className="whitespace-nowrap px-2 py-3 text-sm font-medium text-foreground sm:p-4">
                    ₦{(user.wallet_balance || 0).toLocaleString()}
                  </td>
                  <td className="hidden p-4 sm:table-cell">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
                        getRoleBadgeStyles(user.role),
                      )}
                    >
                      {getRoleIcon(user.role)}
                      {user.role
                        ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                        : "User"}
                    </span>
                  </td>
                  <td className="hidden p-4 text-sm text-muted-foreground sm:table-cell">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-2 py-3 sm:p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setViewingUserId(user.user_id)}
                        >
                          <Eye className="w-4 h-4 mr-2 text-primary" />
                          View Account
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="flex items-center gap-2">
                          <Wallet className="w-4 h-4" /> Fund Management
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => openFundDialog(user, "fund")}
                        >
                          <Plus className="w-4 h-4 mr-2 text-green-500" />
                          Fund Wallet
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openFundDialog(user, "deduct")}
                        >
                          <Minus className="w-4 h-4 mr-2 text-destructive" />
                          Deduct from Wallet
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openFundDialog(user, "reset")}
                        >
                          <RotateCcw className="w-4 h-4 mr-2 text-warning" />
                          Reset Wallet
                        </DropdownMenuItem>
                        {currentUser?.role === "admin" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="flex items-center gap-2">
                              <Shield className="w-4 h-4" /> Role Management
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() =>
                                assignRole.mutate({
                                  userId: user.user_id,
                                  role: "admin",
                                })
                              }
                              disabled={user.role === "admin"}
                            >
                              <ShieldCheck className="w-4 h-4 mr-2" />
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                assignRole.mutate({
                                  userId: user.user_id,
                                  role: "moderator",
                                })
                              }
                              disabled={user.role === "moderator"}
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              Make Moderator
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openPageAccessDialog(user)}
                            >
                              <KeyRound className="w-4 h-4 mr-2" />
                              Page Access
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => removeRole.mutate(user.user_id)}
                          disabled={!user.role}
                          className="text-destructive focus:text-destructive"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Remove Role
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={!!pageAccessUser}
        onOpenChange={(open) => !open && closePageAccessDialog()}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Page Access</DialogTitle>
            <DialogDescription>
              Choose the admin pages {pageAccessUser?.full_name || "this user"}{" "}
              can access. Assign a Moderator role for these permissions to take
              effect.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2 sm:grid-cols-2">
            {ADMIN_PAGE_PERMISSIONS.map((permission) => (
              <label
                key={permission.id}
                className="flex items-center gap-3 rounded-lg border p-3 text-sm hover:bg-secondary/50"
              >
                <Checkbox
                  checked={selectedPermissions.includes(permission.id)}
                  onCheckedChange={(checked) =>
                    setSelectedPermissions((current) =>
                      checked
                        ? [...current, permission.id]
                        : current.filter((item) => item !== permission.id),
                    )
                  }
                />
                <span>{permission.label}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closePageAccessDialog}>
              Cancel
            </Button>
            <Button
              onClick={savePageAccess}
              disabled={updatePermissions.isPending}
            >
              {updatePermissions.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fund Management Dialog */}
      {fundAction && selectedUser && (
        <Dialog
          open={!!fundAction}
          onOpenChange={(open) => !open && closeFundDialog()}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {(() => {
                  const Icon = dialogConfig[fundAction].icon;
                  return (
                    <Icon
                      className={cn("w-5 h-5", dialogConfig[fundAction].color)}
                    />
                  );
                })()}
                {dialogConfig[fundAction].title}
              </DialogTitle>
              <DialogDescription>
                {dialogConfig[fundAction].description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-medium text-sm">
                  {selectedUser.full_name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {selectedUser.full_name || "Unknown User"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Current balance: ₦
                    {(selectedUser.wallet_balance || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {fundAction !== "reset" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Amount (₦)
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={closeFundDialog}
                disabled={isMutating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={
                  isMutating ||
                  (fundAction !== "reset" &&
                    (!amount || parseFloat(amount) <= 0))
                }
                variant={
                  fundAction === "deduct" || fundAction === "reset"
                    ? "destructive"
                    : "default"
                }
              >
                {isMutating && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {fundAction === "fund"
                  ? "Fund"
                  : fundAction === "deduct"
                    ? "Deduct"
                    : "Reset to ₦0"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
