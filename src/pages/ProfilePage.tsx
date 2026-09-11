import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { api } from "@/lib/apiClient";
import { toast } from "@/hooks/use-toast";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Bell,
  CreditCard,
  ChevronRight,
  LogOut,
  Key,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  Copy,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, loading, updatePin, hasPin, updateProfile } = useProfile();
  const [referralSummary, setReferralSummary] = useState({
    referral_count: 0,
    total_rewards: 0,
  });

  useEffect(() => {
    api
      .get<{ referral_count: number; total_rewards: number }>("/referrals")
      .then(setReferralSummary)
      .catch(() => undefined);
  }, []);

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [pinForm, setPinForm] = useState({
    newPin: "",
    confirmPin: "",
  });

  const [editForm, setEditForm] = useState({
    fullName: profile?.full_name || "",
    phone: profile?.phone || "",
  });

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match",
        variant: "destructive",
      });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/auth/change-password", {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
      });
      toast({ title: "Success", description: "Password updated successfully" });
      setShowPasswordDialog(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePinChange = async () => {
    if (pinForm.newPin !== pinForm.confirmPin) {
      toast({
        title: "Error",
        description: "PINs don't match",
        variant: "destructive",
      });
      return;
    }
    if (pinForm.newPin.length !== 4 || !/^\d+$/.test(pinForm.newPin)) {
      toast({
        title: "Error",
        description: "PIN must be 4 digits",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePin(pinForm.newPin);
      toast({
        title: "Success",
        description: "Transaction PIN updated successfully",
      });
      setShowPinDialog(false);
      setPinForm({ newPin: "", confirmPin: "" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileUpdate = async () => {
    setIsSubmitting(true);
    try {
      await updateProfile({
        full_name: editForm.fullName,
        phone: editForm.phone,
      });
      toast({ title: "Success", description: "Profile updated successfully" });
      setShowEditDialog(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
    toast({ title: "Logged out", description: "See you soon!" });
  };

  const displayName =
    profile?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();

  const profileMenuItems = [
    {
      icon: User,
      label: "Edit Profile",
      onClick: () => {
        setEditForm({
          fullName: profile?.full_name || "",
          phone: profile?.phone || "",
        });
        setShowEditDialog(true);
      },
    },
    {
      icon: Key,
      label: "Change Password",
      onClick: () => setShowPasswordDialog(true),
    },
    {
      icon: Lock,
      label: hasPin() ? "Change PIN" : "Set Transaction PIN",
      onClick: () => setShowPinDialog(true),
    },
    {
      icon: Bell,
      label: "Notifications",
      onClick: () => navigate("/settings"),
    },
    { icon: CreditCard, label: "Payment Methods", onClick: () => {} },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container max-w-lg mx-auto px-4">
        <PageHeader title="Profile" />

        <div className="space-y-6">
          {/* Profile Card */}
          <section className="animate-slide-up">
            <div className="relative overflow-hidden rounded-3xl border border-border/40 shadow-sm">
              {/* Gradient banner */}
              <div className="h-24 bg-gradient-to-br from-primary via-primary/80 to-purple-500" />

              {/* Avatar — straddling banner + body */}
              <div className="px-6 pb-6 bg-card">
                <div className="flex items-end justify-between -mt-10 mb-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-primary-foreground font-bold text-3xl ring-4 ring-card shadow-lg">
                    {initials}
                  </div>
                  <button
                    onClick={() => {
                      setEditForm({
                        fullName: profile?.full_name || "",
                        phone: profile?.phone || "",
                      });
                      setShowEditDialog(true);
                    }}
                    className="text-xs font-medium px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border/50 transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>

                <h2 className="text-xl font-bold text-foreground">
                  {displayName}
                </h2>
                <p className="text-sm text-muted-foreground mb-3">
                  {user?.email}
                </p>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Verified
                  </span>
                  {hasPin() && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                      <Lock className="w-3 h-3" />
                      PIN Set
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section
            className="animate-slide-up"
            style={{ animationDelay: "0.05s" }}
          >
            <div className="rounded-2xl bg-secondary/50 border border-border/50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground">
                    Referral Rewards
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Earn a share of profit from transactions made by your
                    referrals.
                  </p>
                </div>
                <button
                  type="button"
                  title="Copy referral link"
                  aria-label="Copy referral link"
                  className="p-2 rounded-lg hover:bg-background transition-colors"
                  onClick={() => {
                    const code = profile?.referral_code || user?.referral_code;
                    if (!code) return;
                    navigator.clipboard.writeText(
                      `${window.location.origin}/auth?ref=${code}`,
                    );
                    toast({ title: "Referral link copied" });
                  }}
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div>
                  <p className="text-xs text-muted-foreground">Your code</p>
                  <p className="font-semibold tracking-wide">
                    {profile?.referral_code || user?.referral_code || "..."}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Referrals</p>
                  <p className="font-semibold">
                    {referralSummary.referral_count}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rewards</p>
                  <p className="font-semibold">
                    ₦{referralSummary.total_rewards.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Info */}
          <section
            className="animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Account Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 border border-border/50">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 border border-border/50">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">
                    {profile?.phone || "Not set"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 border border-border/50">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Virtual Account
                  </p>
                  <p className="font-medium text-foreground">
                    {profile?.virtual_account_number} (
                    {profile?.virtual_account_bank})
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Menu Items */}
          <section
            className="animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Account Settings
            </h3>
            <div className="space-y-2">
              {profileMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 border border-border/50 hover:bg-secondary transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="flex-1 text-left font-medium text-foreground">
                      {item.label}
                    </span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </section>

          {/* Logout */}
          <Button
            variant="outline"
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={editForm.fullName}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, fullName: e.target.value }))
                }
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="+234 801 234 5678"
              />
            </div>
            <Button
              onClick={handleProfileUpdate}
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter a new password for your account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                placeholder="Confirm new password"
              />
            </div>
            <Button
              onClick={handlePasswordChange}
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Update Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change PIN Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {hasPin() ? "Change Transaction PIN" : "Set Transaction PIN"}
            </DialogTitle>
            <DialogDescription>
              Your 4-digit PIN is used to authorize transactions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="newPin">New PIN</Label>
              <Input
                id="newPin"
                type="password"
                maxLength={4}
                inputMode="numeric"
                pattern="[0-9]*"
                value={pinForm.newPin}
                onChange={(e) =>
                  setPinForm((prev) => ({
                    ...prev,
                    newPin: e.target.value.replace(/\D/g, ""),
                  }))
                }
                placeholder="Enter 4-digit PIN"
                className="text-center text-2xl tracking-widest"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPin">Confirm PIN</Label>
              <Input
                id="confirmPin"
                type="password"
                maxLength={4}
                inputMode="numeric"
                pattern="[0-9]*"
                value={pinForm.confirmPin}
                onChange={(e) =>
                  setPinForm((prev) => ({
                    ...prev,
                    confirmPin: e.target.value.replace(/\D/g, ""),
                  }))
                }
                placeholder="Confirm 4-digit PIN"
                className="text-center text-2xl tracking-widest"
              />
            </div>
            <Button
              onClick={handlePinChange}
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              {hasPin() ? "Update PIN" : "Set PIN"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default ProfilePage;
