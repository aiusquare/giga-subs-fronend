import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile, type NinVerificationResult } from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/apiClient";
import { siteConfig } from "@/config/site";
import { jsPDF } from "jspdf";
import {
  IdCard,
  Loader2,
  ShieldCheck,
  UserCircle2,
  Phone,
  Download,
} from "lucide-react";

interface PricingItem {
  provider: string;
  plan_code: string | null;
  selling_price: number;
}

const NinVerificationPage = () => {
  const { verifyNin } = useProfile();
  const [nin, setNin] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NinVerificationResult | null>(null);
  const [serviceFee, setServiceFee] = useState<number | null>(null);
  const [feeLoading, setFeeLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const photoSrc = useMemo(() => normalizeImageSrc(result?.photo), [result]);

  useEffect(() => {
    api
      .get<PricingItem[]>("/pricing?service_type=nin_verification")
      .then((rows) => {
        const basic =
          rows.find(
            (row) =>
              row.provider.toUpperCase() === "INTERSWITCH" &&
              (row.plan_code || "").toUpperCase() === "BASIC",
          ) ||
          rows.find(
            (row) => (row.plan_code || "").toUpperCase() === "BASIC",
          );
        setServiceFee((basic || rows[0])?.selling_price ?? null);
      })
      .catch(() => setServiceFee(null))
      .finally(() => setFeeLoading(false));
  }, []);

  const handleVerify = async () => {
    const clean = nin.replace(/\D/g, "");
    if (!/^\d{11}$/.test(clean)) {
      toast({
        title: "Invalid NIN",
        description: "NIN must be exactly 11 digits.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const data = await verifyNin(clean);
      setResult(data);
      toast({
        title: "NIN verified",
        description: "Verification completed successfully.",
      });
    } catch (err: unknown) {
      setResult(null);
      toast({
        title: "Verification failed",
        description:
          (err as Error).message || "Could not verify NIN right now.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!result) return;

    setDownloadingPdf(true);

    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      let currentY = 16;

      doc.setFontSize(18);
      doc.text("NIN Verification Result", 14, currentY);
      currentY += 8;

      doc.setFontSize(10);
      doc.setTextColor(90, 90, 90);
      doc.text(`Generated on ${new Date().toLocaleString()}`, 14, currentY);
      currentY += 8;

      const imageDataUrl = photoSrc ? await imageSourceToDataUrl(photoSrc) : null;
      if (imageDataUrl) {
        doc.addImage(imageDataUrl, "JPEG", 14, currentY, 36, 36);
      }

      const detailsX = imageDataUrl ? 56 : 14;
      currentY += 2;

      const rows: Array<[string, string]> = [
        ["NIN", result.nin || "-"],
        ["First Name", result.firstname || "-"],
        ["Last Name", result.lastname || "-"],
        ["Middle Name", result.middlename || "-"],
        ["Date of Birth", result.birthdate || "-"],
        ["Gender", result.gender || "-"],
        ["Phone", result.phone || "-"],
        [
          "Address",
          [
            result.residence.address1,
            result.residence.town,
            result.residence.lga,
            result.residence.state,
          ]
            .filter(Boolean)
            .join(", ") || "-",
        ],
      ];

      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      rows.forEach(([label, value], index) => {
        const y = currentY + index * 8;
        doc.text(`${label}:`, detailsX, y);
        doc.text(value, detailsX + 38, y);
      });

      doc.save(`nin-verification-${result.nin}.pdf`);
    } catch (error) {
      toast({
        title: "PDF download failed",
        description: error instanceof Error ? error.message : "Could not generate NIN PDF right now.",
        variant: "destructive",
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container max-w-lg mx-auto px-4">
        <PageHeader title="NIN Verification" />

        <div className="space-y-5 animate-slide-up">
          <section className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Verify NIN
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Enter an 11-digit NIN to verify identity details with the active identity provider.
              </p>
            </div>

            <div className="rounded-xl border border-border/50 bg-secondary/40 px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Service Fee</span>
              <span className="text-sm font-semibold text-foreground">
                {feeLoading
                  ? "Loading..."
                  : serviceFee != null
                    ? `${siteConfig.currency.symbol}${serviceFee.toLocaleString()}`
                    : "Not configured"}
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nin">NIN Number</Label>
              <Input
                id="nin"
                value={nin}
                inputMode="numeric"
                maxLength={11}
                placeholder="Enter 11-digit NIN"
                onChange={(e) =>
                  setNin(e.target.value.replace(/\D/g, "").slice(0, 11))
                }
              />
            </div>

            <Button
              onClick={handleVerify}
              disabled={loading || nin.length !== 11}
              variant="gradient"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <IdCard className="w-4 h-4 mr-2" />
                  Verify NIN
                  {serviceFee != null
                    ? ` - ${siteConfig.currency.symbol}${serviceFee.toLocaleString()}`
                    : ""}
                </>
              )}
            </Button>
          </section>

          {result && (
            <section className="rounded-2xl border border-border/50 bg-card p-5 space-y-3">
              <div className="flex items-center gap-2 text-success">
                <ShieldCheck className="w-4 h-4" />
                <p className="text-sm font-semibold">Verification Result</p>
              </div>

              {photoSrc && (
                <div className="rounded-2xl overflow-hidden border border-border/50 bg-secondary/30 p-3">
                  <img
                    src={photoSrc}
                    alt="NIN verification portrait"
                    className="mx-auto h-40 w-40 rounded-2xl object-cover border border-border/50 bg-background"
                  />
                </div>
              )}

              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2 border border-border/50">
                  <span className="text-muted-foreground">NIN</span>
                  <span className="font-medium text-foreground">
                    {result.nin}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2 border border-border/50">
                  <span className="text-muted-foreground">First Name</span>
                  <span className="font-medium text-foreground">
                    {result.firstname || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2 border border-border/50">
                  <span className="text-muted-foreground">Last Name</span>
                  <span className="font-medium text-foreground">
                    {result.lastname || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2 border border-border/50">
                  <span className="text-muted-foreground">Middle Name</span>
                  <span className="font-medium text-foreground">
                    {result.middlename || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2 border border-border/50">
                  <span className="text-muted-foreground">Date of Birth</span>
                  <span className="font-medium text-foreground">
                    {result.birthdate || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2 border border-border/50">
                  <span className="text-muted-foreground">Gender</span>
                  <span className="font-medium text-foreground">
                    {result.gender || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2 border border-border/50">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium text-foreground">
                    {result.phone || "-"}
                  </span>
                </div>
                <div className="rounded-xl bg-secondary/50 px-3 py-2 border border-border/50">
                  <p className="text-muted-foreground mb-1">Address</p>
                  <p className="font-medium text-foreground text-xs">
                    {[
                      result.residence.address1,
                      result.residence.town,
                      result.residence.lga,
                      result.residence.state,
                    ]
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
              >
                {downloadingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Preparing PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF Copy
                  </>
                )}
              </Button>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <UserCircle2 className="w-3.5 h-3.5" />
                Verified details are returned by the active identity provider.
                <Phone className="w-3.5 h-3.5 ml-1" />
              </div>
            </section>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default NinVerificationPage;

function normalizeImageSrc(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (trimmed === "") return null;

  if (trimmed.startsWith("data:image/")) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  return `data:image/jpeg;base64,${trimmed}`;
}

async function imageSourceToDataUrl(src: string): Promise<string | null> {
  if (src.startsWith("data:image/")) {
    return src;
  }

  const response = await fetch(src);
  if (!response.ok) {
    return null;
  }

  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => reject(new Error("Could not read verification image."));
    reader.readAsDataURL(blob);
  });
}
