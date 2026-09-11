import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Fingerprint, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/apiClient";
import {
  useProfile,
  type BvnVerificationResult,
  type NinVerificationResult,
} from "@/hooks/useProfile";
import { siteConfig } from "@/config/site";
import { toast } from "sonner";

interface IdentityService {
  service_type: "nin_update" | "bvn_update";
  update_type: string;
  service_name: string;
  price: number;
  is_active: boolean;
}

type VerificationType = "nin_update" | "bvn_update";
type VerificationResult = BvnVerificationResult | NinVerificationResult;

interface PricingItem {
  selling_price: number;
}

interface VerifiedDetails {
  full_name: string;
  date_of_birth: string;
  phone: string;
  gender: string;
  address: string;
}

interface SelectedCorrection {
  update_type: string;
  field: keyof VerifiedDetails;
  change_to: string;
}

interface IdentityRequest {
  id: string;
  service_name: string;
  service_type: string;
  service_price: number;
  status: string;
  reference: string | null;
  admin_note: string | null;
  created_at: string;
}

const statusStyles: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  processing: "bg-primary/15 text-primary",
  approved: "bg-success/15 text-success",
  completed: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
};

const currency = (amount: number) =>
  `${siteConfig.currency.symbol}${amount.toLocaleString(siteConfig.currency.locale)}`;

const fieldLabels: Record<keyof VerifiedDetails, string> = {
  full_name: "Full name",
  date_of_birth: "Date of birth",
  phone: "Phone number",
  gender: "Gender",
  address: "Address",
};

function serviceField(serviceName: string): keyof VerifiedDetails | null {
  const name = serviceName.toLowerCase();
  if (name.includes("phone") || name.includes("mobile")) return "phone";
  if (name.includes("birth") || name.includes("dob")) return "date_of_birth";
  if (name.includes("gender")) return "gender";
  if (name.includes("address") || name.includes("residence")) return "address";
  if (name.includes("name") || name.includes("update")) return "full_name";
  return null;
}

function detailsFromVerification(
  type: VerificationType,
  result: VerificationResult,
): VerifiedDetails {
  if (type === "nin_update") {
    const nin = result as NinVerificationResult;
    return {
      full_name: [nin.firstname, nin.middlename, nin.lastname]
        .filter(Boolean)
        .join(" "),
      date_of_birth: nin.birthdate || "",
      phone: nin.phone || "",
      gender: nin.gender || "",
      address: [
        nin.residence?.address1,
        nin.residence?.town,
        nin.residence?.lga,
        nin.residence?.state,
      ]
        .filter(Boolean)
        .join(", "),
    };
  }

  const bvn = result as BvnVerificationResult;
  return {
    full_name: [bvn.firstname, bvn.lastname].filter(Boolean).join(" "),
    date_of_birth: bvn.birthdate || "",
    phone: bvn.phone || "",
    gender: "",
    address: "",
  };
}

