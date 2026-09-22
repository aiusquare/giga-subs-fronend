import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  RotateCcw,
  SlidersHorizontal,
  Upload,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/apiClient";
import { Badge } from "@/components/ui/badge";

interface PricingItem {
  id: string;
  service_type: string;
  api_provider: string;
  provider: string;
  plan_name: string;
  plan_code: string | null;
  plan_category: string;
  service_product_id: string | null;
  canonical_mapping_status: "resolved" | "unresolved";
  cost_price: number;
  selling_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ProviderProductMapping {
  id: string;
  provider_config_id: string;
  provider_name: string;
  provider_plan_code: string;
  cost_price: number;
  expected_margin: number;
  expected_margin_percent: number | null;
  is_active: boolean;
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
  provider_mappings: ProviderProductMapping[];
}

interface LegacyMappingReport {
  legacy_pricing_id: string;
  plan_name: string;
  api_provider: string;
  provider_plan_code: string | null;
  suggested_service_product_id: string | null;
  suggested_product_key: string | null;
  mapping_status:
    | "resolved"
    | "suggested_requires_confirmation"
    | "ambiguous"
    | "unconfirmed"
    | "unresolved";
}

type ImportMode = "upsert" | "add_only" | "update_only";

interface ImportPricingData {
  service_type: string;
  api_provider: string;
  provider: string;
  plan_name: string;
  plan_code: string;
  plan_category: string;
  cost_price: number;
  selling_price: number;
  is_active: number;
}

interface ImportPreviewRow {
  row_number: number;
  raw: Record<string, string>;
  data: ImportPricingData;
  action: "new" | "update" | "unchanged" | "skipped" | "error";
  errors: string[];
  warnings: string[];
  existing_id: string | null;
  existing: ImportPricingData | null;
}

interface ImportPreview {
  summary: {
    total: number;
    valid: number;
    invalid: number;
    new: number;
    update: number;
    unchanged: number;
    skipped: number;
  };
  rows: ImportPreviewRow[];
}

interface ImportResult {
  created: number;
  updated: number;
  unchanged: number;
  skipped: number;
}

interface ApiProviderConfig {
  id: string;
  name: string;
  service_type: string;
  is_active: boolean;
}

const serviceTypes = [
  { id: "airtime", label: "Airtime" },
  { id: "data", label: "Data" },
  { id: "electricity", label: "Electricity" },
  { id: "cable", label: "Cable TV" },
  { id: "bills", label: "Bills" },
  { id: "scratch_card", label: "Scratch Cards" },
  { id: "result_checker", label: "Exam Pins" },
  { id: "gift_cards", label: "Gift Cards" },
  { id: "virtual_cards", label: "Virtual Cards" },
  { id: "epins", label: "E-pins" },
  { id: "insurance", label: "Insurance" },
  { id: "fund_wallet", label: "Fund Wallet" },
  { id: "referrals", label: "Referrals" },
  { id: "unified_identity", label: "Unified Identity" },
  { id: "nin_verification", label: "NIN Verification" },
  { id: "nin_slip_download", label: "NIN Slip Download" },
  { id: "bvn_verification", label: "BVN Verification" },
  { id: "identity_update", label: "BVN/NIN Update Services" },
];

const providers = [
  "ADE",
  "MSORG",
  "SMEPLUG",
  "LUMIID",
  "INTERSWITCH",
  "INTERNAL",
  "MTN",
  "Airtel",
  "Glo",
  "9mobile",
  "DSTV",
  "GOtv",
  "Startimes",
  "IKEDC",
  "EKEDC",
  "AEDC",
  "KEDCO",
  "WAEC",
  "NECO",
  "NABTEB",
  "JAMB",
];

const serviceTypeLabels = Object.fromEntries(
  serviceTypes.map((service) => [service.id, service.label]),
) as Record<string, string>;

const identityUpdateTypes = [
  { id: "NIN_UPDATE", label: "NIN Update Service" },
  { id: "BVN_UPDATE", label: "BVN Update Service" },
];

function nextIdentityUpdatePlanCode(
  serviceType: string,
  pricing: PricingItem[],
  editingId?: string,
) {
  const prefix = serviceType.startsWith("BVN_") ? "B" : "N";
  const usedCodes = new Set(
    pricing
      .filter(
        (item) =>
          item.service_type === "identity_update" && item.id !== editingId,
      )
      .map((item) => item.plan_code?.toUpperCase()),
  );

  for (let number = 1; number <= 999; number += 1) {
    const code = `${prefix}${String(number).padStart(3, "0")}`;
    if (!usedCodes.has(code)) return code;
  }

  return `${prefix}999`;
}

const planCategories = [
  { id: "NORMAL", label: "Normal" },
  { id: "SME", label: "SME" },
  { id: "GIFTING", label: "Gifting" },
  { id: "CORPORATE", label: "Corporate" },
  { id: "CORPORATE2", label: "Corporate 2" },
];

const emptyForm = {
  service_type: "",
  api_provider: "",
  provider: "",
  plan_name: "",
  plan_code: "",
  plan_category: "NORMAL",
  cost_price: 0,
  selling_price: 0,
  is_active: true,
};

const csvHeaders = [
  "service_type",
  "api_provider",
  "provider",
  "plan_name",
  "plan_code",
  "plan_category",
  "cost_price",
  "selling_price",
  "is_active",
];

function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, rows: unknown[][]) {
  const content = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function AdminPricing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pricing, setPricing] = useState<PricingItem[]>([]);
  const [canonicalProducts, setCanonicalProducts] = useState<
    CanonicalProduct[]
  >([]);
  const [legacyMappingReport, setLegacyMappingReport] = useState<
    LegacyMappingReport[]
  >([]);
  const [canonicalDialogOpen, setCanonicalDialogOpen] = useState(false);
  const [mappingProduct, setMappingProduct] = useState<CanonicalProduct | null>(
    null,
  );
  const [canonicalForm, setCanonicalForm] = useState({
    product_key: "",
    service_type: "data",
    network_biller: "",
    plan_category: "SME",
    display_name: "",
    selling_price: 0,
  });
  const [mappingForm, setMappingForm] = useState({
    provider_config_id: "",
    provider_plan_code: "",
    cost_price: 0,
  });
  const [apiProviderConfigs, setApiProviderConfigs] = useState<
    ApiProviderConfig[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PricingItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterService, setFilterService] = useState(
    searchParams.get("service") || "all",
  );
  const [filterProvider, setFilterProvider] = useState(
    searchParams.get("provider") || "all",
  );
  const [filterCategory, setFilterCategory] = useState(
    searchParams.get("category") || "all",
  );
  const [filterStatus, setFilterStatus] = useState(
    searchParams.get("status") || "all",
  );
  const [filterMargin, setFilterMargin] = useState(
    searchParams.get("margin") || "all",
  );
  const [sortBy, setSortBy] = useState(
    searchParams.get("sort") || "updated_desc",
  );
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [filterApiProvider, setFilterApiProvider] = useState(
    searchParams.get("api_provider") || "all",
  );
  const [routingService, setRoutingService] = useState("data");
  const [switchingApi, setSwitchingApi] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("upsert");
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(
    null,
  );
  const [validatingImport, setValidatingImport] = useState(false);
  const [committingImport, setCommittingImport] = useState(false);

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const [prices, providerConfigs, products, mappingReport] =
        await Promise.all([
          api.get<PricingItem[]>("/admin/pricing"),
          api.get<ApiProviderConfig[]>("/admin/providers"),
          api.get<CanonicalProduct[]>("/admin/products"),
          api.get<LegacyMappingReport[]>("/admin/products/migration-report"),
        ]);
      setPricing(prices);
      setApiProviderConfigs(providerConfigs);
      setCanonicalProducts(products);
      setLegacyMappingReport(mappingReport);
    } catch (err: unknown) {
      toast.error("Failed to fetch pricing data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const createCanonicalProduct = async () => {
    if (
      !canonicalForm.product_key ||
      !canonicalForm.network_biller ||
      !canonicalForm.display_name
    ) {
      toast.error("Product key, network/biller, and display name are required");
      return;
    }
    setSaving(true);
    try {
      await api.post("/admin/products", { ...canonicalForm, is_active: true });
      setCanonicalDialogOpen(false);
      await fetchPricing();
      toast.success("Canonical customer product created");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Product creation failed",
      );
    } finally {
      setSaving(false);
    }
  };

  const createProviderMapping = async () => {
    if (
      !mappingProduct ||
      !mappingForm.provider_config_id ||
      !mappingForm.provider_plan_code
    ) {
      toast.error("Provider and provider plan code are required");
      return;
    }
    setSaving(true);
    try {
      await api.post(`/admin/products/${mappingProduct.id}/mappings`, {
        ...mappingForm,
        is_active: true,
      });
      setMappingProduct(null);
      await fetchPricing();
      toast.success("Provider mapping created");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Mapping creation failed",
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmLegacyLink = async (row: LegacyMappingReport) => {
    if (!row.suggested_service_product_id) return;
    setSaving(true);
    try {
      await api.post(
        `/admin/products/${row.suggested_service_product_id}/legacy-links`,
        {
          legacy_pricing_id: row.legacy_pricing_id,
          confirm: true,
        },
      );
      await fetchPricing();
      toast.success(`${row.plan_name} linked to ${row.suggested_product_key}`);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Legacy link failed",
      );
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    if (filterService !== "all") params.set("service", filterService);
    if (filterApiProvider !== "all")
      params.set("api_provider", filterApiProvider);
    if (filterProvider !== "all") params.set("provider", filterProvider);
    if (filterCategory !== "all") params.set("category", filterCategory);
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (filterMargin !== "all") params.set("margin", filterMargin);
    if (sortBy !== "updated_desc") params.set("sort", sortBy);
    setSearchParams(params, { replace: true });
  }, [
    searchTerm,
    filterService,
    filterApiProvider,
    filterProvider,
    filterCategory,
    filterStatus,
    filterMargin,
    sortBy,
    setSearchParams,
  ]);

  const openAddDialog = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (item: PricingItem) => {
    setEditingItem(item);
    setForm({
      service_type: item.service_type,
      api_provider: item.api_provider,
      provider: item.provider,
      plan_name: item.plan_name,
      plan_code:
        item.service_type === "identity_update"
          ? item.plan_code?.startsWith("BVN_")
            ? "BVN_UPDATE"
            : "NIN_UPDATE"
          : item.plan_code || "",
      plan_category: item.plan_category || "NORMAL",
      cost_price: item.cost_price,
      selling_price: item.selling_price,
      is_active: item.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const isIdentityUpdate = form.service_type === "identity_update";

    if (
      !form.service_type ||
      !form.plan_name ||
      (isIdentityUpdate
        ? !form.plan_code || form.cost_price <= 0 || form.selling_price <= 0
        : !form.api_provider || !form.provider)
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (form.selling_price < form.cost_price) {
      toast.error(
        "Selling price should be greater than or equal to cost price",
      );
      return;
    }

    setSaving(true);

    const identityPlanCode = isIdentityUpdate
      ? editingItem?.plan_code?.match(/^[NB]\d{3}$/i)
        ? editingItem.plan_code.toUpperCase()
        : nextIdentityUpdatePlanCode(form.plan_code, pricing, editingItem?.id)
      : null;
    const existingIdentityItem =
      !editingItem && identityPlanCode
        ? pricing.find(
            (item) =>
              item.service_type === "identity_update" &&
              item.plan_code === identityPlanCode,
          )
        : null;

    const payload = {
      service_type: form.service_type,
      api_provider: isIdentityUpdate ? "INTERNAL" : form.api_provider,
      provider: isIdentityUpdate ? "INTERNAL" : form.provider,
      plan_name: form.plan_name,
      plan_code: isIdentityUpdate ? identityPlanCode : form.plan_code || null,
      plan_category: isIdentityUpdate ? "NORMAL" : form.plan_category,
      cost_price: form.cost_price,
      selling_price: form.selling_price,
      is_active: form.is_active,
    };

    try {
      if (editingItem || existingIdentityItem) {
        await api.put(
          `/admin/pricing/${(editingItem || existingIdentityItem)?.id}`,
          payload,
        );
        toast.success("Pricing updated successfully");
      } else {
        await api.post("/admin/pricing", payload);
        toast.success("Pricing added successfully");
      }
      setDialogOpen(false);
      fetchPricing();
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError && err.errors
          ? Object.values(err.errors).join(", ")
          : err instanceof Error
            ? err.message
            : "";
      toast.error(msg || "Failed to save pricing");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pricing entry?")) return;

    try {
      await api.del(`/admin/pricing/${id}`);
      toast.success("Pricing deleted successfully");
      fetchPricing();
    } catch {
      toast.error("Failed to delete pricing");
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await api.put(`/admin/pricing/${id}`, { is_active: !currentStatus });
      fetchPricing();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const getProfit = (cost: number, selling: number) => {
    const profit = selling - cost;
    const margin = cost > 0 ? ((profit / cost) * 100).toFixed(1) : "0";
    return { profit, margin };
  };

  const availableProviders = useMemo(
    () =>
      Array.from(
        new Set(
          pricing
            .filter(
              (item) =>
                filterService === "all" || item.service_type === filterService,
            )
            .map((item) => item.provider),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [pricing, filterService],
  );

  const availableApiProviders = useMemo(
    () =>
      Array.from(
        new Set(
          pricing
            .filter(
              (item) =>
                filterService === "all" || item.service_type === filterService,
            )
            .map((item) => item.api_provider),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [pricing, filterService],
  );

  const availableCategories = useMemo(
    () =>
      Array.from(
        new Set(pricing.map((item) => item.plan_category || "NORMAL")),
      ).sort(),
    [pricing],
  );

  const filteredPricing = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filtered = pricing.filter((item) => {
      const profit = item.selling_price - item.cost_price;
      const margin = item.cost_price > 0 ? (profit / item.cost_price) * 100 : 0;
      const matchesSearch =
        !query ||
        item.plan_name.toLowerCase().includes(query) ||
        item.api_provider.toLowerCase().includes(query) ||
        item.provider.toLowerCase().includes(query) ||
        item.plan_code?.toLowerCase().includes(query);
      const matchesService =
        filterService === "all" || item.service_type === filterService;
      const matchesProvider =
        filterProvider === "all" || item.provider === filterProvider;
      const matchesApiProvider =
        filterApiProvider === "all" || item.api_provider === filterApiProvider;
      const matchesCategory =
        filterCategory === "all" ||
        (item.plan_category || "NORMAL") === filterCategory;
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" ? item.is_active : !item.is_active);
      const matchesMargin =
        filterMargin === "all" ||
        (filterMargin === "loss" && profit < 0) ||
        (filterMargin === "zero" && profit === 0) ||
        (filterMargin === "low" && profit > 0 && margin < 5) ||
        (filterMargin === "medium" && margin >= 5 && margin < 10) ||
        (filterMargin === "high" && margin >= 10);

      return (
        matchesSearch &&
        matchesService &&
        matchesApiProvider &&
        matchesProvider &&
        matchesCategory &&
        matchesStatus &&
        matchesMargin
      );
    });

    return filtered.sort((a, b) => {
      const profitA = a.selling_price - a.cost_price;
      const profitB = b.selling_price - b.cost_price;
      const marginA = a.cost_price > 0 ? profitA / a.cost_price : 0;
      const marginB = b.cost_price > 0 ? profitB / b.cost_price : 0;

      switch (sortBy) {
        case "provider_asc":
          return (
            a.provider.localeCompare(b.provider) ||
            a.plan_name.localeCompare(b.plan_name)
          );
        case "price_asc":
          return a.selling_price - b.selling_price;
        case "price_desc":
          return b.selling_price - a.selling_price;
        case "profit_asc":
          return profitA - profitB;
        case "profit_desc":
          return profitB - profitA;
        case "margin_asc":
          return marginA - marginB;
        case "margin_desc":
          return marginB - marginA;
        default:
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
      }
    });
  }, [
    pricing,
    searchTerm,
    filterService,
    filterApiProvider,
    filterProvider,
    filterCategory,
    filterStatus,
    filterMargin,
    sortBy,
  ]);

  const activeFilterCount = [
    searchTerm.trim(),
    filterService !== "all",
    filterApiProvider !== "all",
    filterProvider !== "all",
    filterCategory !== "all",
    filterStatus !== "all",
    filterMargin !== "all",
  ].filter(Boolean).length;

  const handleServiceFilter = (value: string) => {
    setFilterService(value);
    if (
      filterApiProvider !== "all" &&
      !pricing.some(
        (item) =>
          (value === "all" || item.service_type === value) &&
          item.api_provider === filterApiProvider,
      )
    ) {
      setFilterApiProvider("all");
    }
    if (
      filterProvider !== "all" &&
      !pricing.some(
        (item) =>
          (value === "all" || item.service_type === value) &&
          item.provider === filterProvider,
      )
    ) {
      setFilterProvider("all");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterService("all");
    setFilterApiProvider("all");
    setFilterProvider("all");
    setFilterCategory("all");
    setFilterStatus("all");
    setFilterMargin("all");
    setSortBy("updated_desc");
  };

  const downloadTemplate = () => {
    downloadCsv("pricing-import-template.csv", [
      csvHeaders,
      [
        "data",
        "ADE",
        "MTN",
        "1GB Monthly",
        "MTN-1GB-MONTHLY",
        "SME",
        280,
        300,
        "true",
      ],
      [
        "data",
        "MSORG",
        "MTN",
        "1GB Monthly",
        "MTN-1GB",
        "SME",
        275,
        295,
        "true",
      ],
    ]);
  };

  const exportPricing = () => {
    downloadCsv("service-pricing.csv", [
      csvHeaders,
      ...pricing.map((item) => [
        item.service_type,
        item.api_provider,
        item.provider,
        item.plan_name,
        item.plan_code || "",
        item.plan_category || "NORMAL",
        item.cost_price,
        item.selling_price,
        item.is_active ? "true" : "false",
      ]),
    ]);
  };

  const openBulkUpload = () => {
    setBulkFile(null);
    setImportMode("upsert");
    setImportPreview(null);
    setBulkOpen(true);
  };

  const validateImport = async () => {
    if (!bulkFile) {
      toast.error("Select a CSV pricelist first");
      return;
    }

    setValidatingImport(true);
    try {
      const formData = new FormData();
      formData.append("file", bulkFile);
      formData.append("mode", importMode);
      const preview = await api.upload<ImportPreview>(
        "/admin/pricing/import/validate",
        formData,
      );
      setImportPreview(preview);
      toast.success("Pricelist validated");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Validation failed");
    } finally {
      setValidatingImport(false);
    }
  };

  const commitImport = async () => {
    if (!importPreview) return;
    const validRows = importPreview.rows
      .filter((row) => row.action !== "error")
      .map((row) => row.data);

    if (!validRows.length) {
      toast.error("There are no valid rows to import");
      return;
    }

    setCommittingImport(true);
    try {
      const result = await api.post<ImportResult>(
        "/admin/pricing/import/commit",
        { mode: importMode, rows: validRows },
      );
      toast.success(
        `Import complete: ${result.created} created, ${result.updated} updated`,
      );
      setBulkOpen(false);
      await fetchPricing();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    } finally {
      setCommittingImport(false);
    }
  };

  const downloadRejectedRows = () => {
    if (!importPreview) return;
    const rejected = importPreview.rows.filter((row) => row.action === "error");
    downloadCsv("pricing-import-errors.csv", [
      [...csvHeaders, "errors"],
      ...rejected.map((row) => [
        row.raw.service_type,
        row.raw.api_provider,
        row.raw.provider,
        row.raw.plan_name,
        row.raw.plan_code,
        row.raw.plan_category,
        row.raw.cost_price,
        row.raw.selling_price,
        row.raw.is_active,
        row.errors.join("; "),
      ]),
    ]);
  };

  const switchActiveApi = async (providerId: string) => {
    const selected = apiProviderConfigs.find((item) => item.id === providerId);
    if (!selected || selected.is_active) return;

    setSwitchingApi(true);
    try {
      await api.post(`/admin/providers/${providerId}/toggle`);
      await fetchPricing();
      toast.success(
        `${selected.name} is now the active API for ${serviceTypeLabels[selected.service_type] || selected.service_type}`,
      );
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "API switch failed");
    } finally {
      setSwitchingApi(false);
    }
  };

  const routingProviders = apiProviderConfigs.filter(
    (item) => item.service_type === routingService,
  );
  const activeRoutingProvider = routingProviders.find((item) => item.is_active);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Service Pricing
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage prices for all VTU services
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Template
          </Button>
          <Button
            variant="outline"
            onClick={exportPricing}
            className="gap-2"
            disabled={!pricing.length}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={openBulkUpload} className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Pricelist
          </Button>
          <Button onClick={openAddDialog} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Pricing
          </Button>
        </div>
      </div>

      <Card className="border-primary/20">
        <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-end">
          <div className="flex-1">
            <p className="text-sm font-semibold">
              Legacy current production routing
            </p>
            <p className="text-xs text-muted-foreground">
              This selector remains for the existing production path only. The
              new Routing &amp; Failover interface is shadow-only and does not
              execute purchases.
            </p>
          </div>
          <div className="grid w-full max-w-[520px] gap-3 sm:grid-cols-2 lg:shrink-0">
            <div className="space-y-1.5">
              <Label>Service</Label>
              <Select value={routingService} onValueChange={setRoutingService}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Active API</Label>
              <Select
                value={activeRoutingProvider?.id}
                onValueChange={switchActiveApi}
                disabled={!routingProviders.length || switchingApi}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      routingProviders.length
                        ? "Select active API"
                        : "No API configured"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {routingProviders.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                      {provider.is_active ? " · Active" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {switchingApi && (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">
              Canonical Customer Products
            </CardTitle>
            <CardDescription>
              Customer prices are fixed here. Each provider mapping owns only
              its upstream code and cost.{" "}
              {
                legacyMappingReport.filter(
                  (row) => row.mapping_status === "unresolved",
                ).length
              }{" "}
              legacy rows remain unresolved
              {legacyMappingReport.some(
                (row) => row.mapping_status === "ambiguous",
              )
                ? "; ambiguous rows require explicit confirmation"
                : ""}
              .
            </CardDescription>
          </div>
          <Button
            size="sm"
            className="shrink-0 gap-2"
            onClick={() => setCanonicalDialogOpen(true)}
          >
            <Plus className="h-4 w-4" /> Customer Product
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : canonicalProducts.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No canonical products have been created. Legacy pricing remains
              purchasable until rows are explicitly linked.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Product</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Network / Biller</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Selling Price</TableHead>
                    <TableHead>Provider Mappings</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {canonicalProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="font-medium">
                          {product.display_name}
                        </div>
                        <code className="text-xs text-muted-foreground">
                          {product.product_key}
                        </code>
                      </TableCell>
                      <TableCell className="capitalize">
                        {serviceTypeLabels[product.service_type] ||
                          product.service_type.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell>{product.network_biller}</TableCell>
                      <TableCell>{product.plan_category}</TableCell>
                      <TableCell className="text-right font-medium">
                        ₦{product.selling_price.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-[280px] flex-wrap items-center gap-1.5">
                          {product.provider_mappings.length === 0 ? (
                            <Badge variant="destructive">Missing mapping</Badge>
                          ) : (
                            product.provider_mappings.map((mapping) => (
                              <Badge
                                key={mapping.id}
                                variant={
                                  mapping.is_active ? "secondary" : "outline"
                                }
                                className={
                                  !mapping.is_active ? "opacity-60" : ""
                                }
                              >
                                {mapping.provider_name} →{" "}
                                {mapping.provider_plan_code} · ₦
                                {mapping.cost_price.toLocaleString()} · margin ₦
                                {mapping.expected_margin.toLocaleString()}
                                {!mapping.is_active ? " · inactive" : ""}
                              </Badge>
                            ))
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                              setMappingProduct(product);
                              setMappingForm({
                                provider_config_id: "",
                                provider_plan_code: "",
                                cost_price: 0,
                              });
                            }}
                          >
                            <Plus className="mr-1 h-3 w-3" /> Mapping
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={product.is_active ? "default" : "outline"}
                        >
                          {product.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {legacyMappingReport.some(
            (row) => row.mapping_status === "suggested_requires_confirmation",
          ) && (
            <div className="mt-5 space-y-2 border-t pt-4">
              <p className="text-sm font-medium">
                Exact legacy link suggestions
              </p>
              <p className="text-xs text-muted-foreground">
                These match service, network/biller, category, and price
                exactly. Each still requires explicit confirmation.
              </p>
              {legacyMappingReport
                .filter(
                  (row) =>
                    row.mapping_status === "suggested_requires_confirmation",
                )
                .slice(0, 10)
                .map((row) => (
                  <div
                    key={row.legacy_pricing_id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm"
                  >
                    <span>
                      {row.plan_name}{" "}
                      <span className="text-muted-foreground">
                        ({row.api_provider}:{" "}
                        {row.provider_plan_code || "no code"})
                      </span>
                      {" → "}
                      <code>{row.suggested_product_key}</code>
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={saving}
                      onClick={() => confirmLegacyLink(row)}
                    >
                      Confirm link
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={canonicalDialogOpen} onOpenChange={setCanonicalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Customer Product</DialogTitle>
            <DialogDescription>
              The selling price is customer-facing and remains constant across
              provider mappings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Stable product key</Label>
              <Input
                value={canonicalForm.product_key}
                placeholder="DATA_MTN_SME_1GB"
                onChange={(e) =>
                  setCanonicalForm({
                    ...canonicalForm,
                    product_key: e.target.value.toUpperCase(),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Service</Label>
              <Select
                value={canonicalForm.service_type}
                onValueChange={(value) =>
                  setCanonicalForm({ ...canonicalForm, service_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Network / Biller</Label>
              <Input
                value={canonicalForm.network_biller}
                onChange={(e) =>
                  setCanonicalForm({
                    ...canonicalForm,
                    network_biller: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={canonicalForm.plan_category}
                onValueChange={(value) =>
                  setCanonicalForm({ ...canonicalForm, plan_category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {planCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Selling price</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={canonicalForm.selling_price || ""}
                onChange={(e) =>
                  setCanonicalForm({
                    ...canonicalForm,
                    selling_price: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Display name</Label>
              <Input
                value={canonicalForm.display_name}
                placeholder="MTN 1GB SME"
                onChange={(e) =>
                  setCanonicalForm({
                    ...canonicalForm,
                    display_name: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCanonicalDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button disabled={saving} onClick={createCanonicalProduct}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={mappingProduct !== null}
        onOpenChange={(open) => !open && setMappingProduct(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Provider Mapping</DialogTitle>
            <DialogDescription>
              {mappingProduct?.display_name}: enter only the selected provider's
              exact upstream code and cost.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={mappingForm.provider_config_id}
                onValueChange={(value) =>
                  setMappingForm({ ...mappingForm, provider_config_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select configured provider" />
                </SelectTrigger>
                <SelectContent>
                  {apiProviderConfigs
                    .filter(
                      (config) =>
                        config.service_type === mappingProduct?.service_type &&
                        !mappingProduct?.provider_mappings.some(
                          (mapping) => mapping.provider_config_id === config.id,
                        ),
                    )
                    .map((config) => (
                      <SelectItem key={config.id} value={config.id}>
                        {config.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Provider plan code</Label>
              <Input
                value={mappingForm.provider_plan_code}
                onChange={(e) =>
                  setMappingForm({
                    ...mappingForm,
                    provider_plan_code: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Provider cost</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={mappingForm.cost_price || ""}
                onChange={(e) =>
                  setMappingForm({
                    ...mappingForm,
                    cost_price: Number(e.target.value),
                  })
                }
              />
            </div>
            {mappingProduct && (
              <p className="text-sm text-muted-foreground">
                Expected margin: ₦
                {(
                  mappingProduct.selling_price - mappingForm.cost_price
                ).toLocaleString()}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMappingProduct(null)}>
              Cancel
            </Button>
            <Button disabled={saving} onClick={createProviderMapping}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create mapping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
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
              disabled={activeFilterCount === 0 && sortBy === "updated_desc"}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Clear
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="sm:col-span-2 xl:col-span-2">
              <Input
                placeholder="Search plan name, code, or provider..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterService} onValueChange={handleServiceFilter}>
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

            <Select
              value={filterApiProvider}
              onValueChange={setFilterApiProvider}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by API" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All APIs</SelectItem>
                {availableApiProviders.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterProvider} onValueChange={setFilterProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                {availableProviders.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {availableCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {planCategories.find((item) => item.id === category)
                      ?.label || category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterMargin} onValueChange={setFilterMargin}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by margin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Margins</SelectItem>
                <SelectItem value="loss">Loss-making</SelectItem>
                <SelectItem value="zero">Zero margin</SelectItem>
                <SelectItem value="low">Below 5%</SelectItem>
                <SelectItem value="medium">5% to 10%</SelectItem>
                <SelectItem value="high">10% and above</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort pricing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated_desc">Recently updated</SelectItem>
                <SelectItem value="provider_asc">Provider A–Z</SelectItem>
                <SelectItem value="price_asc">Price: low to high</SelectItem>
                <SelectItem value="price_desc">Price: high to low</SelectItem>
                <SelectItem value="profit_asc">Profit: low to high</SelectItem>
                <SelectItem value="profit_desc">Profit: high to low</SelectItem>
                <SelectItem value="margin_asc">Margin: low to high</SelectItem>
                <SelectItem value="margin_desc">Margin: high to low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pricing List</CardTitle>
          <CardDescription>
            Showing {filteredPricing.length} of {pricing.length} pricing entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPricing.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pricing entries found. Click "Add Pricing" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>API</TableHead>
                    <TableHead>Network / Biller</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Canonical</TableHead>
                    <TableHead className="text-right">Cost (₦)</TableHead>
                    <TableHead className="text-right">Price (₦)</TableHead>
                    <TableHead className="text-right">Profit (₦)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPricing.map((item) => {
                    const { profit, margin } = getProfit(
                      item.cost_price,
                      item.selling_price,
                    );
                    const isActiveApi = apiProviderConfigs.some(
                      (config) =>
                        config.service_type === item.service_type &&
                        config.name.toLowerCase() ===
                          item.api_provider.toLowerCase() &&
                        config.is_active,
                    );
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="capitalize">
                          {serviceTypeLabels[item.service_type] ||
                            item.service_type.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isActiveApi ? "default" : "outline"}>
                            {item.api_provider}
                            {isActiveApi ? " · Live" : ""}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.provider}</TableCell>
                        <TableCell className="font-medium">
                          {item.plan_name}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                            {item.plan_category || "NORMAL"}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.plan_code || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.service_product_id ? "secondary" : "outline"
                            }
                          >
                            {item.service_product_id ? "Linked" : "Legacy"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.cost_price.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.selling_price.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              profit >= 0
                                ? "text-green-600"
                                : "text-destructive"
                            }
                          >
                            {profit.toLocaleString()} ({margin}%)
                          </span>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={item.is_active}
                            onCheckedChange={() =>
                              toggleActive(item.id, item.is_active)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(item)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(item.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Pricing" : "Add New Pricing"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Update the pricing details below"
                : "Fill in the details to add a new pricing entry"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Service Type *</Label>
              <Select
                value={form.service_type}
                onValueChange={(value) => {
                  const apiStillValid = apiProviderConfigs.some(
                    (config) =>
                      config.service_type === value &&
                      config.name === form.api_provider,
                  );
                  setForm({
                    ...form,
                    service_type: value,
                    api_provider: apiStillValid ? form.api_provider : "",
                    plan_code:
                      value === "identity_update" ? "" : form.plan_code,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.service_type === "identity_update" ? (
              <>
                <div className="space-y-2">
                  <Label>Service *</Label>
                  <Select
                    value={form.plan_code}
                    onValueChange={(value) =>
                      setForm({ ...form, plan_code: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select NIN or BVN service" />
                    </SelectTrigger>
                    <SelectContent>
                      {identityUpdateTypes.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Update Request Name *</Label>
                  <Input
                    placeholder="e.g., Change of name"
                    value={form.plan_name}
                    onChange={(e) =>
                      setForm({ ...form, plan_name: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Cost Price (₦) *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g., 1000"
                      value={form.cost_price || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          cost_price: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Selling Price (₦) *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g., 1500"
                      value={form.selling_price || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          selling_price: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                {form.cost_price > 0 && form.selling_price > 0 && (
                  <div className="rounded-lg bg-muted p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Profit:</span>
                      <span
                        className={
                          form.selling_price - form.cost_price >= 0
                            ? "font-medium text-green-600"
                            : "font-medium text-destructive"
                        }
                      >
                        ₦
                        {(
                          form.selling_price - form.cost_price
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="space-y-2">
                    <Label>API Provider *</Label>
                    <Select
                      value={form.api_provider}
                      onValueChange={(value) =>
                        setForm({ ...form, api_provider: value })
                      }
                      disabled={!form.service_type}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select API" />
                      </SelectTrigger>
                      <SelectContent>
                        {apiProviderConfigs
                          .filter(
                            (config) =>
                              config.service_type === form.service_type,
                          )
                          .map((config) => (
                            <SelectItem key={config.id} value={config.name}>
                              {config.name}
                              {config.is_active ? " · Active" : ""}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Network / Biller *</Label>
                  <Select
                    value={form.provider}
                    onValueChange={(value) =>
                      setForm({ ...form, provider: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select network or biller" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider} value={provider}>
                          {provider}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Plan Name *</Label>
                    <Input
                      placeholder="e.g., 1GB Monthly"
                      value={form.plan_name}
                      onChange={(e) =>
                        setForm({ ...form, plan_name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Plan Code</Label>
                    <Input
                      placeholder="e.g., MTN-1GB"
                      value={form.plan_code}
                      onChange={(e) =>
                        setForm({ ...form, plan_code: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Plan Category</Label>
                  <Select
                    value={form.plan_category}
                    onValueChange={(value) =>
                      setForm({ ...form, plan_category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {planCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Cost Price (₦) *</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={form.cost_price}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          cost_price: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Selling Price (₦) *</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={form.selling_price}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          selling_price: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                {form.service_type !== "identity_update" &&
                  form.cost_price > 0 &&
                  form.selling_price > 0 && (
                    <div className="p-3 rounded-lg bg-muted">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Profit:</span>
                        <span
                          className={
                            form.selling_price - form.cost_price >= 0
                              ? "text-green-600 font-medium"
                              : "text-destructive font-medium"
                          }
                        >
                          ₦
                          {(
                            form.selling_price - form.cost_price
                          ).toLocaleString()}
                          (
                          {form.cost_price > 0
                            ? (
                                ((form.selling_price - form.cost_price) /
                                  form.cost_price) *
                                100
                              ).toFixed(1)
                            : 0}
                          %)
                        </span>
                      </div>
                    </div>
                  )}
              </>
            )}

            {form.service_type !== "identity_update" && (
              <div className="flex items-center justify-between">
                <Label htmlFor="is-active">Active</Label>
                <Switch
                  id="is-active"
                  checked={form.is_active}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, is_active: checked })
                  }
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingItem ? "Update" : "Add"} Pricing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk pricelist upload */}
      <Dialog
        open={bulkOpen}
        onOpenChange={(open) => {
          if (!committingImport) setBulkOpen(open);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Upload Pricelist
            </DialogTitle>
            <DialogDescription>
              Upload a CSV, review every proposed change, then commit valid rows
              in one transaction. Existing plans are matched by service,
              provider, and plan code.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 md:grid-cols-[1fr_260px]">
            <div className="space-y-2">
              <Label htmlFor="pricing-csv">CSV pricelist</Label>
              <Input
                id="pricing-csv"
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  setBulkFile(event.target.files?.[0] || null);
                  setImportPreview(null);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Maximum 2 MB and 1,000 rows. Include api_provider (ADE, MSORG,
                etc.); older CSVs infer the currently active API.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Import behavior</Label>
              <Select
                value={importMode}
                onValueChange={(value: ImportMode) => {
                  setImportMode(value);
                  setImportPreview(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upsert">
                    Add new and update existing
                  </SelectItem>
                  <SelectItem value="add_only">Add new only</SelectItem>
                  <SelectItem value="update_only">
                    Update existing only
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {bulkFile && !importPreview && (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{bulkFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(bulkFile.size / 1024).toFixed(1)} KB · ready to validate
                </p>
              </div>
            </div>
          )}

          {importPreview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                {[
                  ["Rows", importPreview.summary.total],
                  ["New", importPreview.summary.new],
                  ["Updates", importPreview.summary.update],
                  ["Unchanged", importPreview.summary.unchanged],
                  ["Skipped", importPreview.summary.skipped],
                  ["Valid", importPreview.summary.valid],
                  ["Invalid", importPreview.summary.invalid],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="rounded-lg border bg-card p-3"
                  >
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p
                      className={
                        label === "Invalid" && Number(value) > 0
                          ? "text-xl font-bold text-destructive"
                          : "text-xl font-bold"
                      }
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {importPreview.summary.invalid > 0 && (
                <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <p>
                    Invalid rows will not be imported. Download them below,
                    correct the CSV, and upload again if those plans are needed.
                  </p>
                </div>
              )}

              <div className="max-h-[380px] overflow-auto rounded-lg border">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background">
                    <TableRow>
                      <TableHead className="w-14">Row</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>API / Network</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead>Validation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importPreview.rows.slice(0, 200).map((row) => (
                      <TableRow key={`${row.row_number}-${row.data.plan_code}`}>
                        <TableCell className="text-muted-foreground">
                          {row.row_number}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              row.action === "error"
                                ? "destructive"
                                : row.action === "new"
                                  ? "default"
                                  : row.action === "unchanged" ||
                                      row.action === "skipped"
                                    ? "outline"
                                    : "secondary"
                            }
                            className="capitalize"
                          >
                            {row.action === "error" ? "Invalid" : row.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">
                            {row.data.plan_name || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {row.data.service_type || "Unknown"} ·{" "}
                            {row.data.plan_code || "No code"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">
                            {row.data.api_provider || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {row.data.provider || "—"}
                          </p>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {row.existing && row.action === "update" && (
                            <span className="mr-1 text-xs text-muted-foreground line-through">
                              ₦{row.existing.cost_price.toLocaleString()}
                            </span>
                          )}
                          ₦{row.data.cost_price.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {row.existing && row.action === "update" && (
                            <span className="mr-1 text-xs text-muted-foreground line-through">
                              ₦{row.existing.selling_price.toLocaleString()}
                            </span>
                          )}
                          ₦{row.data.selling_price.toLocaleString()}
                        </TableCell>
                        <TableCell className="max-w-[280px]">
                          {row.errors.map((message) => (
                            <p
                              key={message}
                              className="flex items-start gap-1 text-xs text-destructive"
                            >
                              <XCircle className="mt-0.5 h-3 w-3 shrink-0" />
                              {message}
                            </p>
                          ))}
                          {row.warnings.map((message) => (
                            <p
                              key={message}
                              className="flex items-start gap-1 text-xs text-warning"
                            >
                              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                              {message}
                            </p>
                          ))}
                          {!row.errors.length && !row.warnings.length && (
                            <span className="flex items-center gap-1 text-xs text-success">
                              <CheckCircle2 className="h-3 w-3" /> Ready
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {importPreview.rows.length > 200 && (
                <p className="text-center text-xs text-muted-foreground">
                  Showing the first 200 of {importPreview.rows.length} preview
                  rows.
                </p>
              )}
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" /> Template
              </Button>
              {importPreview && importPreview.summary.invalid > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadRejectedRows}
                >
                  <Download className="mr-2 h-4 w-4" /> Rejected rows
                </Button>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBulkOpen(false)}
                disabled={committingImport}
              >
                Cancel
              </Button>
              {!importPreview ? (
                <Button
                  type="button"
                  onClick={validateImport}
                  disabled={!bulkFile || validatingImport}
                >
                  {validatingImport && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Validate and preview
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={validateImport}
                    disabled={validatingImport || committingImport}
                  >
                    {validatingImport && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Validate again
                  </Button>
                  <Button
                    type="button"
                    onClick={commitImport}
                    disabled={
                      committingImport ||
                      importPreview.summary.new +
                        importPreview.summary.update ===
                        0
                    }
                  >
                    {committingImport && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Import{" "}
                    {importPreview.summary.new + importPreview.summary.update}{" "}
                    changes
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
