import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { StickyPurchaseButton } from "@/components/StickyPurchaseButton";
import { Card } from "@/components/ui/card";
import { PinConfirmation } from "@/components/PinConfirmation";
import { PhoneInput } from "@/components/PhoneInput";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/apiClient";
import { Loader2 } from "lucide-react";

interface PricingItem {
  id: string;
  provider: string;
  plan_name: string;
  plan_code: string | null;
  plan_category: string;
  selling_price: number;
}

const networks = [
  { id: "mtn", name: "MTN", color: "#FFCC00" },
  { id: "airtel", name: "Airtel", color: "#FF0000" },
  { id: "glo", name: "Glo", color: "#00A651" },
  { id: "9mobile", name: "9mobile", color: "#006B53" },
];

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

const networkCodes: Record<string, number> = {
  mtn: 1,
  glo: 2,
  "9mobile": 3,
  airtel: 4,
};

const DataPage = () => {
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>("mtn");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isPortedNumber, setIsPortedNumber] = useState(false);
  const [plans, setPlans] = useState<PricingItem[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { hasPin, verifyPin } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!selectedNetwork) {
      setPlans([]);
      setSelectedPlan(null);
      return;
    }

    let cancelled = false;
    setLoadingPlans(true);
    setSelectedPlan(null);
    setSelectedCategory("ALL");

    api
      .get<PricingItem[]>(
        `/pricing?service_type=data&provider=${selectedNetwork}`,
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
    if (!selectedPlan || !phoneNumber || !selectedNetwork) return;

    setSubmitting(true);
    try {
      const result = await api.post<{
        status: string;
        message: string;
        new_balance: number;
      }>("/purchase", {
        plan_id: selectedPlan,
        recipient: phoneNumber,
        network: networkCodes[selectedNetwork] ?? 1,
        ported: isPortedNumber,
      });

      const plan = plans.find((p) => p.id === selectedPlan);

      if (result.status === "pending") {
        toast({
          title: "Transaction Pending",
          description:
            result.message ||
            `Your ${plan?.plan_name ?? "data"} purchase is being processed.`,
        });
        navigate("/history");
      } else {
        toast({
          title: "Purchase Successful",
          description:
            result.message ??
            `${plan?.plan_name ?? "Data"} sent to ${phoneNumber}`,
        });
        // Reset form
        setSelectedNetwork(null);
        setSelectedPlan(null);
        setPhoneNumber("");
        setIsPortedNumber(false);
        navigate("/history");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Purchase failed. Try again.";
      toast({
        title: "Purchase Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-40 md:pb-24">
      <div className="container max-w-lg mx-auto px-4">
        <PageHeader title="Buy Data" />

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

          {/* Data Plans */}
          <section
            className="animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Select Plan
            </h2>

            {!selectedNetwork && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Select a network to see available plans
              </p>
            )}

            {selectedNetwork && loadingPlans && (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}

            {selectedNetwork && !loadingPlans && plans.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No plans available for this network
              </p>
            )}

            {!loadingPlans &&
              plans.length > 0 &&
              (() => {
                // Build unique category list preserving order: ALL first, then found categories
                const categoryOrder = [
                  "NORMAL",
                  "SME",
                  "GIFTING",
                  "CORPORATE",
                  "CORPORATE2",
                ];
                const presentCats = categoryOrder.filter((c) =>
                  plans.some((p) => (p.plan_category || "NORMAL") === c),
                );
                const tabs =
                  presentCats.length > 1 ? ["ALL", ...presentCats] : [];
                const visiblePlans =
                  selectedCategory === "ALL"
                    ? plans
                    : plans.filter(
                        (p) =>
                          (p.plan_category || "NORMAL") === selectedCategory,
                      );
                return (
                  <>
                    {tabs.length > 0 && (
                      <div className="flex gap-2 flex-wrap mb-3">
                        {tabs.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => {
                              setSelectedCategory(cat);
                              setSelectedPlan(null);
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                              selectedCategory === cat
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary/70 text-muted-foreground hover:bg-secondary"
                            }`}
                          >
                            {cat === "ALL"
                              ? "All"
                              : cat.charAt(0) + cat.slice(1).toLowerCase()}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {visiblePlans.map((plan) => (
                        <Card
                          key={plan.id}
                          onClick={() => setSelectedPlan(plan.id)}
                          className={`p-4 cursor-pointer transition-all duration-200 ${
                            selectedPlan === plan.id
                              ? "border-primary bg-primary/10"
                              : "bg-secondary/50 hover:bg-secondary"
                          }`}
                        >
                          <p className="text-lg font-bold text-foreground">
                            {plan.plan_name}
                          </p>
                          {plan.plan_category && (
                            <p className="text-xs text-muted-foreground">
                              {plan.plan_category}
                            </p>
                          )}
                          <p className="text-primary font-semibold mt-2">
                            ₦{plan.selling_price.toLocaleString()}
                          </p>
                        </Card>
                      ))}
                    </div>
                  </>
                );
              })()}
          </section>

          {/* Purchase Button */}
          <StickyPurchaseButton
            variant="gradient"
            size="xl"
            className="w-full"
            disabled={
              !selectedNetwork || !selectedPlan || !phoneNumber || submitting
            }
            onClick={handleBuyClick}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Buy Data"
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
        description={`Enter your PIN to buy data for ${phoneNumber}`}
      />

      <BottomNav />
    </div>
  );
};

export default DataPage;
