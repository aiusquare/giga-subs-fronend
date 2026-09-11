import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { StickyPurchaseButton } from "@/components/StickyPurchaseButton";
import { Button } from "@/components/ui/button";
import { PinConfirmation } from "@/components/PinConfirmation";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/apiClient";
import { Loader2, Zap } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

const discos = [
  { id: 1, code: "ekedc", name: "EKEDC", fullName: "Eko Electricity" },
  { id: 2, code: "ikedc", name: "IKEDC", fullName: "Ikeja Electric" },
  { id: 3, code: "aedc", name: "AEDC", fullName: "Abuja Electricity" },
  { id: 4, code: "phed", name: "PHED", fullName: "Port Harcourt" },
  { id: 5, code: "kedco", name: "KEDCO", fullName: "Kano Electricity" },
  { id: 6, code: "ibedc", name: "IBEDC", fullName: "Ibadan Electricity" },
  { id: 7, code: "eedc", name: "EEDC", fullName: "Enugu Electricity" },
  { id: 8, code: "bedc", name: "BEDC", fullName: "Benin Electricity" },
  { id: 9, code: "yedc", name: "YEDC", fullName: "Yola Electricity" },
  { id: 10, code: "jos", name: "JED", fullName: "Jos Electricity" },
  { id: 11, code: "kaduna", name: "KAEDCO", fullName: "Kaduna Electricity" },
];

const quickAmounts = [500, 1000, 2000, 5000, 10000, 20000];

interface PurchaseResult {
  status: "completed" | "pending" | "failed";
  reference: string;
  provider_ref: string | null;
  new_balance: number;
  message: string;
  token: string;
}

const ElectricityPage = () => {
  const [selectedDisco, setSelectedDisco] = useState<number | null>(null);
  const [meterNumber, setMeterNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [meterType, setMeterType] = useState<"prepaid" | "postpaid">("prepaid");
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { hasPin, verifyPin } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleBuyClick = () => {
    if (!selectedDisco) {
      toast({ title: "Select a disco", variant: "destructive" });
      return;
    }
    if (!meterNumber.trim()) {
      toast({ title: "Enter your meter number", variant: "destructive" });
      return;
    }
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum < 500) {
      toast({
        title: "Enter a valid amount (minimum ₦500)",
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
    if (!selectedDisco) return;
    setSubmitting(true);
    try {
      const result = await api.post<PurchaseResult>("/purchase/electricity", {
        disco: selectedDisco,
        meter_number: meterNumber.trim(),
        meter_type: meterType,
        amount: parseFloat(amount),
      });

      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });

      if (result.status === "completed") {
        const tokenMsg = result.token ? ` Token: ${result.token}` : "";
        toast({
          title: "Payment Successful!",
          description: result.message + tokenMsg,
        });
      } else if (result.status === "pending") {
        toast({ title: "Processing", description: result.message });
        navigate("/history");
      }

      setSelectedDisco(null);
      setMeterNumber("");
      setAmount("");
    } catch (err: unknown) {
      toast({
        title: "Payment Failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const disco = discos.find((d) => d.id === selectedDisco);

  return (
    <div className="min-h-screen bg-background pb-40 md:pb-24">
      <div className="container max-w-lg mx-auto px-4">
        <PageHeader title="Pay Electricity" />

        <div className="space-y-6">
          {/* Meter Type */}
          <section className="animate-slide-up">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Meter Type
            </h2>
            <div className="flex gap-3">
              {(["prepaid", "postpaid"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setMeterType(type)}
                  className={`flex-1 py-3 rounded-xl font-medium capitalize transition-all duration-200 ${
                    meterType === type
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-foreground hover:bg-secondary"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </section>

          {/* Provider Selection */}
          <section
            className="animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Select Provider
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {discos.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDisco(d.id)}
                  className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                    selectedDisco === d.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/50 hover:bg-secondary"
                  }`}
                >
                  <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-medium text-center mt-2">
                    {d.name}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* Meter Number */}
          <section
            className="animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Meter Number
            </h2>
            <input
              type="text"
              placeholder="Enter meter number"
              value={meterNumber}
              onChange={(e) => setMeterNumber(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </section>

          {/* Amount */}
          <section
            className="animate-slide-up"
            style={{ animationDelay: "0.3s" }}
          >
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Amount
            </h2>
            <input
              type="number"
              placeholder="Enter amount (Min: ₦500)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-3"
            />
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((a) => (
                <button
                  key={a}
                  onClick={() => setAmount(a.toString())}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    amount === a.toString()
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-foreground hover:bg-secondary"
                  }`}
                >
                  ₦{a.toLocaleString()}
                </button>
              ))}
            </div>
          </section>

          {/* Purchase Button */}
          <StickyPurchaseButton
            variant="gradient"
            size="xl"
            className="w-full"
            disabled={!selectedDisco || !amount || !meterNumber || submitting}
            onClick={handleBuyClick}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...
              </>
            ) : (
              "Pay Bill"
            )}
          </StickyPurchaseButton>
        </div>
      </div>

      <PinConfirmation
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        onConfirm={handlePurchaseConfirm}
        verifyPin={verifyPin}
        title="Confirm Payment"
        description={`Enter your PIN to pay ₦${Number(amount).toLocaleString()} electricity bill for meter ${meterNumber}${disco ? ` (${disco.fullName})` : ""}`}
      />

      <BottomNav />
    </div>
  );
};

export default ElectricityPage;
