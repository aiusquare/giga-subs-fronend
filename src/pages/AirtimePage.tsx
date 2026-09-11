import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { StickyPurchaseButton } from "@/components/StickyPurchaseButton";
import { Button } from "@/components/ui/button";
import { PinConfirmation } from "@/components/PinConfirmation";
import { PhoneInput } from "@/components/PhoneInput";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/apiClient";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface PricingItem {
  id: string;
  provider: string;
  plan_name: string;
  plan_code: string | null;
  selling_price: number;
}

interface PurchaseResult {
  status: "completed" | "pending" | "failed";
  reference: string;
  provider_ref: string | null;
  new_balance: number;
  message: string;
}

const networks = [
  { id: "mtn", name: "MTN", color: "#FFCC00" },
  { id: "airtel", name: "Airtel", color: "#FF0000" },
  { id: "glo", name: "Glo", color: "#00A651" },
  { id: "9mobile", name: "9mobile", color: "#006B53" },
];

const networkCodes: Record<string, number> = {
  mtn: 1,
  glo: 2,
  "9mobile": 3,
  airtel: 4,
};

// Fallback denominations shown when no pricing is configured for a network
const fallbackAmounts = [100, 200, 500, 1000, 2000, 5000];

const NetworkLogo = ({ id, color }: { id: string; color: string }) => {
  if (id === "mtn")
    return (
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="50" fill={color} />
        <text
          x="50"
          y="62"
          textAnchor="middle"
          fontFamily="Arial Black, Arial"
          fontWeight="900"
          fontSize="30"
          fill="#000"
        >
          MTN
        </text>
      </svg>
    );
  if (id === "airtel")
    return (
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="50" fill={color} />
        <text
          x="50"
          y="58"
          textAnchor="middle"
          fontFamily="Arial Black, Arial"
          fontWeight="900"
          fontSize="22"
          fill="#fff"
        >
          airtel
        </text>
      </svg>
    );
  if (id === "glo")
    return (
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="50" fill={color} />
        <text
          x="50"
          y="62"
          textAnchor="middle"
          fontFamily="Arial Black, Arial"
          fontWeight="900"
          fontSize="36"
          fill="#fff"
        >
          glo
        </text>
      </svg>
    );
  if (id === "9mobile")
    return (
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="50" fill={color} />
        <text
          x="50"
          y="45"
          textAnchor="middle"
          fontFamily="Arial Black, Arial"
          fontWeight="900"
          fontSize="38"
          fill="#fff"
        >
          9
        </text>
        <text
          x="50"
          y="68"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontWeight="700"
          fontSize="18"
          fill="#8fd6c0"
        >
          mobile
        </text>
      </svg>
    );
  return null;
};

const AirtimePage = () => {
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isPortedNumber, setIsPortedNumber] = useState(false);
  const [amount, setAmount] = useState("");
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [plans, setPlans] = useState<PricingItem[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  const { hasPin, verifyPin } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!selectedNetwork) {
      setPlans([]);
      return;
    }

    let cancelled = false;
    setLoadingPlans(true);
    setAmount("");

    api
      .get<PricingItem[]>(
        `/pricing?service_type=airtime&provider=${selectedNetwork}`,
      )
      .then((data) => {
        if (!cancelled) setPlans(data);
      })
      .catch(() => {
        if (!cancelled) setPlans([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingPlans(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedNetwork]);

  const handleBuyClick = () => {
    if (!selectedNetwork) {
      toast({ title: "Select a network", variant: "destructive" });
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.trim().length < 10) {
      toast({ title: "Enter a valid phone number", variant: "destructive" });
      return;
    }
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum < 50) {
      toast({
        title: "Enter a valid amount (minimum ₦50)",
        variant: "destructive",
      });
      return;
    }
    if (!hasPin()) {
      toast({
        title: "PIN Required",
        description: "Please set up your transaction PIN first.",
        variant: "destructive",
      });
      navigate("/profile");
      return;
    }
    setShowPinDialog(true);
  };

  const handlePurchaseConfirm = async () => {
    if (!selectedNetwork) return;
    setSubmitting(true);
    try {
      const result = await api.post<PurchaseResult>("/purchase/airtime", {
        recipient: phoneNumber.trim(),
        network: networkCodes[selectedNetwork] ?? 1,
        amount: parseFloat(amount),
        ported: isPortedNumber,
      });

      // Invalidate profile so balance refreshes
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });

      if (result.status === "completed") {
        toast({ title: "Airtime Sent!", description: result.message });
      } else if (result.status === "pending") {
        toast({ title: "Processing", description: result.message });
      }

      setSelectedNetwork(null);
      setPhoneNumber("");
      setIsPortedNumber(false);
      setAmount("");
    } catch (err: unknown) {
      toast({
        title: "Purchase Failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Build quick-select buttons from live plans or fallback amounts
  const quickButtons =
    plans.length > 0
      ? plans.map((p) => ({
          label: `₦${p.selling_price.toLocaleString()}`,
          value: p.selling_price.toString(),
        }))
      : fallbackAmounts.map((a) => ({
          label: `₦${a.toLocaleString()}`,
          value: a.toString(),
        }));

  return (
    <div className="min-h-screen bg-background pb-40 md:pb-24">
      <div className="container max-w-lg mx-auto px-4">
        <PageHeader title="Buy Airtime" />

        <div className="space-y-6">
          {/* Network Selection */}
          <section className="animate-slide-up">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Select Network
            </h2>
            <div className="grid grid-cols-4 gap-3">
              {networks.map((network) => (
                <button
                  key={network.id}
                  onClick={() => setSelectedNetwork(network.id)}
                  className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                    selectedNetwork === network.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/50 hover:bg-secondary"
                  }`}
                >
                  <div className="w-10 h-10 mx-auto rounded-full overflow-hidden">
                    <NetworkLogo id={network.id} color={network.color} />
                  </div>
                  <p className="text-xs font-medium text-center mt-2">
                    {network.name}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* Phone Number */}
          <section
            className="animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Phone Number
            </h2>
            <PhoneInput
              value={phoneNumber}
              onChange={setPhoneNumber}
              placeholder="Enter phone number"
            />
            {/* Ported number toggle */}
            <button
              type="button"
              onClick={() => setIsPortedNumber((v) => !v)}
              className="mt-3 flex items-center gap-3 w-full"
            >
              <div
                className={`w-11 h-6 rounded-full transition-colors shrink-0 ${
                  isPortedNumber ? "bg-primary" : "bg-muted"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white mt-1 transition-transform ${
                    isPortedNumber ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground leading-none">
                  Ported Number
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enable if this number was ported from another network
                </p>
              </div>
            </button>
          </section>

          {/* Amount */}
          <section
            className="animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Amount
            </h2>
            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-3"
            />

            {loadingPlans ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading denominations...
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {quickButtons.map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() => setAmount(btn.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      amount === btn.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/50 text-foreground hover:bg-secondary"
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Purchase Button */}
          <StickyPurchaseButton
            variant="gradient"
            size="xl"
            className="w-full"
            disabled={!selectedNetwork || !amount || !phoneNumber || submitting}
            onClick={handleBuyClick}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...
              </>
            ) : (
              "Buy Airtime"
            )}
          </StickyPurchaseButton>
        </div>
      </div>

      <PinConfirmation
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        onConfirm={handlePurchaseConfirm}
        verifyPin={verifyPin}
        title="Confirm Purchase"
        description={`Enter your PIN to buy ₦${Number(amount).toLocaleString()} airtime for ${phoneNumber}`}
      />

      <BottomNav />
    </div>
  );
};

export default AirtimePage;
