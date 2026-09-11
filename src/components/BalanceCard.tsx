import {
  Eye,
  EyeOff,
  Plus,
  Copy,
  Check,
  Building2,
  Sparkles,
  AlertCircle,
  Loader2,
  History,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { api } from "@/lib/apiClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function BalanceCard() {
  const [showBalance, setShowBalance] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [bvn, setBvn] = useState("");
  const [bvnError, setBvnError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showFundDialog, setShowFundDialog] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [funding, setFunding] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [generateGateway, setGenerateGateway] = useState<
    "topupmate" | "monnify"
  >("topupmate");

  const navigate = useNavigate();
  const { profile, loading, generateVirtualAccount, refetch } = useProfile();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("payment_reference");
    if (!reference) return;

    let cancelled = false;
    api
      .get<{ status: string; new_balance: number | null }>(
        `/payments/monnify/verify/${encodeURIComponent(reference)}`,
      )
      .then(async (result) => {
        if (cancelled) return;
        if (result.status === "completed") {
          await refetch();
          toast({
            title: "Wallet funded!",
            description: "Your Monnify payment has been confirmed.",
          });
        } else {
          toast({
            title: "Payment pending",
            description: "We will credit your wallet once Monnify confirms the payment.",
          });
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          toast({
            title: "Payment verification delayed",
            description: error.message,
            variant: "destructive",
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          params.delete("payment_reference");
          const query = params.toString();
          window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [refetch]);

  const handleFundWallet = async () => {
    const amount = Number(fundAmount);
    if (!Number.isFinite(amount) || amount < 100 || amount > 1_000_000) {
      toast({
        title: "Enter a valid amount",
        description: "Funding amount must be between ₦100 and ₦1,000,000.",
        variant: "destructive",
      });
      return;
    }

    setFunding(true);
    try {
      const result = await api.post<{ reference: string; checkout_url: string }>(
        "/payments/monnify/initialize",
        { amount },
      );
      const checkout = new URL(result.checkout_url);
      if (checkout.protocol !== "https:") {
        throw new Error("Payment provider returned an invalid checkout URL.");
      }
      window.location.assign(checkout.toString());
    } catch (error: unknown) {
      toast({
        title: "Could not start payment",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
      setFunding(false);
    }
  };

  const balance = profile?.wallet_balance || 0;
  const hasVirtualAccount = profile?.has_virtual_account ?? false;
  const isProfileComplete = !!profile?.full_name && !!profile?.phone;
  const enabledGateways = profile?.enabled_payment_gateways ?? [];
  const virtualAccounts = useMemo(
    () => profile?.virtual_accounts ?? [],
    [profile?.virtual_accounts],
  );
  const missingGateways = enabledGateways.filter(
    (gateway) =>
      !virtualAccounts.some((account) => account.gateway === gateway),
  );
  const canUseMonnifyCheckout = enabledGateways.includes("monnify");

  useEffect(() => {
    if (
      virtualAccounts.length > 0 &&
      !virtualAccounts.some((account) => account.id === selectedAccountId)
    ) {
      setSelectedAccountId(virtualAccounts[0].id);
    }
  }, [selectedAccountId, virtualAccounts]);

  const selectedAccount =
    virtualAccounts.find((account) => account.id === selectedAccountId) ??
    virtualAccounts[0];

  const copyAccountNumber = async () => {
    if (!selectedAccount?.account_number) return;
    try {
      await navigator.clipboard.writeText(selectedAccount.account_number);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Account number copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  const handleGenerate = async () => {
    setBvnError("");
    if (!/^\d{11}$/.test(bvn.trim())) {
      setBvnError("BVN must be exactly 11 digits");
      return;
    }
    setGenerating(true);
    try {
      await generateVirtualAccount(bvn.trim(), generateGateway);
      setShowGenerateDialog(false);
      setBvn("");
      toast({
        title: "Virtual account created!",
        description: "Your dedicated account is ready to receive payments.",
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Could not generate virtual account";
      toast({
        title: "Generation failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <div className="balance-card animate-slide-up group">
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 15%, rgba(255,255,255,0.22) 0 1px, transparent 1px), radial-gradient(circle at 82% 22%, rgba(255,255,255,0.18) 0 1px, transparent 1px)",
            backgroundSize: "28px 28px, 36px 36px",
          }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(255,255,255,0.24) 0 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(255,255,255,0.32),transparent_28%),radial-gradient(circle_at_85%_8%,rgba(255,255,255,0.24),transparent_24%),linear-gradient(115deg,transparent_0%,rgba(255,255,255,0.16)_46%,transparent_56%)]" />
        <div className="absolute -top-16 -right-10 w-44 h-44 rounded-full border border-white/25 bg-white/10" />
        <div className="absolute -top-8 right-8 w-20 h-20 rounded-full border border-white/20" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-indigo-900/20 translate-y-1/2 -translate-x-1/3" />
        <div className="absolute -bottom-10 right-20 w-28 h-28 rounded-full bg-cyan-300/10 blur-2xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-primary-foreground/85 text-sm font-semibold tracking-wide">
              Wallet Balance
            </span>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="rounded-full bg-white/10 p-2 text-primary-foreground/85 hover:bg-white/20 hover:text-primary-foreground transition-colors"
            >
              {showBalance ? (
                <Eye className="w-5 h-5" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="flex items-baseline gap-1 mb-4 drop-shadow-sm">
            <span className="text-primary-foreground/80 text-xl font-bold">
              ₦
            </span>
            <span className="text-3xl md:text-4xl font-bold text-primary-foreground">
              {showBalance
                ? Number(balance).toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })
                : "••••••"}
            </span>
          </div>

          {/* Virtual Account Section */}
          <div className="mb-4 p-3 rounded-2xl bg-white/[0.12] backdrop-blur-md border border-white/25 shadow-inner shadow-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-primary-foreground/80" />
              <span className="text-xs text-primary-foreground/70 font-medium">
                Fund via Bank Transfer
              </span>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 py-1">
                <Loader2 className="w-4 h-4 animate-spin text-primary-foreground/60" />
                <span className="text-sm text-primary-foreground/60">
                  Loading account...
                </span>
              </div>
            ) : hasVirtualAccount && selectedAccount ? (
              <div className="space-y-2">
                {virtualAccounts.length > 1 && (
                  <select
                    aria-label="Select funding account"
                    value={selectedAccount.id}
                    onChange={(event) => setSelectedAccountId(event.target.value)}
                    className="w-full rounded-lg border border-white/25 bg-white/15 px-2 py-1.5 text-xs text-primary-foreground outline-none"
                  >
                    {virtualAccounts.map((account) => (
                      <option key={account.id} value={account.id} className="text-foreground">
                        {account.gateway === "monnify" ? "Monnify" : "Topupmate"} · {account.bank_name} · {account.account_number}
                      </option>
                    ))}
                  </select>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-primary-foreground tracking-wider">
                      {selectedAccount.account_number}
                    </p>
                    <p className="text-xs text-primary-foreground/70">
                      {selectedAccount.bank_name} · {selectedAccount.account_name}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wide text-primary-foreground/55">
                      {selectedAccount.gateway}
                    </p>
                  </div>
                  <Button
                    variant="glass"
                    size="icon"
                    onClick={copyAccountNumber}
                    className="h-9 w-9 bg-white/20 hover:bg-white/30 text-primary-foreground border-white/25 shadow-lg shadow-black/10"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                {missingGateways.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setGenerateGateway(missingGateways[0]);
                      setShowGenerateDialog(true);
                    }}
                    className="text-xs font-medium text-primary-foreground/80 hover:text-primary-foreground"
                  >
                    + Add {missingGateways[0] === "monnify" ? "Monnify" : "Topupmate"} account
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setGenerateGateway(missingGateways[0] ?? "topupmate");
                  setShowGenerateDialog(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-primary-foreground text-sm font-semibold transition-all border border-white/25 shadow-lg shadow-black/10 hover:-translate-y-0.5"
              >
                <Sparkles className="w-4 h-4" />
                Generate Virtual Account
              </button>
            )}
          </div>

          <div className="flex gap-3">
            {canUseMonnifyCheckout && (
              <Button
                variant="glass"
                className="flex-1 bg-white/20 hover:bg-white/30 text-primary-foreground border-white/25 shadow-lg shadow-black/10 hover:-translate-y-0.5"
                onClick={() => setShowFundDialog(true)}
              >
                <Plus className="w-4 h-4" />
                Fund Wallet
              </Button>
            )}
            <Button
              variant="glass"
              className="flex-1 bg-white/20 hover:bg-white/30 text-primary-foreground border-white/25 shadow-lg shadow-black/10 hover:-translate-y-0.5"
              onClick={() => navigate("/history")}
            >
              <History className="w-4 h-4" />
              Transactions
            </Button>
          </div>
        </div>
      </div>

      {/* Generate Virtual Account Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Generate Virtual Account
            </DialogTitle>
            <DialogDescription>
              Get a dedicated account number to receive payments instantly.
            </DialogDescription>
          </DialogHeader>

          {!isProfileComplete ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Please complete your profile (full name and phone number)
                  before generating a virtual account.
                </p>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  setShowGenerateDialog(false);
                  navigate("/profile");
                }}
              >
                Complete Profile
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {missingGateways.length > 1 && (
                <div className="space-y-2">
                  <Label htmlFor="account-gateway">Payment Gateway</Label>
                  <select
                    id="account-gateway"
                    value={generateGateway}
                    onChange={(event) =>
                      setGenerateGateway(
                        event.target.value as "topupmate" | "monnify",
                      )
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {missingGateways.map((gateway) => (
                      <option key={gateway} value={gateway}>
                        {gateway === "monnify" ? "Monnify" : "Topupmate"}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="bvn">Bank Verification Number (BVN)</Label>
                <Input
                  id="bvn"
                  type="text"
                  inputMode="numeric"
                  maxLength={11}
                  placeholder="Enter your 11-digit BVN"
                  value={bvn}
                  onChange={(e) => {
                    setBvn(e.target.value.replace(/\D/g, ""));
                    setBvnError("");
                  }}
                  disabled={generating}
                />
                {bvnError && (
                  <p className="text-sm text-destructive">{bvnError}</p>
                )}
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Your BVN is used only to verify your identity with our payment
                  partner. It is never stored on our servers.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowGenerateDialog(false)}
                  disabled={generating}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleGenerate}
                  disabled={generating || bvn.length !== 11}
                >
                  {generating && (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  )}
                  {generating ? "Generating..." : "Generate Account"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showFundDialog} onOpenChange={setShowFundDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fund Wallet</DialogTitle>
            <DialogDescription>
              Pay securely with card or bank transfer through Monnify.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fund-amount">Amount</Label>
              <Input
                id="fund-amount"
                type="number"
                inputMode="decimal"
                min={100}
                max={1000000}
                step="0.01"
                placeholder="Minimum ₦100"
                value={fundAmount}
                onChange={(event) => setFundAmount(event.target.value)}
                disabled={funding}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowFundDialog(false)}
                disabled={funding}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleFundWallet} disabled={funding}>
                {funding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {funding ? "Connecting..." : "Continue"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
