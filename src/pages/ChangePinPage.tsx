import { useState, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { CheckCircle, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useQueryClient } from "@tanstack/react-query";

const PinInput = ({
  label,
  value,
  onChange,
  show,
  onToggleShow,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
}) => {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handleChange = (i: number, ch: string) => {
    ch = ch.replace(/\D/g, "");
    if (!ch) return;
    const arr = value.split("");
    arr[i] = ch[ch.length - 1];
    const next = arr.join("").slice(0, 4);
    onChange(next);
    if (i < 3) inputs.current[i + 1]?.focus();
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="relative flex items-center gap-3">
        {[0, 1, 2, 3].map((i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            type={show ? "text" : "password"}
            inputMode="numeric"
            maxLength={1}
            value={value[i] ?? ""}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e)}
            className="w-14 h-14 text-center text-xl font-bold rounded-xl border-2 border-input bg-background focus:outline-none focus:border-primary transition-colors"
          />
        ))}
        <button
          type="button"
          onClick={onToggleShow}
          className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};

const ChangePinPage = () => {
  const { toast } = useToast();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const pinIsSet = !!profile?.pin_is_set;

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (pinIsSet && currentPin.length !== 4) {
      toast({ title: "Enter your current PIN", variant: "destructive" });
      return;
    }
    if (newPin.length !== 4) {
      toast({ title: "New PIN must be 4 digits", variant: "destructive" });
      return;
    }
    if (newPin !== confirmPin) {
      toast({ title: "PINs do not match", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // If PIN is already set, verify current PIN first
      if (pinIsSet) {
        const verify = await api.post<{ valid: boolean }>(
          "/profile/pin/verify",
          { pin: currentPin },
        );
        if (!verify.valid) {
          toast({ title: "Current PIN is incorrect", variant: "destructive" });
          setLoading(false);
          return;
        }
      }

      await api.post("/profile/pin", { pin: newPin });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setDone(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update PIN";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="container max-w-lg mx-auto px-4">
          <PageHeader title="Change PIN" />
          <div className="flex flex-col items-center gap-4 mt-20 text-center">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <p className="text-xl font-bold text-foreground">PIN Updated!</p>
            <p className="text-sm text-muted-foreground">
              Your transaction PIN has been changed successfully.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container max-w-lg mx-auto px-4">
        <PageHeader title="Change PIN" />

        <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up">
          <div className="rounded-2xl bg-card border border-border/50 p-5 space-y-6">
            {pinIsSet && (
              <PinInput
                label="Current PIN"
                value={currentPin}
                onChange={setCurrentPin}
                show={showCurrent}
                onToggleShow={() => setShowCurrent((v) => !v)}
              />
            )}
            <PinInput
              label="New PIN"
              value={newPin}
              onChange={setNewPin}
              show={showNew}
              onToggleShow={() => setShowNew((v) => !v)}
            />
            <PinInput
              label="Confirm New PIN"
              value={confirmPin}
              onChange={setConfirmPin}
              show={showConfirm}
              onToggleShow={() => setShowConfirm((v) => !v)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {loading ? "Saving…" : pinIsSet ? "Change PIN" : "Set PIN"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePinPage;
