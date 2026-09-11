import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import {
  Gift,
  Ticket,
  CreditCard,
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
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isServiceEnabled } from "@/lib/serviceConfig";
import type { AppServices } from "@/config/brands/types";

interface MoreService {
  icon: React.ReactNode;
  label: string;
  href?: string;
  gradient: string;
  serviceType: string;
  /** Key in AppServices config — undefined means always shown */
  configKey?: keyof AppServices;
}

interface ServiceStatus {
  service_type: string;
  display_name: string;
  is_active: boolean;
}

const parseServicesPayload = (payload: unknown): ServiceStatus[] => {
  if (Array.isArray(payload)) return payload as ServiceStatus[];

  if (payload && typeof payload === "object") {
    const candidate = payload as { services?: ServiceStatus[] };
    if (Array.isArray(candidate.services)) return candidate.services;
  }

  return [];
};

const moreServices: MoreService[] = [
  {
    icon: <Ticket className="w-6 h-6" />,
    label: "Scratch Cards",
    href: "/scratch-card",
    gradient: "var(--gradient-warning)",
    serviceType: "scratch_card",
    configKey: "scratch_card",
  },
  {
    icon: <Gift className="w-6 h-6" />,
    label: "Gift Cards",
    gradient: "var(--gradient-purple)",
    serviceType: "gift_cards",
    configKey: "gift_cards",
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    label: "Virtual Cards",
    gradient: "var(--gradient-primary)",
    serviceType: "virtual_cards",
    configKey: "virtual_cards",
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    label: "E-pins",
    gradient: "var(--gradient-success)",
    serviceType: "epins",
    configKey: "epins",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    label: "Insurance",
    gradient: "var(--gradient-warning)",
    serviceType: "insurance",
    configKey: "insurance",
  },
  {
    icon: <Wallet className="w-6 h-6" />,
    label: "Fund Wallet",
    gradient: "var(--gradient-purple)",
    serviceType: "fund_wallet",
    configKey: "fund_wallet",
  },
  {
    icon: <Users className="w-6 h-6" />,
    label: "Referrals",
    gradient: "var(--gradient-primary)",
    serviceType: "referrals",
    configKey: "referrals",
  },
  {
    icon: <HelpCircle className="w-6 h-6" />,
    label: "Support",
    href: "/tickets",
    gradient: "var(--gradient-success)",
    serviceType: "support_tickets",
    configKey: "support_tickets",
  },
  {
    icon: <Key className="w-6 h-6" />,
    label: "API Access",
    href: "/api",
    gradient: "var(--gradient-primary)",
    serviceType: "api_access",
    configKey: "api_access",
  },
  {
    icon: <Fingerprint className="w-6 h-6" />,
    label: "Unified Identity",
    gradient: "var(--gradient-purple)",
    serviceType: "unified_identity",
    configKey: "unified_identity",
  },
  {
    icon: <IdCard className="w-6 h-6" />,
    label: "NIN Verification",
    href: "/nin-verification",
    gradient: "var(--gradient-primary)",
    serviceType: "nin_verification",
    configKey: "nin_verification",
  },
  {
    icon: <FileText className="w-6 h-6" />,
    label: "NIN Slip Download",
    href: "/nin-slip-download",
    gradient: "var(--gradient-success)",
    serviceType: "nin_slip_download",
    configKey: "nin_slip_download",
  },
  {
    icon: <Landmark className="w-6 h-6" />,
    label: "BVN Verification",
    href: "/bvn-verification",
    gradient: "var(--gradient-warning)",
    serviceType: "bvn_verification",
    configKey: "bvn_verification",
  },
  {
    icon: <Fingerprint className="w-6 h-6" />,
    label: "Identity Updates",
    href: "/identity-updates",
    gradient: "var(--gradient-purple)",
    serviceType: "identity_update",
    configKey: "identity_update",
  },
];

// Filter to only services enabled in the brand config
const configEnabledMoreServices = moreServices.filter(
  (s) => !s.configKey || isServiceEnabled(s.configKey),
);

const normalizeServiceType = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "_");

const MorePage = () => {
  const navigate = useNavigate();

  const { data: services } = useQuery({
    queryKey: ["services-status-all"],
    queryFn: async () => {
      const data = await api.get("/services");
      return parseServicesPayload(data);
    },
    staleTime: 60_000,
  });

  const getBackendService = (serviceType: string) => {
    const normalizedType = normalizeServiceType(serviceType);
    return services?.find(
      (s) => normalizeServiceType(s.service_type) === normalizedType,
    );
  };

  const isServiceActive = (serviceType: string) => {
    const service = getBackendService(serviceType);
    return service?.is_active ?? false;
  };

  const handleServiceClick = (service: MoreService) => {
    const backendService = getBackendService(service.serviceType);

    if (!backendService) {
      toast.error("This service is not configured yet");
      return;
    }

    if (!backendService.is_active) {
      toast.error("This service is currently unavailable");
      return;
    }

    if (!service.href) {
      toast.info(
        `${backendService.display_name || service.label} is coming soon`,
      );
      return;
    }

    navigate(service.href);
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container max-w-lg mx-auto px-4">
        <PageHeader title="More Services" />

        <div className="space-y-6">
          <section className="animate-slide-up">
            <div className="grid grid-cols-4 gap-4">
              {configEnabledMoreServices.map((service, index) => {
                const backendService = getBackendService(service.serviceType);
                const serviceActive = isServiceActive(service.serviceType);
                const active = serviceActive && !!service.href;
                const label = backendService?.display_name || service.label;

                return (
                  <Tooltip key={service.label}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleServiceClick(service)}
                        className={cn(
                          "action-card relative flex flex-col items-center gap-2 p-3",
                          "bg-secondary/50 hover:bg-secondary/80",
                          "border border-border/50",
                          !active && "opacity-50 cursor-not-allowed",
                        )}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        {!backendService && (
                          <span className="absolute top-1 right-1 text-[8px] font-bold uppercase tracking-wider bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full leading-none z-10">
                            N/A
                          </span>
                        )}
                        {backendService && !serviceActive && (
                          <span className="absolute top-1 right-1 text-[8px] font-bold uppercase tracking-wider bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full leading-none z-10">
                            Off
                          </span>
                        )}
                        {backendService && serviceActive && !service.href && (
                          <span className="absolute top-1 right-1 text-[8px] font-bold uppercase tracking-wider bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full leading-none z-10">
                            Soon
                          </span>
                        )}

                        <div
                          className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center text-primary-foreground",
                            !active && "grayscale",
                          )}
                          style={{ background: service.gradient }}
                        >
                          {service.icon}
                        </div>
                        <span className="text-xs font-medium text-foreground text-center">
                          {label}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {!backendService
                          ? `${service.label} is not configured yet`
                          : !serviceActive
                            ? `${label} is currently unavailable. Please check back later.`
                            : !service.href
                              ? `${label} is coming soon`
                              : `Go to ${label}`}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </section>

          {/* App Info */}
          <section
            className="animate-slide-up mt-8"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="p-6 rounded-2xl bg-secondary/50 border border-border/50 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-2xl mb-4">
                G
              </div>
              <h3 className="font-bold text-foreground text-lg">Giga Data</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Version 1.0.0
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Your trusted partner for instant recharge and bill payments.
              </p>
            </div>
          </section>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default MorePage;
