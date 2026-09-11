import { useState, useEffect } from "react";
import {
  Save,
  Plus,
  Trash2,
  Loader2,
  ToggleLeft,
  ToggleRight,
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { api } from "@/lib/apiClient";

interface PricingTier {
  id: string;
  tier_name: string;
  min_balance: number;
  discount_percent: number;
  is_active: boolean;
  display_order: number | null;
}

interface ServiceAccess {
  id: string;
  service_type: string;
  is_enabled: boolean;
}

export function AdminApiReseller() {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [serviceAccess, setServiceAccess] = useState<ServiceAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingServiceId, setTogglingServiceId] = useState<string | null>(null);
  const [newTier, setNewTier] = useState({
    tier_name: "",
    min_balance: "",
    discount_percent: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tiersRes, accessRes] = await Promise.all([
        api.get("/admin/api-tiers"),
        api.get("/admin/api-access"),
      ]);
      setTiers(tiersRes.tiers ?? []);
      setServiceAccess(accessRes.service_access ?? []);
    } catch {
      toast.error("Failed to load API reseller data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTier = async () => {
    if (
      !newTier.tier_name ||
      !newTier.min_balance ||
      !newTier.discount_percent
    ) {
      toast.error("Please fill all tier fields");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/admin/api-tiers", {
        tier_name: newTier.tier_name,
        min_balance: Number(newTier.min_balance),
        discount_percent: Number(newTier.discount_percent),
        display_order: tiers.length + 1,
      });
      toast.success("Tier added");
      setNewTier({ tier_name: "", min_balance: "", discount_percent: "" });
      setTiers((prev) => [...prev, res.tier]);
    } catch {
      toast.error("Failed to add tier");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTier = async (id: string) => {
    try {
      await api.del(`/admin/api-tiers/${id}`);
      toast.success("Tier deleted");
      setTiers((prev) => prev.filter((t) => t.id !== id));
    } catch {
      toast.error("Failed to delete tier");
    }
  };

  const handleToggleTier = async (id: string, currentActive: boolean) => {
    try {
      await api.put(`/admin/api-tiers/${id}`, { is_active: !currentActive });
      setTiers((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, is_active: !currentActive } : t,
        ),
      );
    } catch {
      toast.error("Failed to update tier");
    }
  };

  const handleToggleService = async (id: string, currentEnabled: boolean) => {
    setTogglingServiceId(id);
    try {
      await api.put("/admin/api-access", { id, is_enabled: !currentEnabled });
      setServiceAccess((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, is_enabled: !currentEnabled } : s,
        ),
      );
      toast.success(`${currentEnabled ? "Disabled" : "Enabled"} API access`);
    } catch {
      toast.error("Failed to update service access");
    } finally {
      setTogglingServiceId(null);
    }
  };

  const serviceLabels: Record<string, string> = {
    airtime: "Airtime",
    data: "Data",
    electricity: "Electricity",
    cable: "Cable TV",
    scratch_card: "Scratch Cards",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          API Reseller Management
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage pricing tiers and control which services are available via API
        </p>
      </div>

      <Tabs defaultValue="tiers">
        <TabsList>
          <TabsTrigger value="tiers">Pricing Tiers</TabsTrigger>
          <TabsTrigger value="services">Service Access</TabsTrigger>
        </TabsList>

        <TabsContent value="tiers" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Add New Tier</CardTitle>
              <CardDescription>
                Create a new discount tier for API resellers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Tier Name</Label>
                  <Input
                    placeholder="e.g. Diamond"
                    value={newTier.tier_name}
                    onChange={(e) =>
                      setNewTier((p) => ({ ...p, tier_name: e.target.value }))
                    }
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Min Balance (₦)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 1000000"
                    value={newTier.min_balance}
                    onChange={(e) =>
                      setNewTier((p) => ({ ...p, min_balance: e.target.value }))
                    }
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Discount (%)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 15"
                    value={newTier.discount_percent}
                    onChange={(e) =>
                      setNewTier((p) => ({
                        ...p,
                        discount_percent: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleAddTier}
                    disabled={saving}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Current Tiers</CardTitle>
              <CardDescription>
                {tiers.length} tier(s) configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={tier.is_active}
                        onCheckedChange={() =>
                          handleToggleTier(tier.id, tier.is_active)
                        }
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {tier.tier_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Min ₦{tier.min_balance.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={tier.is_active ? "default" : "secondary"}>
                        {tier.discount_percent}% off
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTier(tier.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {tiers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No tiers configured
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">API Service Access</CardTitle>
              <CardDescription>
                Control which services are available to API resellers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {serviceAccess.map((service) => {
                  const isToggling = togglingServiceId === service.id;
                  return (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      {service.is_enabled ? (
                        <ToggleRight className="w-5 h-5 text-primary" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {serviceLabels[service.service_type] ||
                            service.service_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isToggling
                            ? (service.is_enabled ? "Disabling…" : "Enabling…")
                            : service.is_enabled
                            ? "Available via API"
                            : "Not available via API"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isToggling && (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                      <Switch
                        checked={service.is_enabled}
                        disabled={isToggling}
                        onCheckedChange={() =>
                          handleToggleService(service.id, service.is_enabled)
                        }
                      />
                    </div>
                  </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
