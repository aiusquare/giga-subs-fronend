import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CircleOff,
  Edit3,
  Gauge,
  GitBranch,
  Loader2,
  Plus,
  RefreshCw,
  Route,
  Settings2,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { api, ApiError } from "@/lib/apiClient";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface ProviderConfig {
  id: string;
  name: string;
  service_type: string;
  is_active: boolean;
  is_enabled: boolean;
  legacy_selected: boolean;
}

interface RouteTarget {
  id: string;
  provider_config_id: string;
  provider_name: string | null;
  priority: number;
  is_enabled: boolean;
  provider_enabled: boolean | null;
  legacy_selected: boolean | null;
  failure_threshold: number;
  failure_window_seconds: number;
  cooldown_seconds: number;
  minimum_margin_amount: number | null;
  allow_negative_margin: boolean;
}

interface RoutingRule {
  id: string;
  service_type: string;
  network_biller: string;
  plan_category: string;
  is_enabled: boolean;
  is_service_default: boolean;
  service_routing_complete: boolean;
  targets: RouteTarget[];
  created_at?: string | null;
  updated_at?: string | null;
}

interface CanonicalProduct {
  id: string;
  product_key: string;
  service_type: string;
  network_biller: string;
  plan_category: string;
  display_name: string;
  selling_price: number;
  is_active: boolean;
}

interface RouterCandidate {
  target_id: string;
  provider_config_id: string;
  provider_name: string;
  priority: number;
  mapping_available: boolean | null;
  provider_plan_code: string | null;
  expected_cost: number | null;
  expected_margin: number | null;
  eligible: boolean;
  exclusion_reason: string | null;
  exclusion_reasons?: string[];
  health_status: string;
}

interface RouterPreview {
  matched_rule: {
    id: string;
    service_type: string;
    network_biller: string;
    plan_category: string;
    is_enabled: boolean;
  } | null;
  specificity: string | null;
  candidates: RouterCandidate[];
  selected_candidate: RouterCandidate | null;
}

interface ShadowStatistics {
  number_evaluated: number;
  comparison_sample_size: number;
  current_vs_shadow_matches: number;
  current_vs_shadow_differences: number;
  current_vs_shadow_match_percent: number | null;
  rules_with_no_candidates: number;
  no_matching_rule: number;
  missing_product_mappings: number;
  disabled_providers: number;
  margin_warnings: number;
  router_errors: number;
}

interface ShadowReport {
  statistics: ShadowStatistics;
  recent: Array<{
    transaction_reference: string;
    service_type: string;
    current_provider_name: string;
    shadow_provider_name: string | null;
    comparison_status: string;
    created_at: string;
  }>;
}

interface TargetDraft {
  id?: string;
  provider_config_id: string;
  priority: string;
  is_enabled: boolean;
  failure_threshold: string;
  failure_window_seconds: string;
  cooldown_seconds: string;
  minimum_margin_amount: string;
}

const CORE_SERVICES = [
  "data",
  "airtime",
  "electricity",
  "cable",
  "result_checker",
  "scratch_card",
];

const CATEGORIES = ["NORMAL", "SME", "GIFTING", "CORPORATE", "CORPORATE2"];

const serviceLabel = (service: string) =>
  service
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatSeconds = (seconds: number) => {
  if (seconds >= 3600 && seconds % 3600 === 0) return `${seconds / 3600}h`;
  if (seconds >= 60 && seconds % 60 === 0) return `${seconds / 60}m`;
  return `${seconds}s`;
};

const formatMoney = (value: number | null) =>
  value === null
    ? "—"
    : new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 2,
      }).format(value);

const emptyTarget = (priority = 10): TargetDraft => ({
  provider_config_id: "",
  priority: String(priority),
  is_enabled: true,
  failure_threshold: "3",
  failure_window_seconds: "300",
  cooldown_seconds: "300",
  minimum_margin_amount: "",
});

const errorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError && error.errors) {
    return Object.values(error.errors).join("; ");
  }
  return error instanceof Error ? error.message : fallback;
};

const specificityLabel = (value: string | null) => {
  switch (value) {
    case "service+network_biller+plan_category":
      return "Service + Network/Biller + Category";
    case "service+network_biller":
      return "Service + Network/Biller";
    case "service+plan_category":
      return "Service + Category";
    case "service_default":
      return "Service default";
    default:
      return "No matching rule";
  }
};

