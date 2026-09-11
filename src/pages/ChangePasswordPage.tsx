import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { api } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";

const ChangePasswordPage = () => {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({
        title: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/change-password", { new_password: newPassword });
      setDone(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update password";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="container max-w-lg mx-auto px-4">
          <PageHeader title="Change Password" />
          <div className="flex flex-col items-center gap-4 mt-20 text-center">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <p className="text-xl font-bold text-foreground">
              Password Updated!
            </p>
            <p className="text-sm text-muted-foreground">
              Your password has been changed. All other sessions have been
              logged out.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container max-w-lg mx-auto px-4">
        <PageHeader title="Change Password" />

        <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up">
          <div className="rounded-2xl bg-card border border-border/50 p-5 space-y-4">
            {/* New Password */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Strength hint */}
            {newPassword.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Password strength
                </p>
                <div className="flex gap-1">
                  {[6, 8, 12].map((threshold, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        newPassword.length >= threshold
                          ? i === 0
                            ? "bg-red-400"
                            : i === 1
                              ? "bg-yellow-400"
                              : "bg-green-500"
                          : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {newPassword.length < 6
                    ? "Too short"
                    : newPassword.length < 8
                      ? "Weak"
                      : newPassword.length < 12
                        ? "Moderate"
                        : "Strong"}
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {loading ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
