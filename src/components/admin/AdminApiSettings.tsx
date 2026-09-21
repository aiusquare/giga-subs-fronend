import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Save,
  Eye,
  EyeOff,
  Loader2,
  RotateCcw,
  SlidersHorizontal,
  KeyRound,
  Pencil,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { api } from "@/lib/apiClient";

interface ApiProvider {
  /** Lowercase id used in frontend state; backend stores name as UPPERCASE */
  id: string;
  name: string;
  description: string;
  supportedServices: string[];
}

/**
 * Providers that are actually implemented in the backend.
 * The api_url is entered per-installation by the admin because each
 * reseller account has its own endpoint URL.
 */
const apiProviders: ApiProvider[] = [
  {
    id: "ade",
    name: "ADE",
    description: "ADE VTU Reseller API Ã¢â‚¬â€ Data & Airtime",
    supportedServices: [
      "airtime",
      "data",
      "electricity",
      "cable",
      "scratch_card",
      "result_checker",
    ],
  },
  {
    id: "msorg",
    name: "MSORG",
    description:
      "MSORG / Maskawa API Ã¢â‚¬â€ Data, Airtime, Electricity & Cable TV",
    supportedServices: ["airtime", "data", "electricity", "cable"],
  },
  {
    id: "smeplug",
    name: "SMEPLUG",
    description: "SME Plug API — Data & Airtime",
    supportedServices: ["airtime", "data"],
  },
  {
    id: "lumiid",
    name: "LUMIID",
    description:
      "LumiID Identity API Ã¢â‚¬â€ BVN, NIN, NIN Slip, Unified Identity",
    supportedServices: [
      "bvn_verification",
      "nin_verification",
      "nin_slip_download",
      "unified_identity",
    ],
  },
  {
    id: "interswitch",
    name: "INTERSWITCH",
    description:
      "Interswitch Marketplace Identity APIs Ã¢â‚¬â€ BVN Full Details, NIN Full Details",
    supportedServices: ["bvn_verification", "nin_verification"],
  },
];

const serviceTypes = [
  { id: "airtime", label: "Airtime" },
  { id: "data", label: "Data" },
  { id: "electricity", label: "Electricity" },
  { id: "cable", label: "Cable TV" },
  { id: "scratch_card", label: "Scratch Cards" },
  { id: "result_checker", label: "Exam Pins" },
  { id: "bvn_verification", label: "BVN Verification" },
  { id: "nin_verification", label: "NIN Verification" },
  { id: "nin_slip_download", label: "NIN Slip Download" },
  { id: "unified_identity", label: "Unified Identity" },
];

const msorgEndpoints: Record<string, string> = {
  airtime: "https://maskawasubapi.com/api/topup/",
  data: "https://maskawasubapi.com/api/data/",
  electricity: "https://maskawasubapi.com/api/billpayment/",
  cable: "https://maskawasubapi.com/api/cablesub/",
};

const smeplugEndpoints: Record<string, string> = {
  airtime: "https://smeplug.ng/api/v1/airtime/purchase",
  data: "https://smeplug.ng/api/v1/data/purchase",
};

interface ServiceConfig {
  /** DB row id Ã¢â‚¬â€ null if not yet saved to backend */
  dbId: string | null;
  provider: string;
  /** Full endpoint URL for this provider account */
  apiUrl: string;
  /** OAuth/authentication base URL for providers that use a separate auth host */
  authUrl: string;
  apiKey: string;
  secretKey: string;
  enabled: boolean;
  /** True if the backend has an API token stored (but we don't show it) */
  hasStoredApiKey: boolean;
  /** True if the backend has a secret key stored (but we don't show it) */
  hasStoredSecretKey: boolean;
}

type ConfigsMap = Record<string, ServiceConfig>;

const emptyConfig = (): ServiceConfig => ({
  dbId: null,
  provider: "",
  apiUrl: "",
  authUrl: "",
  apiKey: "",
  secretKey: "",
  enabled: false,
  hasStoredApiKey: false,
  hasStoredSecretKey: false,
});

