import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { StickyPurchaseButton } from "@/components/StickyPurchaseButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PinConfirmation } from "@/components/PinConfirmation";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/apiClient";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

interface CablePlan {
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

const providerColors: Record<string, string> = {
  dstv: "#003C9E",
  gotv: "#00A651",
  startimes: "#FF6B00",
};

const normalizeProvider = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

const CablePage = () => {
  const [plans, setPlans] = useState<CablePlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [smartCardNumber, setSmartCardNumber] = useState("");
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { hasPin, verifyPin } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    api
      .get<CablePlan[]>("/pricing?service_type=cable")
      .then((rows) => {
        if (!cancelled) setPlans(rows);
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setPlans([]);
          toast({
            title: "Unable to load cable plans",
            description: error.message,
            variant: "destructive",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPlans(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const providers = useMemo(
    () =>
      Array.from(new Set(plans.map((plan) => plan.provider))).map((name) => ({
        id: normalizeProvider(name),
        name,
        color: providerColors[normalizeProvider(name)] ?? "#5B5BD6",
      })),
    [plans],
  );

  const currentPlans = plans.filter(
    (plan) => normalizeProvider(plan.provider) === selectedProvider,
  );
  const chosenPlan = plans.find((plan) => plan.id === selectedPlan);

  const handleBuyClick = () => {
    if (!selectedPlan || !smartCardNumber.trim()) return;
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
    if (!selectedPlan || !smartCardNumber.trim()) return;
    setSubmitting(true);
    try {
      const result = await api.post<PurchaseResult>("/purchase", {
        plan_id: selectedPlan,
        recipient: smartCardNumber.trim(),
      });
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast({
        title:
          result.status === "pending"
            ? "Subscription Processing"
            : "Subscription Successful",
        description: result.message,
      });
      setSmartCardNumber("");
      setSelectedPlan(null);
      setSelectedProvider(null);
      navigate("/history");
    } catch (error: unknown) {
      toast({
        title: "Subscription Failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-40 md:pb-24">
      <div className="container max-w-lg mx-auto px-4">
        <PageHeader title="Cable TV" />

        <div className="space-y-6">
          <section className="animate-slide-up">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Select Provider
            </h2>
            {loadingPlans ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : providers.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No cable plans are currently available.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => {
                      setSelectedProvider(provider.id);
                      setSelectedPlan(null);
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                      selectedProvider === provider.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary/50 hover:bg-secondary"
                    }`}
                  >
                    <div
                      className="w-10 h-10 mx-auto rounded-full flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: provider.color }}
                    >
                      {provider.name.charAt(0)}
                    </div>
                    <p className="text-xs font-medium text-center mt-2">
                      {provider.name}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section
            className="animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Smart Card / IUC Number
            </h2>
            <input
              inputMode="numeric"
              placeholder="Enter smart card number"
              value={smartCardNumber}
              onChange={(event) =>
                setSmartCardNumber(event.target.value.replace(/\D/g, ""))
              }
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </section>

          {selectedProvider && (
            <section
              className="animate-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                Select Plan
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {currentPlans.map((plan) => (
                  <Card
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`p-4 cursor-pointer transition-all duration-200 ${
                      selectedPlan === plan.id
                        ? "border-primary bg-primary/10"
                        : "bg-secondary/50 hover:bg-secondary"
                    }`}
                  >
                    <p className="font-bold text-foreground">
                      {plan.plan_name}
                    </p>
                    <p className="text-primary font-semibold mt-1">
                      ₦{Number(plan.selling_price).toLocaleString()}
                    </p>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <StickyPurchaseButton
            variant="gradient"
            size="xl"
            className="w-full"
            disabled={
              !selectedProvider ||
              !selectedPlan ||
              !smartCardNumber.trim() ||
              submitting
            }
            onClick={handleBuyClick}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Subscribe"
            )}
          </StickyPurchaseButton>
        </div>
      </div>

      <PinConfirmation
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        onConfirm={handlePurchaseConfirm}
        verifyPin={verifyPin}
        title="Confirm Subscription"
        description={`Enter your PIN to subscribe ${smartCardNumber}${chosenPlan ? ` to ${chosenPlan.plan_name} for ₦${Number(chosenPlan.selling_price).toLocaleString()}` : ""}.`}
      />
      <BottomNav />
    </div>
  );
};

export default CablePage;
