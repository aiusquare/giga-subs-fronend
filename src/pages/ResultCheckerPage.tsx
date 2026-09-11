import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { StickyPurchaseButton } from "@/components/StickyPurchaseButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PinConfirmation } from "@/components/PinConfirmation";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/apiClient";
import { Loader2, GraduationCap, Copy, Check } from "lucide-react";
import { siteConfig } from "@/config/site";

interface ExamType {
  id: string;
  plan_name: string;
  plan_code: string;
  selling_price: number;
  provider: string;
}

interface ExamPin {
  pin: string;
  serial: string;
}

interface PurchaseResult {
  exam: string;
  quantity: number;
  pins: ExamPin[];
  message: string;
  new_balance: number;
}

const EXAM_COLORS: Record<string, string> = {
  WAEC: "var(--gradient-primary)",
  NECO: "var(--gradient-success)",
  NABTEB: "var(--gradient-warning)",
  NBAIS: "var(--gradient-purple)",
};

function examColor(name: string): string {
  for (const [key, val] of Object.entries(EXAM_COLORS)) {
    if (name.toUpperCase().includes(key)) return val;
  }
  return "var(--gradient-primary)";
}

const ResultCheckerPage = () => {
  const [exams, setExams] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showPin, setShowPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<PurchaseResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const { hasPin, verifyPin } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get<ExamType[]>("/result-checker/exams")
      .then(setExams)
      .catch(() => setExams([]))
      .finally(() => setLoading(false));
  }, []);

  const selected = exams.find((e) => e.id === selectedExam);
  const total = selected ? selected.selling_price * quantity : 0;

  const handleBuy = () => {
    if (!selected) return;
    if (!hasPin()) {
      toast({
        title: "PIN Required",
        description: "Please set up your transaction PIN first.",
        variant: "destructive",
      });
      navigate("/profile");
      return;
    }
    setShowPin(true);
  };

  const handleConfirm = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await api.post<PurchaseResult>("/result-checker", {
        plan_id: selected.id,
        quantity,
      });
      setResult(res);
      toast({ title: "Purchase Successful", description: res.message });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Purchase failed. Try again.";
      toast({
        title: "Purchase Failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  // ── Result screen ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <div className="container max-w-lg mx-auto px-4">
          <PageHeader title="Exam Pins" />
          <div className="space-y-4 animate-slide-up">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
                <GraduationCap className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                Pins Generated!
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {result.exam} × {result.quantity}
              </p>
            </div>

            {result.pins.map((pin, i) => (
              <Card key={i} className="p-4 bg-card border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-3">
                  Pin {i + 1} of {result.pins.length}
                </p>
                <div className="space-y-2">
                  {/* PIN */}
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-secondary/60 px-4 py-3">
                    <div>
                      <p className="text-xs text-muted-foreground">PIN</p>
                      <p className="font-mono font-bold text-foreground tracking-widest">
                        {pin.pin}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(pin.pin, `pin-${i}`)}
                      className="p-2 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary"
                      aria-label="Copy PIN"
                    >
                      {copied === `pin-${i}` ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {/* Serial */}
                  {pin.serial && (
                    <div className="flex items-center justify-between gap-2 rounded-xl bg-secondary/60 px-4 py-3">
                      <div>
                        <p className="text-xs text-muted-foreground">SERIAL</p>
                        <p className="font-mono text-sm text-foreground">
                          {pin.serial}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          copyToClipboard(pin.serial, `serial-${i}`)
                        }
                        className="p-2 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary"
                        aria-label="Copy Serial"
                      >
                        {copied === `serial-${i}` ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            ))}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/history")}
              >
                View History
              </Button>
              <Button
                variant="gradient"
                className="flex-1"
                onClick={() => {
                  setResult(null);
                  setSelectedExam(null);
                  setQuantity(1);
                }}
              >
                Buy Another
              </Button>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Purchase screen ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-40 md:pb-24">
      <div className="container max-w-lg mx-auto px-4">
        <PageHeader title="Exam Pins" />

        <div className="space-y-6">
          {/* Exam type selection */}
          <section className="animate-slide-up">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Select Exam Type
            </h2>

            {loading && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}

            {!loading && exams.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No exam types available at the moment.
              </p>
            )}

            {!loading && exams.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {exams.map((exam) => (
                  <button
                    key={exam.id}
                    onClick={() => {
                      setSelectedExam(exam.id);
                      setQuantity(1);
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                      selectedExam === exam.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary/50 hover:bg-secondary"
                    }`}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-primary-foreground font-bold text-lg mb-3"
                      style={{ background: examColor(exam.plan_name) }}
                    >
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-sm text-foreground leading-tight">
                      {exam.plan_name}
                    </p>
                    <p className="text-primary font-bold mt-1">
                      {siteConfig.currency.symbol}
                      {exam.selling_price.toLocaleString()}
                      <span className="text-xs text-muted-foreground font-normal">
                        /pin
                      </span>
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Quantity selector */}
          {selected && (
            <section className="animate-slide-up glass-card p-5">
              <h2 className="text-sm font-medium text-muted-foreground mb-4">
                Number of Pins
              </h2>
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-10 h-10 rounded-full border border-border bg-secondary flex items-center justify-center text-xl font-bold disabled:opacity-30 hover:bg-secondary/80 transition-colors"
                >
                  −
                </button>
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">
                    {quantity}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    pin{quantity > 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  disabled={quantity >= 10}
                  className="w-10 h-10 rounded-full border border-border bg-secondary flex items-center justify-center text-xl font-bold disabled:opacity-30 hover:bg-secondary/80 transition-colors"
                >
                  +
                </button>
              </div>
            </section>
          )}

          {/* Summary + Buy */}
          {selected && (
            <section className="animate-slide-up space-y-3">
              <Card className="p-4 bg-secondary/40 border-border/50">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Exam</span>
                    <span className="font-medium text-foreground">
                      {selected.plan_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="font-medium text-foreground">
                      {quantity} pin{quantity > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price per pin</span>
                    <span className="font-medium text-foreground">
                      {siteConfig.currency.symbol}
                      {selected.selling_price.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t border-border/50 pt-2 flex justify-between">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-primary text-base">
                      {siteConfig.currency.symbol}
                      {total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>

              <StickyPurchaseButton
                variant="gradient"
                className="w-full"
                size="lg"
                onClick={handleBuy}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <GraduationCap className="w-4 h-4 mr-2" />
                )}
                Buy {quantity} Pin{quantity > 1 ? "s" : ""} —{" "}
                {siteConfig.currency.symbol}
                {total.toLocaleString()}
              </StickyPurchaseButton>
            </section>
          )}
        </div>
      </div>

      <PinConfirmation
        open={showPin}
        onOpenChange={setShowPin}
        verifyPin={verifyPin}
        onConfirm={handleConfirm}
        title="Confirm Purchase"
        description={`Enter your PIN to buy ${quantity} ${selected?.plan_name ?? ""} pin${quantity > 1 ? "s" : ""} for ${siteConfig.currency.symbol}${total.toLocaleString()}`}
      />

      <BottomNav />
    </div>
  );
};

export default ResultCheckerPage;