interface ProviderRow {
  id: string;
  name: string;
  service_type: string;
  api_url: string;
  auth_url?: string | null;
  is_active: boolean;
  has_api_key: boolean;
  has_secret_key: boolean;
}

function configFromRow(row: ProviderRow): ServiceConfig {
  return {
    dbId: row.id,
    provider: row.name.toLowerCase(),
    apiUrl: row.api_url ?? "",
    authUrl: row.auth_url ?? "",
    apiKey: "",
    secretKey: "",
    enabled: row.is_active,
    hasStoredApiKey: row.has_api_key,
    hasStoredSecretKey: row.has_secret_key,
  };
}

export function AdminApiSettings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [editingCredentials, setEditingCredentials] = useState<
    Record<string, boolean>
  >({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [providerRows, setProviderRows] = useState<ProviderRow[]>([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [providerFilter, setProviderFilter] = useState(
    searchParams.get("provider") || "all",
  );
  const [serviceFilter, setServiceFilter] = useState(
    searchParams.get("service") || "all",
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all",
  );
  const [configuredFilter, setConfiguredFilter] = useState(
    searchParams.get("configured") || "all",
  );
  const [routingService, setRoutingService] = useState("data");
  const [switchingApi, setSwitchingApi] = useState(false);

  const [apiConfigs, setApiConfigs] = useState<ConfigsMap>(() =>
    Object.fromEntries(serviceTypes.map((s) => [s.id, emptyConfig()])),
  );

  // Load existing provider configs from backend on mount
  useEffect(() => {
    api
      .get<ProviderRow[]>("/admin/providers")
      .then((rows) => {
        setProviderRows(rows);
        setApiConfigs((prev) => {
          const next = { ...prev };
          for (const service of serviceTypes) {
            const serviceRows = rows.filter(
              (row) => row.service_type.toLowerCase() === service.id,
            );
            const row =
              serviceRows.find((candidate) => candidate.is_active) ||
              serviceRows[0];
            if (row) {
              next[service.id] = configFromRow(row);
            }
          }
          return next;
        });
      })
      .catch(() => toast.error("Failed to load API settings"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    if (serviceFilter !== "all") params.set("service", serviceFilter);
    if (providerFilter !== "all") params.set("provider", providerFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (configuredFilter !== "all") params.set("configured", configuredFilter);
    setSearchParams(params, { replace: true });
  }, [
    searchTerm,
    serviceFilter,
    providerFilter,
    statusFilter,
    configuredFilter,
    setSearchParams,
  ]);

  const toggleShowKey = (serviceId: string, keyType: "api" | "secret") => {
    const key = `${serviceId}-${keyType}`;
    setShowApiKey((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateConfig = (
    serviceId: string,
    field: keyof ServiceConfig,
    value: string | boolean,
  ) => {
    if (field === "provider" && typeof value === "string") {
      const existing = providerRows.find(
        (row) =>
          row.service_type.toLowerCase() === serviceId &&
          row.name.toLowerCase() === value,
      );
      setApiConfigs((prev) => ({
        ...prev,
        [serviceId]: existing
          ? configFromRow(existing)
          : {
              ...emptyConfig(),
              provider: value,
              apiUrl:
                value === "msorg"
                  ? (msorgEndpoints[serviceId] ?? "")
                  : value === "smeplug"
                    ? (smeplugEndpoints[serviceId] ?? "")
                    : "",
            },
      }));
      setEditingCredentials((prev) => ({ ...prev, [serviceId]: false }));
      setShowApiKey((prev) => ({
        ...prev,
        [`${serviceId}-api`]: false,
        [`${serviceId}-secret`]: false,
      }));
      return;
    }
    setApiConfigs((prev) => ({
      ...prev,
      [serviceId]: { ...prev[serviceId], [field]: value },
    }));
  };

  const getProvidersForService = (serviceId: string) =>
    apiProviders.filter((provider) =>
      provider.supportedServices.includes(serviceId),
    );

  const getProviderRowsForService = (serviceId: string) =>
    providerRows.filter((row) => row.service_type.toLowerCase() === serviceId);

  const getProviderRowForService = (serviceId: string, providerId: string) =>
    providerRows.find(
      (row) =>
        row.service_type.toLowerCase() === serviceId &&
        row.name.toLowerCase() === providerId,
    );

  const providerHasCredentials = (provider: ProviderRow) =>
    provider.has_api_key &&
    (provider.name.toUpperCase() !== "INTERSWITCH" || provider.has_secret_key);

  const focusProviderSetup = (serviceId: string, providerId: string) => {
    const provider = getProvidersForService(serviceId).find(
      (candidate) => candidate.id === providerId,
    );
    if (!provider) return;

    setServiceFilter(serviceId);
    setProviderFilter(providerId);
    setStatusFilter("all");
    setConfiguredFilter("all");
    updateConfig(serviceId, "provider", providerId);
    updateConfig(serviceId, "enabled", true);
    setEditingCredentials((prev) => ({ ...prev, [serviceId]: true }));

    window.requestAnimationFrame(() => {
      document
        .getElementById(`api-config-${serviceId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    toast.info(
      `${provider.name} supports ${
        serviceTypes.find((service) => service.id === serviceId)?.label ||
        serviceId
      }. Add credentials and save before activation.`,
    );
  };

  const filteredServices = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return serviceTypes.filter((service) => {
      const config = apiConfigs[service.id];
      const supportedProviders = apiProviders.filter((provider) =>
        provider.supportedServices.includes(service.id),
      );
      const matchesSearch =
        !query ||
        service.label.toLowerCase().includes(query) ||
        config.provider.toLowerCase().includes(query) ||
        supportedProviders.some(
          (provider) =>
            provider.name.toLowerCase().includes(query) ||
            provider.description.toLowerCase().includes(query),
        );
      const matchesProvider =
        providerFilter === "all" ||
        supportedProviders.some((provider) => provider.id === providerFilter);
      const matchesService =
        serviceFilter === "all" || service.id === serviceFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "enabled" ? config.enabled : !config.enabled);
      const isConfigured = Boolean(config.dbId);
      const matchesConfigured =
        configuredFilter === "all" ||
        (configuredFilter === "configured" ? isConfigured : !isConfigured);

      return (
        matchesSearch &&
        matchesService &&
        matchesProvider &&
        matchesStatus &&
        matchesConfigured
      );
    });
  }, [
    apiConfigs,
    searchTerm,
    serviceFilter,
    providerFilter,
    statusFilter,
    configuredFilter,
  ]);

  const activeFilterCount = [
    searchTerm.trim(),
    serviceFilter !== "all",
    providerFilter !== "all",
    statusFilter !== "all",
    configuredFilter !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm("");
    setServiceFilter("all");
    setProviderFilter("all");
    setStatusFilter("all");
    setConfiguredFilter("all");
  };

  const routingProviders = getProviderRowsForService(routingService);
  const activeRoutingProvider = routingProviders.find((row) => row.is_active);
  const routingProviderOptions = getProvidersForService(routingService).map(
    (provider) => {
      const row = getProviderRowForService(routingService, provider.id);
      return {
        id: row?.id ?? `setup:${provider.id}`,
        name: provider.name,
        providerId: provider.id,
        row,
        isActive: Boolean(row?.is_active),
        isConfigured: Boolean(row),
        credentialsReady: row ? providerHasCredentials(row) : false,
      };
    },
  );

  const switchActiveApi = async (providerId: string) => {
    const selected = providerRows.find((row) => row.id === providerId);
    if (!selected || selected.is_active) return;

    setSwitchingApi(true);
    try {
      const updated = await api.post<ProviderRow>(
        `/admin/providers/${providerId}/toggle`,
      );
      setProviderRows((prev) =>
        prev.map((row) => {
          if (row.id === updated.id) return updated;
          if (row.service_type === updated.service_type) {
            return { ...row, is_active: false };
          }
          return row;
        }),
      );
      setApiConfigs((prev) => ({
        ...prev,
        [updated.service_type]: configFromRow(updated),
      }));
      setEditingCredentials((prev) => ({
        ...prev,
        [updated.service_type]: false,
      }));
      toast.success(
        `${updated.name} is now active for ${serviceTypes.find((service) => service.id === updated.service_type)?.label || updated.service_type}`,
      );
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "API switch failed");
    } finally {
      setSwitchingApi(false);
    }
  };

  const handleRoutingProviderChange = async (value: string) => {
    if (value.startsWith("setup:")) {
      focusProviderSetup(routingService, value.replace("setup:", ""));
      return;
    }

    const selected = providerRows.find((row) => row.id === value);
    if (!selected) return;

    if (!providerHasCredentials(selected)) {
      focusProviderSetup(routingService, selected.name.toLowerCase());
      return;
    }

    await switchActiveApi(value);
  };

  const handleSave = async (serviceId: string) => {
    const config = apiConfigs[serviceId];
    const availableProviders = getProvidersForService(serviceId);

    if (!config.dbId && !config.enabled) {
      return;
    }

    if (
      config.enabled &&
      config.provider &&
      !availableProviders.some((p) => p.id === config.provider)
    ) {
      toast.error("Selected provider is not supported for this service");
      return;
    }

    if (config.enabled && !config.provider) {
      toast.error("Please select a provider");
      return;
    }
    if (config.enabled && !config.apiUrl) {
      toast.error("API URL is required");
      return;
    }
    if (
      config.enabled &&
      config.provider === "interswitch" &&
      !config.authUrl
    ) {
      toast.error("Authentication Base URL is required for Interswitch");
      return;
    }
    if (!config.dbId && config.enabled && !config.apiKey) {
      toast.error(
        config.provider === "interswitch"
          ? "Client ID is required for Interswitch"
          : "API token is required when configuring a provider for the first time",
      );
      return;
    }
    if (
      config.enabled &&
      config.provider === "interswitch" &&
      !config.hasStoredSecretKey &&
      !config.secretKey
    ) {
      toast.error("Client Secret is required for Interswitch");
      return;
    }

    setSaving((prev) => ({ ...prev, [serviceId]: true }));

    try {
      if (config.dbId) {
        // Update existing row
        const payload: Record<string, unknown> = {
          is_active: config.enabled,
        };
        if (config.provider) payload.name = config.provider;
        if (config.apiUrl) payload.api_url = config.apiUrl;
        payload.auth_url = config.authUrl || null;
        if (config.apiKey) payload.api_token = config.apiKey;
        if (config.secretKey) payload.secret_key = config.secretKey;

        const updated = await api.put<ProviderRow>(
          `/admin/providers/${config.dbId}`,
          payload,
        );
        setProviderRows((prev) =>
          prev.map((row) => {
            if (row.id === updated.id) return updated;
            if (
              row.service_type === updated.service_type &&
              updated.is_active
            ) {
              return { ...row, is_active: false };
            }
            return row;
          }),
        );
      } else {
        // Create new row
        const payload: Record<string, unknown> = {
          name: config.provider,
          service_type: serviceId,
          api_url: config.apiUrl,
          auth_url: config.authUrl || null,
          api_token: config.apiKey,
          is_active: config.enabled ? 1 : 0,
        };
        if (config.secretKey) payload.secret_key = config.secretKey;

        const created = await api.post<ProviderRow>(
          "/admin/providers",
          payload,
        );
        setProviderRows((prev) => [
          ...prev.map((row) =>
            row.service_type === created.service_type && created.is_active
              ? { ...row, is_active: false }
              : row,
          ),
          created,
        ]);
        setApiConfigs((prev) => ({
          ...prev,
          [serviceId]: configFromRow(created),
        }));
      }

      // Clear plaintext keys after save (they're stored in DB now)
      setApiConfigs((prev) => ({
        ...prev,
        [serviceId]: {
          ...prev[serviceId],
          apiKey: "",
          secretKey: "",
          hasStoredApiKey: prev[serviceId].apiKey
            ? true
            : prev[serviceId].hasStoredApiKey,
          hasStoredSecretKey: prev[serviceId].secretKey
            ? true
            : prev[serviceId].hasStoredSecretKey,
        },
      }));
      setEditingCredentials((prev) => ({ ...prev, [serviceId]: false }));

      toast.success(`${serviceId} API settings saved`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Save failed";
      toast.error(message);
    } finally {
      setSaving((prev) => ({ ...prev, [serviceId]: false }));
    }
  };

  const handleSaveAll = async () => {
    await Promise.all(serviceTypes.map((s) => handleSave(s.id)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            API Configuration
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure API providers for each service type
          </p>
        </div>
        <Button onClick={handleSaveAll} className="w-full gap-2 sm:w-auto">
          <Save className="w-4 h-4" />
          Save All
        </Button>
      </div>


      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Filters
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              disabled={activeFilterCount === 0}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Clear
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Input
              placeholder="Search service or API provider..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {serviceTypes.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All API Providers</SelectItem>
                {apiProviders.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Enabled and Disabled</SelectItem>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={configuredFilter}
              onValueChange={setConfiguredFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by configuration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Configurations</SelectItem>
                <SelectItem value="configured">Configured</SelectItem>
                <SelectItem value="unconfigured">Not Configured</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            Showing {filteredServices.length} of {serviceTypes.length} services
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {filteredServices.map((service) => {
          const availableProviders = getProvidersForService(service.id);
          const config = apiConfigs[service.id];
          const isSaving = saving[service.id] ?? false;
          const isLumiid = config.provider === "lumiid";
          const isInterswitch = config.provider === "interswitch";
          const isMsorg = config.provider === "msorg";
          const isSmeplug = config.provider === "smeplug";
          const hasReusableCredentials =
            config.hasStoredApiKey &&
            (!isInterswitch || config.hasStoredSecretKey);
          const showCredentialEditor =
            !hasReusableCredentials || editingCredentials[service.id];

          return (
            <Card
              key={service.id}
              id={`api-config-${service.id}`}
              className="scroll-mt-24"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{service.label}</CardTitle>
                    <CardDescription>
                      {getProviderRowsForService(service.id).length} of{" "}
                      {availableProviders.length} provider(s) configured
                      {config.dbId && config.enabled && (
                        <span className="ml-2 text-xs text-green-500">
                          - {config.provider.toUpperCase()} active
                        </span>
                      )}
                      {config.dbId && !config.enabled && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {config.provider.toUpperCase()} saved
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor={`${service.id}-enabled`}
                      className="text-sm"
                    >
                      {config.enabled ? "Enabled" : "Disabled"}
                    </Label>
                    <Switch
                      id={`${service.id}-enabled`}
                      checked={config.enabled}
                      onCheckedChange={(checked) =>
                        updateConfig(service.id, "enabled", checked)
                      }
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <Select
                      value={config.provider}
                      onValueChange={(value) =>
                        updateConfig(service.id, "provider", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProviders.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {config.provider && (
                      <p className="text-xs text-muted-foreground">
                        {
                          availableProviders.find(
                            (p) => p.id === config.provider,
                          )?.description
                        }
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{isInterswitch ? "Live Base URL" : "API URL"}</Label>
                    <Input
                      type="text"
                      placeholder={
                        isMsorg
                          ? msorgEndpoints[service.id]
                          : isSmeplug
                            ? (smeplugEndpoints[service.id] ??
                              "https://smeplug.ng/api/v1")
                            : isLumiid
                              ? "https://api.lumiid.com/v1"
                              : isInterswitch
                                ? "https://api-marketplace-routing.interswitchng.com/marketplace-routing"
                                : "https://your-provider-endpoint.com/api"
                      }
                      value={config.apiUrl}
                      onChange={(e) =>
                        updateConfig(service.id, "apiUrl", e.target.value)
                      }
                      disabled={!config.enabled}
                    />
                    <p className="text-xs text-muted-foreground">
                      {isMsorg
                        ? "Published MSORG endpoint for this service. You can also use https://maskawasubapi.com/api as the base URL."
                        : isSmeplug
                          ? "Published SME Plug endpoint for this service. You can also use https://smeplug.ng/api/v1 as the base URL."
                          : isLumiid
                            ? "Use LumiID base URL (recommended: https://api.lumiid.com/v1). Full endpoint URLs are also accepted."
                            : isInterswitch
                              ? "Use the Interswitch Live Base URL from the Live Keys tab. Full identity endpoint URLs are also accepted."
                              : "Enter the endpoint URL from your reseller dashboard"}
                    </p>
                  </div>

                  {isInterswitch && (
                    <div className="space-y-2">
                      <Label>Authentication Base URL</Label>
                      <Input
                        type="text"
                        placeholder="https://passport.interswitchng.com"
                        value={config.authUrl}
                        onChange={(e) =>
                          updateConfig(service.id, "authUrl", e.target.value)
                        }
                        disabled={!config.enabled}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use the Interswitch Authentication Base URL from the
                        Live Keys tab.
                      </p>
                    </div>
                  )}
                </div>

                {!showCredentialEditor ? (
                  <div className="flex flex-col gap-3 rounded-lg border border-success/25 bg-success/5 p-4 sm:flex-row sm:items-center">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        Saved credentials will be used automatically
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isInterswitch
                          ? "Client ID and Client Secret"
                          : "API token"}
                        {config.hasStoredSecretKey && !isInterswitch
                          ? " and Secret Key"
                          : ""}{" "}
                        are securely stored for {config.provider.toUpperCase()}.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditingCredentials((prev) => ({
                          ...prev,
                          [service.id]: true,
                        }))
                      }
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Update credentials
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 rounded-lg border p-4">
                    {hasReusableCredentials && (
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                          Leave a field blank to keep its currently saved value.
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            updateConfig(service.id, "apiKey", "");
                            updateConfig(service.id, "secretKey", "");
                            setEditingCredentials((prev) => ({
                              ...prev,
                              [service.id]: false,
                            }));
                          }}
                        >
                          <X className="mr-1.5 h-3.5 w-3.5" /> Cancel
                        </Button>
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>
                          {isInterswitch ? "Client ID" : "API Token"}
                          {config.hasStoredApiKey && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              - stored
                            </span>
                          )}
                        </Label>
                        <div className="relative">
                          <Input
                            type={
                              showApiKey[`${service.id}-api`]
                                ? "text"
                                : "password"
                            }
                            placeholder={
                              config.hasStoredApiKey
                                ? "Enter a replacement value"
                                : isInterswitch
                                  ? "Enter Client ID"
                                  : "Enter API token"
                            }
                            value={config.apiKey}
                            onChange={(e) =>
                              updateConfig(service.id, "apiKey", e.target.value)
                            }
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowKey(service.id, "api")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showApiKey[`${service.id}-api`] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>
                          {isInterswitch ? "Client Secret" : "Secret Key"}
                          {config.hasStoredSecretKey && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              - stored
                            </span>
                          )}
                        </Label>
                        <div className="relative">
                          <Input
                            type={
                              showApiKey[`${service.id}-secret`]
                                ? "text"
                                : "password"
                            }
                            placeholder={
                              config.hasStoredSecretKey
                                ? "Enter a replacement value"
                                : isInterswitch
                                  ? "Enter Client Secret"
                                  : "Enter secret key (optional)"
                            }
                            value={config.secretKey}
                            onChange={(e) =>
                              updateConfig(
                                service.id,
                                "secretKey",
                                e.target.value,
                              )
                            }
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowKey(service.id, "secret")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showApiKey[`${service.id}-secret`] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => handleSave(service.id)}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save {service.label}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredServices.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No API services match the selected filters.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

