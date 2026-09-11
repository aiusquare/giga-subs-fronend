import {
  Smartphone,
  Wifi,
  CreditCard,
  Zap,
  Receipt,
  Tv,
  MoreHorizontal,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isServiceEnabled } from "@/lib/serviceConfig";
import type { AppServices } from "@/config/brands/types";

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  gradient: string;
  glow: string;
  border: string;
  href: string;
  serviceType: string;
  /** Key in AppServices config — undefined means always shown (e.g. "More") */
  configKey?: keyof AppServices;
}

interface ServiceStatus {
  service_type: string;
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

const quickActions: QuickAction[] = [
  {
    icon: <Wifi className="w-6 h-6" />,
    label: "Buy Data",
    gradient: "linear-gradient(135deg, #2563eb 0%, #0891b2 100%)",
    glow: "shadow-blue-500/20 hover:shadow-blue-500/30",
    border: "hover:border-blue-400/45",
    href: "/data",
    serviceType: "data",
    configKey: "data",
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    label: "Airtime",
    gradient: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
    glow: "shadow-emerald-500/20 hover:shadow-emerald-500/30",
    border: "hover:border-emerald-400/45",
    href: "/airtime",
    serviceType: "airtime",
    configKey: "airtime",
  },
  {
    icon: <CreditCard className="w-6 h-6" />,
    label: "Scratch Card",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
    glow: "shadow-amber-500/20 hover:shadow-amber-500/30",
    border: "hover:border-amber-400/45",
    href: "/scratch-card",
    serviceType: "scratch_card",
    configKey: "scratch_card",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    label: "Electricity",
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)",
    glow: "shadow-fuchsia-500/20 hover:shadow-fuchsia-500/30",
    border: "hover:border-fuchsia-400/45",
    href: "/electricity",
    serviceType: "electricity",
    configKey: "electricity",
  },
  {
    icon: <Tv className="w-6 h-6" />,
    label: "Cable TV",
    gradient: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
    glow: "shadow-cyan-500/20 hover:shadow-cyan-500/30",
    border: "hover:border-cyan-400/45",
    href: "/cable",
    serviceType: "cable",
    configKey: "cable",
  },
  {
    icon: <Receipt className="w-6 h-6" />,
    label: "Bills",
    gradient: "linear-gradient(135deg, #059669 0%, #14b8a6 100%)",
    glow: "shadow-teal-500/20 hover:shadow-teal-500/30",
    border: "hover:border-teal-400/45",
    href: "/bills",
    serviceType: "bills",
    configKey: "bills",
  },
  {
    icon: <GraduationCap className="w-6 h-6" />,
    label: "Exam Pins",
    gradient: "linear-gradient(135deg, #f97316 0%, #eab308 100%)",
    glow: "shadow-orange-500/20 hover:shadow-orange-500/30",
    border: "hover:border-orange-400/45",
    href: "/result-checker",
    serviceType: "result_checker",
    configKey: "result_checker",
  },
  {
    icon: <MoreHorizontal className="w-6 h-6" />,
    label: "More",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #a855f7 55%, #ec4899 100%)",
    glow: "shadow-purple-500/20 hover:shadow-purple-500/30",
    border: "hover:border-purple-400/45",
    href: "/more",
    serviceType: "",
    // no configKey — "More" is always shown
  },
];

// Filter out any service disabled in the brand config at build/render time
const configEnabledActions = quickActions.filter(
  (a) => !a.configKey || isServiceEnabled(a.configKey),
);

const normalizeServiceType = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "_");

export function QuickActions() {
  const navigate = useNavigate();

  const { data: services } = useQuery({
    queryKey: ["services-status-all"],
    queryFn: async () => {
      const data = await api.get("/services");
      return parseServicesPayload(data);
    },
    staleTime: 60_000,
  });

  const isServiceActive = (serviceType: string) => {
    if (!serviceType) return true;
    const normalizedType = normalizeServiceType(serviceType);
    const service = services?.find(
      (s) => normalizeServiceType(s.service_type) === normalizedType,
    );
    return service?.is_active ?? true;
  };

  const handleClick = (action: QuickAction) => {
    if (!isServiceActive(action.serviceType)) {
      toast.error("This service is currently unavailable");
      return;
    }
    navigate(action.href);
  };

  return (
    <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
      <h2 className="text-lg font-semibold mb-4 text-foreground">
        Quick Actions
      </h2>
      <div className="grid grid-cols-4 gap-3 md:gap-4">
        {configEnabledActions.map((action, index) => {
          const active = isServiceActive(action.serviceType);
          return (
            <Tooltip key={action.label}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleClick(action)}
                  className={cn(
                    "action-card group relative flex flex-col items-center gap-2 p-3 md:p-4",
                    "bg-secondary/50 hover:bg-secondary/80",
                    "border border-border/50 shadow-sm transition-all duration-300",
                    action.border,
                    !active && "opacity-50 cursor-not-allowed",
                  )}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {!active && (
                    <span className="absolute top-1 right-1 text-[8px] font-bold uppercase tracking-wider bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full leading-none z-10">
                      Off
                    </span>
                  )}
                  <div
                    className={cn(
                      "w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-primary-foreground",
                      "shadow-lg transition-all duration-300 group-hover:scale-105",
                      action.glow,
                      !active && "grayscale",
                    )}
                    style={{ background: action.gradient }}
                  >
                    {action.icon}
                  </div>
                  <span className="text-xs md:text-sm font-medium text-foreground text-center">
                    {action.label}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {active
                    ? `Go to ${action.label}`
                    : `${action.label} is currently unavailable. Please check back later.`}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </section>
  );
}
