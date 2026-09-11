import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useProfile,
  type NinSlipType,
  type NinSlipDownloadResult,
} from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/apiClient";
import { siteConfig } from "@/config/site";
import { FileDown, Loader2 } from "lucide-react";

interface PricingItem {
  plan_code: string | null;
  selling_price: number;
}

const NinSlipDownloadPage = () => {
  const { downloadNinSlip } = useProfile();
  const [nin, setNin] = useState("");
  const [slipType, setSlipType] = useState<NinSlipType>("improved");
  const [loading, setLoading] = useState(false);
  const [lastDownload, setLastDownload] =
    useState<NinSlipDownloadResult | null>(null);
  const [pricingByType, setPricingByType] = useState<
    Record<NinSlipType, number | null>
  >({
    regular: null,
    improved: null,
    premium: null,
  });
  const [feeLoading, setFeeLoading] = useState(true);

  useEffect(() => {
    api
      .get<PricingItem[]>("/pricing?service_type=nin_slip_download&provider=lumiid")
      .then((rows) => {
        const next: Record<NinSlipType, number | null> = {
          regular: null,
          improved: null,
          premium: null,
        };

        rows.forEach((row) => {
          const code = (row.plan_code || "").toLowerCase();
          if (code === "regular" || code === "improved" || code === "premium") {
            next[code] = row.selling_price;
          }
        });

        setPricingByType(next);
      })
      .catch(() => {
        setPricingByType({ regular: null, improved: null, premium: null });
      })
      .finally(() => setFeeLoading(false));
  }, []);

  const selectedFee = useMemo(() => pricingByType[slipType], [pricingByType, slipType]);

  const optionLabel = (type: NinSlipType) => {
    const price = pricingByType[type];
    if (price == null) return type.charAt(0).toUpperCase() + type.slice(1);
    return `${type.charAt(0).toUpperCase() + type.slice(1)} - ${siteConfig.currency.symbol}${price.toLocaleString()}`;
  };

  const savePdf = (payload: NinSlipDownloadResult) => {
    const binary = atob(payload.pdf_base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], {
      type: payload.content_type || "application/pdf",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      payload.filename || `nin_${payload.nin}_${payload.slip_type}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownload = async () => {
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
      const payload = await downloadNinSlip(clean, slipType);
      setLastDownload(payload);
      savePdf(payload);
      toast({
        title: "Slip downloaded",
        description: payload.auto_verified
          ? `${payload.slip_type} slip saved as ${payload.filename}. NIN was auto-verified first.`
          : `${payload.slip_type} slip saved as ${payload.filename}`,
      });
    } catch (err: unknown) {
      toast({
        title: "Download failed",
        description:
          (err as Error).message ||
          "Could not download slip. Verify NIN first and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container max-w-lg mx-auto px-4">
        <PageHeader title="NIN Slip Download" />

        <div className="space-y-5 animate-slide-up">
          <section className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Download NIN Slip
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Choose slip type and download an official PDF from LumiID.
              </p>
            </div>

            <div className="rounded-xl border border-border/50 bg-secondary/40 px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Selected Fee</span>
              <span className="text-sm font-semibold text-foreground">
                {feeLoading
                  ? "Loading..."
                  : selectedFee != null
                    ? `${siteConfig.currency.symbol}${selectedFee.toLocaleString()}`
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

            <div className="space-y-2">
              <Label htmlFor="slipType">Slip Type</Label>
              <select
                id="slipType"
                value={slipType}
                onChange={(e) => setSlipType(e.target.value as NinSlipType)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="regular">{optionLabel("regular")}</option>
                <option value="improved">{optionLabel("improved")}</option>
                <option value="premium">{optionLabel("premium")}</option>
              </select>
            </div>

            <Button
              onClick={handleDownload}
              disabled={loading || nin.length !== 11}
              variant="gradient"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Downloading...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 mr-2" />
                  Download Slip PDF
                  {selectedFee != null
                    ? ` - ${siteConfig.currency.symbol}${selectedFee.toLocaleString()}`
                    : ""}
                </>
              )}
            </Button>
          </section>

          {lastDownload && (
            <section className="rounded-2xl border border-border/50 bg-card p-5">
              <p className="text-sm font-semibold text-foreground">
                Last Download
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {lastDownload.filename} ({Math.round(lastDownload.bytes / 1024)}{" "}
                KB)
              </p>
            </section>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default NinSlipDownloadPage;