export default function IdentityUpdatesPage() {
  const navigate = useNavigate();
  const { verifyNin, verifyBvn, refetch: refetchProfile } = useProfile();
  const [services, setServices] = useState<IdentityService[]>([]);
  const [requests, setRequests] = useState<IdentityRequest[]>([]);
  const [verificationType, setVerificationType] =
    useState<VerificationType>("nin_update");
  const [identifier, setIdentifier] = useState("");
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);
  const [verifiedDetails, setVerifiedDetails] =
    useState<VerifiedDetails | null>(null);
  const [selected, setSelected] = useState<Record<string, SelectedCorrection>>(
    {},
  );
  const [verificationFee, setVerificationFee] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const availableServices = services.filter(
    (service) => service.service_type === verificationType && service.is_active,
  );
  const selectedCorrections = Object.values(selected);
  const updateTotal = selectedCorrections.reduce((total, correction) => {
    const service = availableServices.find(
      (item) => item.update_type === correction.update_type,
    );
    return total + (service?.price ?? 0);
  }, 0);
  const verificationDisplay = useMemo(
    () =>
      verifiedDetails
        ? (Object.keys(fieldLabels) as Array<keyof VerifiedDetails>)
            .map((key) => ({ key, value: verifiedDetails[key] }))
            .filter((item) => item.value)
        : [],
    [verifiedDetails],
  );

  const loadData = async () => {
    try {
      const [serviceData, requestData] = await Promise.all([
        api.get<IdentityService[]>("/identity-updates/services"),
        api.get<IdentityRequest[]>("/identity-updates"),
      ]);
      setServices(serviceData);
      setRequests(requestData);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not load identity update services",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setVerificationResult(null);
    setVerifiedDetails(null);
    setSelected({});
    setIdentifier("");
    const verificationService =
      verificationType === "nin_update"
        ? "nin_verification"
        : "bvn_verification";
    api
      .get<PricingItem[]>(`/pricing?service_type=${verificationService}`)
      .then((rows) => setVerificationFee(rows[0]?.selling_price ?? null))
      .catch(() => setVerificationFee(null));
  }, [verificationType]);

  const handleVerify = async () => {
    const cleanIdentifier = identifier.replace(/\D/g, "");
    if (!/^\d{11}$/.test(cleanIdentifier)) {
      toast.error(
        `${verificationType === "nin_update" ? "NIN" : "BVN"} must be exactly 11 digits`,
      );
      return;
    }

    setVerifying(true);
    try {
      const result =
        verificationType === "nin_update"
          ? await verifyNin(cleanIdentifier)
          : await verifyBvn(cleanIdentifier);
      setVerificationResult(result);
      setVerifiedDetails(detailsFromVerification(verificationType, result));
      toast.success(
        "Identity verified. Select the details you want to correct.",
      );
    } catch (error) {
      setVerificationResult(null);
      setVerifiedDetails(null);
      toast.error(
        error instanceof Error ? error.message : "Verification failed",
      );
    } finally {
      setVerifying(false);
    }
  };

  const toggleCorrection = (service: IdentityService, checked: boolean) => {
    const field = serviceField(service.service_name);
    if (!field || !verifiedDetails) return;
    setSelected((current) => {
      const next = { ...current };
      if (checked) {
        next[service.update_type] = {
          update_type: service.update_type,
          field,
          change_to: "",
        };
      } else {
        delete next[service.update_type];
      }
      return next;
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!verificationResult || !verifiedDetails || !selectedCorrections.length)
      return;
    if (
      selectedCorrections.some((correction) => !correction.change_to.trim())
    ) {
      toast.error("Enter a new value for every selected correction");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/identity-updates", {
        service_type: verificationType,
        verification: {
          identifier: identifier.replace(/\D/g, ""),
          details: verifiedDetails,
        },
        updates: selectedCorrections,
      });
      toast.success(
        `Request submitted. Total charged: ${currency(updateTotal)}`,
      );
      setVerificationResult(null);
      setVerifiedDetails(null);
      setSelected({});
      setIdentifier("");
      await Promise.all([loadData(), refetchProfile()]);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not submit update request",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container max-w-lg mx-auto px-4">
        <PageHeader title="Identity Updates" />

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-5 animate-slide-up">
            <section className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-primary-foreground"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Fingerprint className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">
                    BVN and NIN Update Services
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Submit your information securely. An administrator will
                    review the request.
                  </p>
                </div>
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Verification type</Label>
                  <Select
                    value={verificationType}
                    onValueChange={(value: VerificationType) =>
                      setVerificationType(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nin_update">NIN</SelectItem>
                      <SelectItem value="bvn_update">BVN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="identity-number">
                    {verificationType === "nin_update"
                      ? "NIN number"
                      : "BVN number"}
                  </Label>
                  <Input
                    id="identity-number"
                    value={identifier}
                    inputMode="numeric"
                    maxLength={11}
                    placeholder={`Enter 11-digit ${verificationType === "nin_update" ? "NIN" : "BVN"}`}
                    onChange={(event) =>
                      setIdentifier(
                        event.target.value.replace(/\D/g, "").slice(0, 11),
                      )
                    }
                    disabled={!!verificationResult}
                  />
                </div>

                {!verificationResult ? (
                  <Button
                    type="button"
                    variant="gradient"
                    className="w-full"
                    onClick={handleVerify}
                    disabled={verifying || identifier.length !== 11}
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Verify{" "}
                        {verificationType === "nin_update" ? "NIN" : "BVN"}
                        {verificationFee != null
                          ? ` - ${currency(verificationFee)}`
                          : ""}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setVerificationResult(null);
                      setVerifiedDetails(null);
                      setSelected({});
                    }}
                  >
                    Verify another number
                  </Button>
                )}

                {verificationResult && verifiedDetails && (
                  <div className="space-y-4 border-t border-border/50 pt-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-success">
                      <CheckCircle2 className="h-4 w-4" /> Verified details
                    </div>
                    <div className="grid gap-2">
                      {verificationDisplay.map((item) => (
                        <div
                          key={item.key}
                          className="flex items-start justify-between gap-3 rounded-xl border border-border/50 bg-secondary/40 px-3 py-2 text-sm"
                        >
                          <span className="text-muted-foreground">
                            {fieldLabels[item.key]}
                          </span>
                          <span className="text-right font-medium text-foreground">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          What do you want to correct?
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Tick every item. Each selected item is charged at its
                          configured price.
                        </p>
                      </div>
                      {availableServices.map((service) => {
                        const field = serviceField(service.service_name);
                        const currentValue = field
                          ? verifiedDetails[field]
                          : "";
                        const correction = selected[service.update_type];
                        const canSelect = !!field && !!currentValue;
                        return (
                          <div
                            key={service.update_type}
                            className="rounded-xl border border-border/60 p-3"
                          >
                            <label
                              className={`flex items-start gap-3 ${canSelect ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
                            >
                              <Checkbox
                                checked={!!correction}
                                disabled={!canSelect}
                                onCheckedChange={(checked) =>
                                  toggleCorrection(service, checked === true)
                                }
                              />
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center justify-between gap-2 text-sm font-medium">
                                  <span>{service.service_name}</span>
                                  <span className="text-primary">
                                    {currency(service.price)}
                                  </span>
                                </span>
                                <span className="mt-1 block text-xs text-muted-foreground">
                                  Current:{" "}
                                  {currentValue || "Not returned by provider"}
                                </span>
                              </span>
                            </label>
                            {correction && (
                              <div className="mt-3 space-y-1 pl-7">
                                <Label
                                  htmlFor={`change-${service.update_type}`}
                                >
                                  New {fieldLabels[correction.field]}
                                </Label>
                                <Input
                                  id={`change-${service.update_type}`}
                                  type={
                                    correction.field === "date_of_birth"
                                      ? "date"
                                      : "text"
                                  }
                                  value={correction.change_to}
                                  placeholder={
                                    correction.field === "date_of_birth"
                                      ? undefined
                                      : `Enter new ${fieldLabels[correction.field].toLowerCase()}`
                                  }
                                  onChange={(event) =>
                                    setSelected((current) => ({
                                      ...current,
                                      [service.update_type]: {
                                        ...current[service.update_type],
                                        change_to: event.target.value,
                                      },
                                    }))
                                  }
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="rounded-xl bg-primary/10 p-3 text-sm">
                      <div className="flex items-center justify-between font-semibold">
                        <span>Correction total</span>
                        <span>{currency(updateTotal)}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Verification was charged separately. This total covers
                        only the selected corrections.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      variant="gradient"
                      className="w-full"
                      disabled={
                        submitting ||
                        selectedCorrections.length === 0 ||
                        selectedCorrections.some(
                          (item) => !item.change_to.trim(),
                        )
                      }
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Submit correction request
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </form>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  My Identity Update Requests
                </h2>
                <button
                  className="text-sm text-primary"
                  onClick={() => navigate("/history")}
                >
                  Wallet history
                </button>
              </div>
              {!requests.length ? (
                <div className="rounded-2xl border border-border/50 bg-card p-6 text-center text-sm text-muted-foreground">
                  No identity update requests yet.
                </div>
              ) : (
                requests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-border/50 bg-card p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">
                          {request.service_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        className={
                          statusStyles[request.status] ??
                          "bg-muted text-muted-foreground"
                        }
                      >
                        {request.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-semibold text-foreground">
                        {currency(request.service_price)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Reference</span>
                      <span className="font-mono text-foreground">
                        {request.reference ?? "Pending"}
                      </span>
                    </div>
                    {request.admin_note && (
                      <p className="rounded-lg bg-secondary/40 p-2 text-xs text-muted-foreground">
                        Admin note: {request.admin_note}
                      </p>
                    )}
                  </div>
                ))
              )}
            </section>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
