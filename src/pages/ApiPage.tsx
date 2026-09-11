import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Key, Copy, RefreshCw, Eye, EyeOff, Zap, Shield, TrendingUp, BookOpen, Database, Wifi, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { useApiSubscription } from "@/hooks/useApiSubscription";
import { useProfile } from "@/hooks/useProfile";
import { api } from "@/lib/apiClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PricingPlan {
  id: string;
  service_type: string;
  provider: string;
  plan_name: string;
  plan_code: string;
  plan_category: string;
  selling_price: number;
}

const NETWORK_CODES: Record<string, number> = {
  mtn: 1, glo: 2, "9mobile": 3, etisalat: 3, airtel: 4,
};

function networkCode(provider: string): number | null {
  return NETWORK_CODES[provider.toLowerCase()] ?? null;
}

const ApiPage = () => {
  const { subscription, tiers, currentTier, loading, subscribe, regenerateKey, toggleActive } = useApiSubscription();
  const { profile } = useProfile();
  const [showKey, setShowKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataPlans, setDataPlans] = useState<PricingPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [expandedNetwork, setExpandedNetwork] = useState<string | null>(null);

  useEffect(() => {
    if (!subscription) return;
    setPlansLoading(true);
    api.get<PricingPlan[]>('/pricing?service_type=data')
      .then(setDataPlans)
      .catch(() => {})
      .finally(() => setPlansLoading(false));
  }, [subscription]);

  // Group data plans by provider/network
  const plansByNetwork = dataPlans.reduce<Record<string, PricingPlan[]>>((acc, p) => {
    const key = p.provider || 'OTHER';
    (acc[key] = acc[key] ?? []).push(p);
    return acc;
  }, {});
  const networks = Object.keys(plansByNetwork).sort();

  const handleSubscribe = async () => {
    try {
      setIsSubmitting(true);
      await subscribe();
      toast.success("API access activated! Your API key has been generated.");
    } catch (err: any) {
      toast.error(err.message || "Failed to activate API access");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      setIsSubmitting(true);
      await regenerateKey();
      toast.success("API key regenerated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to regenerate key");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyKey = () => {
    if (subscription?.api_key) {
      navigator.clipboard.writeText(subscription.api_key);
      toast.success("API key copied to clipboard");
    }
  };

  const handleToggleActive = async (checked: boolean) => {
    try {
      await toggleActive(checked);
      toast.success(checked ? "API access enabled" : "API access disabled");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const maskedKey = subscription?.api_key
    ? subscription.api_key.substring(0, 6) + "•".repeat(20) + subscription.api_key.slice(-4)
    : "";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="API Access" />

      <div className="px-4 space-y-4 max-w-2xl mx-auto">
        {!subscription ? (
          <>
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Key className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>Become an API Reseller</CardTitle>
                <CardDescription>
                  Get API access to sell airtime, data, and more at discounted rates.
                  Your discount tier is automatically determined by your wallet balance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Instant Access</p>
                      <p className="text-xs text-muted-foreground">Get your API key immediately</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Tiered Discounts</p>
                      <p className="text-xs text-muted-foreground">Higher balance = bigger discounts</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Secure & Reliable</p>
                      <p className="text-xs text-muted-foreground">Token-based authentication</p>
                    </div>
                  </div>
                </div>
                <Button onClick={handleSubscribe} disabled={isSubmitting} className="w-full">
                  {isSubmitting ? "Activating..." : "Activate API Access"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  API Documentation
                </CardTitle>
                <CardDescription>
                  Browse full integration docs before activating API access.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/api/docs">Open full docs</Link>
                </Button>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* API Key Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Your API Key</CardTitle>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="api-active" className="text-sm">
                      {subscription.is_active ? "Active" : "Inactive"}
                    </Label>
                    <Switch
                      id="api-active"
                      checked={subscription.is_active}
                      onCheckedChange={handleToggleActive}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
                  <span className="flex-1 truncate">
                    {showKey ? subscription.api_key : maskedKey}
                  </span>
                  <button onClick={() => setShowKey(!showKey)} className="text-muted-foreground hover:text-foreground">
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={handleCopyKey} className="text-muted-foreground hover:text-foreground">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2" disabled={isSubmitting}>
                      <RefreshCw className="w-3 h-3" />
                      Regenerate Key
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Regenerate API Key?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will invalidate your current key. All existing integrations will stop working until updated.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRegenerate}>Regenerate</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>

            {/* Current Tier */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Your Discount Tier</CardTitle>
                <CardDescription>
                  Based on your wallet balance of ₦{(profile?.wallet_balance ?? 0).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentTier ? (
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div>
                      <p className="font-semibold text-foreground">{currentTier.tier_name}</p>
                      <p className="text-xs text-muted-foreground">Min balance: ₦{currentTier.min_balance.toLocaleString()}</p>
                    </div>
                    <Badge variant="default">{currentTier.discount_percent}% off</Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No tier matched. Fund your wallet to unlock discounts.</p>
                )}
              </CardContent>
            </Card>

            {/* All Tiers */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Pricing Tiers</CardTitle>
                <CardDescription>Fund your wallet to unlock higher discounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tiers.map((tier) => {
                    const isCurrentTier = currentTier?.id === tier.id;
                    return (
                      <div
                        key={tier.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isCurrentTier ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <div>
                          <p className={`text-sm font-medium ${isCurrentTier ? "text-primary" : "text-foreground"}`}>
                            {tier.tier_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ₦{tier.min_balance.toLocaleString()} min balance
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={isCurrentTier ? "default" : "secondary"}>
                            {tier.discount_percent}% off
                          </Badge>
                          {isCurrentTier && (
                            <Badge variant="outline" className="text-xs">Current</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Pricelist — Data Plans */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Data Plans Pricelist
                </CardTitle>
                <CardDescription>
                  Use the <code className="text-xs bg-muted px-1 rounded">plan_code</code> as
                  the <code className="text-xs bg-muted px-1 rounded">plan</code> parameter when
                  calling <code className="text-xs bg-muted px-1 rounded">POST /api/v1/gateway/data</code>.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {plansLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : networks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active data plans found.</p>
                ) : (
                  <div className="space-y-2">
                    {networks.map((net) => {
                      const plans = plansByNetwork[net];
                      const code = networkCode(net);
                      const isOpen = expandedNetwork === net;
                      return (
                        <div key={net} className="border rounded-lg overflow-hidden">
                          <button
                            className="w-full flex items-center justify-between px-3 py-2 bg-muted/50 hover:bg-muted text-sm font-medium"
                            onClick={() => setExpandedNetwork(isOpen ? null : net)}
                          >
                            <span className="flex items-center gap-2">
                              <Wifi className="w-3.5 h-3.5" />
                              {net.toUpperCase()}
                              {code !== null && (
                                <Badge variant="outline" className="text-xs font-mono">
                                  network: {code}
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                {plans.length} plan{plans.length !== 1 ? 's' : ''}
                              </Badge>
                            </span>
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          {isOpen && (
                            <div className="divide-y">
                              {plans.map((plan) => (
                                <div key={plan.id} className="flex items-center justify-between px-3 py-2 text-xs">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{plan.plan_name}</p>
                                    <p className="text-muted-foreground">{plan.plan_category}</p>
                                  </div>
                                  <div className="flex items-center gap-2 ml-3 shrink-0">
                                    <code
                                      className="bg-muted px-1.5 py-0.5 rounded font-mono cursor-pointer hover:bg-primary/10"
                                      title="Click to copy plan_code"
                                      onClick={() => {
                                        navigator.clipboard.writeText(plan.plan_code);
                                        toast.success(`Copied: ${plan.plan_code}`);
                                      }}
                                    >
                                      {plan.plan_code}
                                    </code>
                                    <span className="font-semibold text-foreground">
                                      ₦{plan.selling_price.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricelist — Airtime */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  Airtime Purchase
                </CardTitle>
                <CardDescription>
                  Send any amount (₦50 – ₦50,000) to any Nigerian network via
                  <code className="text-xs bg-muted px-1 mx-1 rounded">POST /api/v1/gateway/airtime</code>.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs">
                  {([
                    { name: 'MTN',     code: 1 },
                    { name: 'Glo',     code: 2 },
                    { name: '9mobile', code: 3 },
                    { name: 'Airtel',  code: 4 },
                  ] as { name: string; code: number }[]).map(({ name, code }) => (
                    <div key={name} className="flex items-center justify-between p-2 border rounded-lg">
                      <span className="font-medium flex items-center gap-2">
                        <Wifi className="w-3 h-3" />{name}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">network: "{name}"</Badge>
                        <Badge variant="secondary" className="font-mono">or {code}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Pass <code className="bg-muted px-1 rounded">network</code> as a name string
                  (<code className="bg-muted px-1 rounded">"MTN"</code>) or its integer code
                  (<code className="bg-muted px-1 rounded">1</code>).
                </p>
              </CardContent>
            </Card>

            {/* API Documentation */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    API Documentation
                  </CardTitle>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/api/docs">Open full docs</Link>
                  </Button>
                </div>
                <CardDescription>Quick reference for integrating with the API</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Base URL</p>
                  <code className="block p-2 bg-muted rounded text-xs break-all">
                    {`${import.meta.env.VITE_API_BASE_URL ?? ''}/gateway`}
                  </code>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Authentication</p>
                  <code className="block p-2 bg-muted rounded text-xs">
                    x-api-key: your_api_key
                  </code>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Available Actions</p>
                  <div className="space-y-2 text-xs">
                    <div className="p-2 bg-muted rounded">
                      <p className="font-semibold text-foreground">VTU Services - Check Balance</p>
                      <code className="text-muted-foreground">{`{ "service_type": "data", "action": "balance", "payload": {} }`}</code>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="font-semibold text-foreground">VTU Services - Check Prices</p>
                      <code className="text-muted-foreground">{`{ "service_type": "data", "action": "check_price", "payload": {} }`}</code>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="font-semibold text-foreground">VTU Services - Purchase</p>
                      <code className="text-muted-foreground">{`{ "service_type": "data", "action": "purchase", "payload": { "plan_code": "...", "phone_number": "..." } }`}</code>
                    </div>
                    <div className="p-2 bg-muted rounded border-l-2 border-primary">
                      <p className="font-semibold text-foreground flex items-center gap-1">
                        <Database className="w-3 h-3" /> Data Purchase <Badge className="text-xs ml-1" variant="secondary">New</Badge>
                      </p>
                      <p className="text-muted-foreground mb-1">POST /api/v1/gateway/data</p>
                      <code className="text-muted-foreground">{`{ "network": 1, "mobile_number": "08012345678", "plan": "SME100", "Ported_number": false }`}</code>
                    </div>
                    <div className="p-2 bg-muted rounded border-l-2 border-primary">
                      <p className="font-semibold text-foreground flex items-center gap-1">
                        <Wifi className="w-3 h-3" /> Airtime Purchase <Badge className="text-xs ml-1" variant="secondary">New</Badge>
                      </p>
                      <p className="text-muted-foreground mb-1">POST /api/v1/gateway/airtime</p>
                      <code className="text-muted-foreground">{`{ "amount": 1000, "network": "MTN", "mobile_number": "08012345678", "Ported_number": false, "airtime_type": "VTU" }`}</code>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="font-semibold text-foreground">BVN Verification</p>
                      <code className="text-muted-foreground">{`{ "service_type": "bvn", "action": "verify", "payload": { "bvn": "12345678901" } }`}</code>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="font-semibold text-foreground">NIN Verification</p>
                      <code className="text-muted-foreground">{`{ "service_type": "nin", "action": "verify", "payload": { "nin": "12345678901" } }`}</code>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="font-semibold text-foreground">NIN Slip Download</p>
                      <code className="text-muted-foreground">{`{ "service_type": "nin", "action": "download_slip", "payload": { "nin": "12345678901", "slip_type": "improved" } }`}</code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default ApiPage;
