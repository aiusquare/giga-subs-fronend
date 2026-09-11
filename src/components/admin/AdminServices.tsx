import { useState, useEffect } from "react";
import { api } from "@/lib/apiClient";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Wifi,
  Phone,
  Zap,
  Tv,
  Receipt,
  Gamepad2,
  CreditCard,
  Package,
  Loader2,
  GraduationCap,
  Gift,
  BookOpen,
  Shield,
  Wallet,
  Users,
  HelpCircle,
  Key,
  Landmark,
  FileText,
  IdCard,
  Fingerprint,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wifi,
  Phone,
  Zap,
  Tv,
  Receipt,
  Gamepad2,
  CreditCard,
  Package,
  GraduationCap,
  Gift,
  BookOpen,
  Shield,
  Wallet,
  Users,
  HelpCircle,
  Key,
  Landmark,
  FileText,
  IdCard,
  Fingerprint,
};

interface Service {
  id: string;
  service_type: string;
  display_name: string;
  description: string | null;
  icon_name: string | null;
  is_active: boolean;
  display_order: number | null;
}

export function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchServices = async () => {
    try {
      const data = await api.get<Service[]>("/admin/services");
      setServices(data);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const toggleService = async (id: string, currentState: boolean) => {
    setToggling(id);
    try {
      const updated = await api.post<Service>(`/admin/services/${id}/toggle`);
      setServices((prev) => prev.map((s) => (s.id === id ? updated : s)));
      toast({
        title: updated.is_active ? "Service Activated" : "Service Deactivated",
        description: `Service has been ${updated.is_active ? "activated" : "deactivated"} successfully.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Manage Services
        </h2>
        <p className="text-sm text-muted-foreground">
          Activate or deactivate services available to users.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => {
          const Icon = iconMap[service.icon_name || "Package"] || Package;
          return (
            <div
              key={service.id}
              className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card p-4 sm:gap-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="min-w-0 truncate font-medium text-foreground">
                    {service.display_name}
                  </span>
                  <Badge
                    variant={service.is_active ? "default" : "secondary"}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {service.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {service.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {service.description}
                  </p>
                )}
              </div>
              <Switch
                className="shrink-0"
                checked={service.is_active}
                disabled={toggling === service.id}
                onCheckedChange={() =>
                  toggleService(service.id, service.is_active)
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