export function AdminProviderRouting() {
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [products, setProducts] = useState<CanonicalProduct[]>([]);
  const [shadowReport, setShadowReport] = useState<ShadowReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedService, setSelectedService] = useState("data");

  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    service_type: "data",
    network_biller: "*",
    plan_category: "*",
  });
  const [ruleTargets, setRuleTargets] = useState<TargetDraft[]>([emptyTarget()]);

  const [targetRule, setTargetRule] = useState<RoutingRule | null>(null);
  const [editingTarget, setEditingTarget] = useState<RouteTarget | null>(null);
  const [targetForm, setTargetForm] = useState<TargetDraft>(emptyTarget());

  const [simulator, setSimulator] = useState({
    service: "data",
    network: "*",
    category: "*",
    product: "none",
  });
  const [preview, setPreview] = useState<RouterPreview | null>(null);
  const [resolving, setResolving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [routingRules, providerConfigs, canonicalProducts] = await Promise.all([
        api.get<RoutingRule[]>("/admin/provider-routing/rules"),
        api.get<ProviderConfig[]>("/admin/providers"),
        api.get<CanonicalProduct[]>("/admin/products"),
      ]);
      setRules(routingRules);
      setProviders(providerConfigs);
      setProducts(canonicalProducts);
      try {
        setShadowReport(
          await api.get<ShadowReport>(
            "/admin/provider-routing/shadow-statistics?limit=8",
          ),
        );
      } catch {
        setShadowReport(null);
      }
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Routing configuration could not be loaded"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const services = useMemo(
    () =>
      Array.from(
        new Set([
          ...CORE_SERVICES,
          ...providers.map((provider) => provider.service_type),
          ...products.map((product) => product.service_type),
        ]),
      ).sort(),
    [products, providers],
  );

  const rulesForService = useMemo(
    () =>
      rules
        .filter((rule) => rule.service_type === selectedService)
        .sort((left, right) => {
          if (left.is_service_default) return -1;
          if (right.is_service_default) return 1;
          return `${left.network_biller}:${left.plan_category}`.localeCompare(
            `${right.network_biller}:${right.plan_category}`,
          );
        }),
    [rules, selectedService],
  );

  const hasDefault = (service: string) =>
    rules.some(
      (rule) =>
        rule.service_type === service &&
        rule.network_biller === "*" &&
        rule.plan_category === "*" &&
        rule.is_enabled &&
        rule.targets.some((target) => target.is_enabled),
    );

  const networksFor = (service: string) =>
    Array.from(
      new Set(
        products
          .filter((product) => product.service_type === service)
          .map((product) => product.network_biller),
      ),
    ).sort();

  const providersFor = (service: string) =>
    providers.filter((provider) => provider.service_type === service);

  const openRuleDialog = (service = selectedService) => {
    const defaultExists = hasDefault(service);
    setRuleForm({
      service_type: service,
      network_biller: "*",
      plan_category: defaultExists ? "NORMAL" : "*",
    });
    setRuleTargets([emptyTarget()]);
    setRuleDialogOpen(true);
  };

  const updateRuleTarget = (
    index: number,
    field: keyof TargetDraft,
    value: string | boolean,
  ) => {
    setRuleTargets((current) =>
      current.map((target, targetIndex) =>
        targetIndex === index ? { ...target, [field]: value } : target,
      ),
    );
  };

  const targetPayload = (target: TargetDraft) => ({
    provider_config_id: target.provider_config_id,
    priority: Number(target.priority),
    is_enabled: target.is_enabled,
    failure_threshold: Number(target.failure_threshold),
    failure_window_seconds: Number(target.failure_window_seconds),
    cooldown_seconds: Number(target.cooldown_seconds),
    minimum_margin_amount:
      target.minimum_margin_amount.trim() === ""
        ? null
        : Number(target.minimum_margin_amount),
    allow_negative_margin: false,
  });

  const createRule = async () => {
    const isDefault =
      ruleForm.network_biller === "*" && ruleForm.plan_category === "*";
    const exactScopeExists = rules.some(
      (rule) =>
        rule.service_type === ruleForm.service_type &&
        rule.network_biller === ruleForm.network_biller &&
        rule.plan_category === ruleForm.plan_category,
    );
    if (exactScopeExists) {
      toast.error("A routing rule already exists for this exact scope");
      return;
    }
    if (!isDefault && !hasDefault(ruleForm.service_type)) {
      toast.error("Create an enabled service default before adding overrides");
      return;
    }
    if (
      ruleTargets.some(
        (target) =>
          !target.provider_config_id ||
          !Number.isInteger(Number(target.priority)) ||
          Number(target.priority) < 1,
      )
    ) {
      toast.error("Every target needs a provider and a valid whole-number priority");
      return;
    }
    const priorities = ruleTargets.map((target) => Number(target.priority));
    const providerIds = ruleTargets.map((target) => target.provider_config_id);
    if (new Set(priorities).size !== priorities.length) {
      toast.error("Priorities must be unique inside a rule");
      return;
    }
    if (new Set(providerIds).size !== providerIds.length) {
      toast.error("A provider can appear only once inside a rule");
      return;
    }
    if (!ruleTargets.some((target) => target.is_enabled)) {
      toast.error("At least one target must be enabled");
      return;
    }

    setSaving(true);
    try {
      await api.post("/admin/provider-routing/rules", {
        ...ruleForm,
        is_enabled: true,
        targets: ruleTargets.map(targetPayload),
      });
      setRuleDialogOpen(false);
      setSelectedService(ruleForm.service_type);
      await fetchData();
      toast.success(isDefault ? "Service default created" : "Routing override created");
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Routing rule could not be created"));
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (rule: RoutingRule, enabled: boolean) => {
    try {
      await api.put(`/admin/provider-routing/rules/${rule.id}`, {
        service_type: rule.service_type,
        network_biller: rule.network_biller,
        plan_category: rule.plan_category,
        is_enabled: enabled,
      });
      await fetchData();
      toast.success(`Rule ${enabled ? "enabled" : "disabled"}`);
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Rule could not be updated"));
    }
  };

  const deleteRule = async (rule: RoutingRule) => {
    if (!window.confirm(`Delete ${scopeTitle(rule)}?`)) return;
    try {
      await api.del(`/admin/provider-routing/rules/${rule.id}`);
      await fetchData();
      toast.success("Routing rule deleted");
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Routing rule could not be deleted"));
    }
  };

  const openTargetDialog = (rule: RoutingRule, target?: RouteTarget) => {
    setTargetRule(rule);
    setEditingTarget(target ?? null);
    setTargetForm(
      target
        ? {
            id: target.id,
            provider_config_id: target.provider_config_id,
            priority: String(target.priority),
            is_enabled: target.is_enabled,
            failure_threshold: String(target.failure_threshold),
            failure_window_seconds: String(target.failure_window_seconds),
            cooldown_seconds: String(target.cooldown_seconds),
            minimum_margin_amount:
              target.minimum_margin_amount === null
                ? ""
                : String(target.minimum_margin_amount),
          }
        : emptyTarget(
            Math.max(0, ...rule.targets.map((item) => item.priority)) + 10,
          ),
    );
  };

  const saveTarget = async () => {
    if (!targetRule || !targetForm.provider_config_id) {
      toast.error("Select a provider");
      return;
    }
    setSaving(true);
    try {
      if (editingTarget) {
        await api.put(
          `/admin/provider-routing/targets/${editingTarget.id}`,
          targetPayload(targetForm),
        );
      } else {
        await api.post(
          `/admin/provider-routing/rules/${targetRule.id}/targets`,
          targetPayload(targetForm),
        );
      }
      setTargetRule(null);
      setEditingTarget(null);
      await fetchData();
      toast.success(editingTarget ? "Target settings updated" : "Provider target added");
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Target could not be saved"));
    } finally {
      setSaving(false);
    }
  };

  const deleteTarget = async (target: RouteTarget) => {
    if (!window.confirm(`Remove ${target.provider_name ?? "this provider"} from the rule?`)) return;
    try {
      await api.del(`/admin/provider-routing/targets/${target.id}`);
      await fetchData();
      toast.success("Provider target removed");
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Provider target could not be removed"));
    }
  };

  const selectSimulatorProduct = (productId: string) => {
    const product = products.find((item) => item.id === productId);
    setSimulator((current) =>
      product
        ? {
            service: product.service_type,
            network: product.network_biller,
            category: product.plan_category,
            product: product.id,
          }
        : { ...current, product: "none" },
    );
    setPreview(null);
  };

  const resolveRoute = async () => {
    setResolving(true);
    setPreview(null);
    const query = new URLSearchParams({
      service: simulator.service,
      network: simulator.network,
      category: simulator.category,
    });
    if (simulator.product !== "none") {
      query.set("canonical_product_id", simulator.product);
    }
    try {
      setPreview(
        await api.get<RouterPreview>(
          `/admin/provider-routing/resolve-preview?${query.toString()}`,
        ),
      );
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Route could not be resolved"));
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const stats = shadowReport?.statistics;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold">Routing &amp; Failover</h2>
            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
              Shadow mode
            </Badge>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Configure provider order and safety thresholds, then compare the route
            with current production selection. These rules cannot initiate a purchase.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => void fetchData()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button onClick={() => openRuleDialog()} className="gap-2">
            <Plus className="h-4 w-4" /> New routing rule
          </Button>
        </div>
      </div>

      <Alert className="border-amber-500/30 bg-amber-500/5">
        <ShieldCheck className="h-4 w-4 text-amber-600" />
        <AlertTitle>Production routing is unchanged</AlertTitle>
        <AlertDescription>
          Purchases still use the single provider marked active in API Settings.
          Priorities on this page are evaluated and audited only; automatic failover is disabled.
        </AlertDescription>
      </Alert>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric label="Evaluated" value={stats?.number_evaluated ?? 0} icon={Activity} />
        <Metric
          label="Current ↔ Shadow match"
          value={stats?.current_vs_shadow_match_percent === null || stats?.current_vs_shadow_match_percent === undefined ? "—" : `${stats.current_vs_shadow_match_percent}%`}
          detail={`${stats?.comparison_sample_size ?? 0} comparable`}
          icon={Route}
        />
        <Metric label="No candidate" value={stats?.rules_with_no_candidates ?? 0} icon={CircleOff} />
        <Metric label="Missing mappings" value={stats?.missing_product_mappings ?? 0} icon={GitBranch} />
        <Metric label="Disabled providers" value={stats?.disabled_providers ?? 0} icon={CircleOff} />
        <Metric label="Margin warnings" value={stats?.margin_warnings ?? 0} icon={AlertTriangle} />
      </section>

      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-base">Configured routes</CardTitle>
            <CardDescription>
              The default route is mandatory. Overrides follow network and category specificity.
            </CardDescription>
          </div>
          <Select value={selectedService} onValueChange={setSelectedService}>
            <SelectTrigger className="w-full lg:w-[240px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {services.map((service) => (
                <SelectItem key={service} value={service}>
                  {serviceLabel(service)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasDefault(selectedService) && (
            <div className="flex flex-col gap-3 rounded-xl border border-dashed border-amber-500/50 bg-amber-500/5 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Default route required</p>
                <p className="text-sm text-muted-foreground">
                  Overrides cannot become active until {serviceLabel(selectedService)} has an enabled service default.
                </p>
              </div>
              <Button size="sm" onClick={() => openRuleDialog(selectedService)}>
                Create default
              </Button>
            </div>
          )}

          {rulesForService.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No routing rules configured for this service.
            </div>
          ) : (
            rulesForService.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                onToggle={toggleRule}
                onDelete={deleteRule}
                onAddTarget={(item) => openTargetDialog(item)}
                onEditTarget={(item, target) => openTargetDialog(item, target)}
                onDeleteTarget={deleteTarget}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Routing simulator</CardTitle>
          </div>
          <CardDescription>
            Resolve a shadow route from configuration only. No wallet, transaction, or provider endpoint is touched.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Field label="Service">
              <Select
                value={simulator.service}
                onValueChange={(service) => {
                  setSimulator({ service, network: "*", category: "*", product: "none" });
                  setPreview(null);
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {services.map((service) => <SelectItem key={service} value={service}>{serviceLabel(service)}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Network / Biller">
              <Select value={simulator.network} onValueChange={(network) => setSimulator((item) => ({ ...item, network, product: "none" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="*">Any network / biller</SelectItem>
                  {networksFor(simulator.service).map((network) => <SelectItem key={network} value={network}>{network}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Plan category">
              <Select value={simulator.category} onValueChange={(category) => setSimulator((item) => ({ ...item, category, product: "none" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="*">Any category</SelectItem>
                  {CATEGORIES.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Customer product">
              <Select value={simulator.product} onValueChange={selectSimulatorProduct}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No canonical product</SelectItem>
                  {products.filter((product) => product.is_active && product.service_type === simulator.service).map((product) => (
                    <SelectItem key={product.id} value={product.id}>{product.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="flex items-end">
              <Button className="w-full gap-2" onClick={() => void resolveRoute()} disabled={resolving}>
                {resolving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Route className="h-4 w-4" />}
                Resolve route
              </Button>
            </div>
          </div>

          {preview && <PreviewResult preview={preview} />}
        </CardContent>
      </Card>

      {shadowReport && shadowReport.recent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent shadow comparisons</CardTitle>
            <CardDescription>Sanitized decisions only; provider credentials and customer payloads are never displayed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {shadowReport.recent.map((item) => (
              <div key={item.transaction_reference} className="grid gap-2 rounded-lg border p-3 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs">{item.transaction_reference}</p>
                  <p className="text-xs text-muted-foreground">{serviceLabel(item.service_type)} · {item.created_at}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.current_provider_name} <ChevronRight className="mx-1 inline h-3 w-3" /> {item.shadow_provider_name ?? "No candidate"}
                </div>
                <StatusBadge status={item.comparison_status} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create routing rule</DialogTitle>
            <DialogDescription>
              Leave network and category as “Any” for the mandatory service default.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Service">
              <Select value={ruleForm.service_type} onValueChange={(service_type) => setRuleForm({ service_type, network_biller: "*", plan_category: hasDefault(service_type) ? "NORMAL" : "*" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{services.map((service) => <SelectItem key={service} value={service}>{serviceLabel(service)}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Network / Biller (optional)">
              <Select value={ruleForm.network_biller} onValueChange={(network_biller) => setRuleForm((item) => ({ ...item, network_biller }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="*">Any</SelectItem>
                  {networksFor(ruleForm.service_type).map((network) => <SelectItem key={network} value={network}>{network}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Plan category (optional)">
              <Select value={ruleForm.plan_category} onValueChange={(plan_category) => setRuleForm((item) => ({ ...item, plan_category }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="*">Any</SelectItem>
                  {CATEGORIES.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {!hasDefault(ruleForm.service_type) && (ruleForm.network_biller !== "*" || ruleForm.plan_category !== "*") && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Default route required first</AlertTitle>
              <AlertDescription>Set both optional fields to Any to create the service default.</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Provider targets</Label>
                <p className="text-xs text-muted-foreground">Lower priority numbers are evaluated first.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setRuleTargets((items) => [...items, emptyTarget(Math.max(0, ...items.map((item) => Number(item.priority) || 0)) + 10)])}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Provider
              </Button>
            </div>
            {ruleTargets.map((target, index) => (
              <TargetFields
                key={index}
                value={target}
                providers={providersFor(ruleForm.service_type)}
                onChange={(field, value) => updateRuleTarget(index, field, value)}
                onRemove={ruleTargets.length > 1 ? () => setRuleTargets((items) => items.filter((_, itemIndex) => itemIndex !== index)) : undefined}
              />
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => void createRule()} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={targetRule !== null} onOpenChange={(open) => !open && setTargetRule(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTarget ? "Edit provider target" : "Add provider target"}</DialogTitle>
            <DialogDescription>{targetRule ? scopeTitle(targetRule) : ""}</DialogDescription>
          </DialogHeader>
          {targetRule && (
            <TargetFields
              value={targetForm}
              providers={providersFor(targetRule.service_type)}
              onChange={(field, value) => setTargetForm((item) => ({ ...item, [field]: value }))}
              lockProvider={Boolean(editingTarget)}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTargetRule(null)}>Cancel</Button>
            <Button onClick={() => void saveTarget()} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save target
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function scopeTitle(rule: RoutingRule) {
  if (rule.is_service_default) return `${serviceLabel(rule.service_type)} / Default`;
  return [serviceLabel(rule.service_type), rule.network_biller, rule.plan_category]
    .filter((value) => value !== "*")
    .join(" / ");
}

function RuleCard({
  rule,
  onToggle,
  onDelete,
  onAddTarget,
  onEditTarget,
  onDeleteTarget,
}: {
  rule: RoutingRule;
  onToggle: (rule: RoutingRule, enabled: boolean) => void;
  onDelete: (rule: RoutingRule) => void;
  onAddTarget: (rule: RoutingRule) => void;
  onEditTarget: (rule: RoutingRule, target: RouteTarget) => void;
  onDeleteTarget: (target: RouteTarget) => void;
}) {
  const effective = rule.targets.filter(
    (target) => target.is_enabled && target.provider_enabled !== false,
  );
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="flex flex-col gap-3 border-b bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{scopeTitle(rule)}</p>
            <Badge variant={rule.is_service_default ? "default" : "secondary"}>
              {rule.is_service_default ? "Mandatory default" : "Override"}
            </Badge>
            {!rule.is_enabled && <Badge variant="outline">Disabled</Badge>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Scope: {rule.network_biller} / {rule.plan_category} · {effective.length} effective candidate{effective.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`rule-${rule.id}`} className="text-xs">Rule enabled</Label>
          <Switch id={`rule-${rule.id}`} checked={rule.is_enabled} onCheckedChange={(checked) => void onToggle(rule, checked)} />
          <Button variant="outline" size="sm" onClick={() => onAddTarget(rule)}><Plus className="mr-1 h-3.5 w-3.5" /> Target</Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(rule)} aria-label="Delete rule"><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </div>

      <div className="hidden grid-cols-[90px_minmax(130px,1fr)_130px_150px_minmax(220px,1fr)_80px] gap-3 border-b px-4 py-2 text-xs font-medium text-muted-foreground lg:grid">
        <span>Priority</span><span>Provider</span><span>Current health</span><span>Effective order</span><span>Failover settings</span><span />
      </div>
      <div className="divide-y">
        {rule.targets.map((target) => {
          const order = effective.findIndex((item) => item.id === target.id);
          return (
            <div key={target.id} className="grid gap-3 p-4 lg:grid-cols-[90px_minmax(130px,1fr)_130px_150px_minmax(220px,1fr)_80px] lg:items-center">
              <div><MobileLabel>Configured priority</MobileLabel><span className="font-mono text-sm font-semibold">{target.priority}</span></div>
              <div>
                <MobileLabel>Provider</MobileLabel>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{target.provider_name ?? "Unknown"}</span>
                  {!target.is_enabled && <Badge variant="outline">Target off</Badge>}
                  {target.provider_enabled === false && <Badge variant="destructive">Provider off</Badge>}
                  {target.legacy_selected && <Badge variant="secondary">Live legacy</Badge>}
                </div>
              </div>
              <div><MobileLabel>Current health</MobileLabel><Badge variant="outline" className="font-normal"><Activity className="mr-1 h-3 w-3" /> Not evaluated</Badge></div>
              <div>
                <MobileLabel>Effective candidate order</MobileLabel>
                {order >= 0 && rule.is_enabled ? <span className="text-sm font-medium">#{order + 1} in shadow</span> : <span className="text-sm text-muted-foreground">Excluded</span>}
              </div>
              <div>
                <MobileLabel>Failover settings</MobileLabel>
                <p className="text-xs text-muted-foreground">
                  {target.failure_threshold} failures / {formatSeconds(target.failure_window_seconds)} · {formatSeconds(target.cooldown_seconds)} cooldown
                  {target.minimum_margin_amount !== null ? ` · min ${formatMoney(target.minimum_margin_amount)}` : " · no minimum margin"}
                </p>
              </div>
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => onEditTarget(rule, target)} aria-label="Edit target"><Edit3 className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => onDeleteTarget(target)} aria-label="Delete target"><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TargetFields({
  value,
  providers,
  onChange,
  onRemove,
  lockProvider = false,
}: {
  value: TargetDraft;
  providers: ProviderConfig[];
  onChange: (field: keyof TargetDraft, value: string | boolean) => void;
  onRemove?: () => void;
  lockProvider?: boolean;
}) {
  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Provider">
          <Select value={value.provider_config_id} onValueChange={(provider) => onChange("provider_config_id", provider)} disabled={lockProvider}>
            <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
            <SelectContent>
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id} disabled={!provider.is_enabled}>
                  {provider.name}{provider.is_enabled ? "" : " — disabled"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Priority"><Input type="number" min={1} max={65535} value={value.priority} onChange={(event) => onChange("priority", event.target.value)} /></Field>
        <Field label="Failure threshold"><Input type="number" min={1} max={100} value={value.failure_threshold} onChange={(event) => onChange("failure_threshold", event.target.value)} /></Field>
        <div className="flex items-end justify-between rounded-lg border px-3 py-2">
          <div><Label>Target enabled</Label><p className="text-xs text-muted-foreground">Available in shadow</p></div>
          <Switch checked={value.is_enabled} onCheckedChange={(checked) => onChange("is_enabled", checked)} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Failure window (seconds)"><Input type="number" min={1} max={86400} value={value.failure_window_seconds} onChange={(event) => onChange("failure_window_seconds", event.target.value)} /></Field>
        <Field label="Cooldown (seconds)"><Input type="number" min={0} max={604800} value={value.cooldown_seconds} onChange={(event) => onChange("cooldown_seconds", event.target.value)} /></Field>
        <Field label="Minimum margin (optional)"><Input type="number" min={0} step="0.01" placeholder="No minimum" value={value.minimum_margin_amount} onChange={(event) => onChange("minimum_margin_amount", event.target.value)} /></Field>
      </div>
      {onRemove && <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={onRemove}><X className="mr-1 h-3.5 w-3.5" /> Remove target</Button>}
    </div>
  );
}

function PreviewResult({ preview }: { preview: RouterPreview }) {
  return (
    <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Matched rule</p>
          <p className="font-semibold">
            {preview.matched_rule
              ? `${serviceLabel(preview.matched_rule.service_type)} / ${preview.matched_rule.network_biller} / ${preview.matched_rule.plan_category}`
              : "No matching rule"}
          </p>
          <p className="text-xs text-muted-foreground">{specificityLabel(preview.specificity)}</p>
        </div>
        <div className="rounded-lg border bg-background px-3 py-2 text-sm">
          <span className="text-muted-foreground">Would select: </span>
          <strong>{preview.selected_candidate?.provider_name ?? "No eligible provider"}</strong>
        </div>
      </div>

      {preview.candidates.length === 0 ? (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No candidates are configured for the resolved scope.</div>
      ) : (
        <div className="space-y-2">
          {preview.candidates.map((candidate, index) => (
            <div key={candidate.target_id} className="grid gap-3 rounded-lg border bg-background p-3 text-sm md:grid-cols-[55px_1fr_1fr_1fr_1fr] md:items-center">
              <div className="font-mono font-semibold">#{index + 1}</div>
              <div><MobileLabel>Provider</MobileLabel><p className="font-medium">{candidate.provider_name}</p><p className="text-xs text-muted-foreground">Priority {candidate.priority}</p></div>
              <div><MobileLabel>Product mapping</MobileLabel><p>{candidate.mapping_available === null ? "Not required" : candidate.mapping_available ? "Available" : "Missing"}</p><p className="font-mono text-xs text-muted-foreground">{candidate.provider_plan_code ?? "No plan code"}</p></div>
              <div><MobileLabel>Economics</MobileLabel><p>{formatMoney(candidate.expected_cost)} cost</p><p className={candidate.expected_margin !== null && candidate.expected_margin < 0 ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>{formatMoney(candidate.expected_margin)} margin</p></div>
              <div>
                <MobileLabel>Eligibility</MobileLabel>
                {candidate.eligible ? <Badge className="bg-emerald-600"><CheckCircle2 className="mr-1 h-3 w-3" /> Eligible</Badge> : <Badge variant="destructive"><CircleOff className="mr-1 h-3 w-3" /> Excluded</Badge>}
                <p className="mt-1 text-xs text-muted-foreground">{candidate.exclusion_reason?.replaceAll("_", " ") ?? "Ready in shadow order"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail?: string; icon: typeof Activity }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-2 p-4">
        <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p>{detail && <p className="text-[11px] text-muted-foreground">{detail}</p>}</div>
        <Icon className="h-4 w-4 text-primary" />
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function MobileLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground lg:hidden">{children}</p>;
}

function StatusBadge({ status }: { status: string }) {
  const match = status === "MATCH";
  return <Badge variant={match ? "default" : status === "DIFFERENT" ? "secondary" : "outline"}>{status.replaceAll("_", " ")}</Badge>;
}
