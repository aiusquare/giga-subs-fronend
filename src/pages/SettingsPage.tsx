import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import {
  Moon,
  Bell,
  Lock,
  Globe,
  HelpCircle,
  FileText,
  MessageSquare,
  ChevronRight,
  Smartphone,
  Ticket,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === "dark";
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);

  const settingsGroups = [
    {
      title: "Preferences",
      items: [
        {
          icon: Moon,
          label: "Dark Mode",
          description: "Use dark theme",
          toggle: true,
          value: darkMode,
          onChange: toggleTheme,
        },
        {
          icon: Bell,
          label: "Notifications",
          description: "Push notifications",
          toggle: true,
          value: notifications,
          onChange: () => setNotifications((v) => !v),
        },
        {
          icon: Smartphone,
          label: "Biometric Login",
          description: "Use fingerprint or face ID",
          toggle: true,
          value: biometric,
          onChange: () => setBiometric((v) => !v),
        },
      ],
    },
    {
      title: "Security",
      items: [
        { icon: Lock, label: "Change PIN", href: "/change-pin" },
        { icon: Lock, label: "Change Password", href: "/change-password" },
        { icon: Globe, label: "Two-Factor Auth", href: "/2fa" },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help Center", href: "/help" },
        { icon: Ticket, label: "Support Tickets", href: "/tickets" },
        { icon: MessageSquare, label: "Contact Us", href: "/contact" },
        { icon: FileText, label: "Terms of Service", href: "/terms" },
        { icon: FileText, label: "Privacy Policy", href: "/privacy" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container max-w-lg mx-auto px-4">
        <PageHeader title="Settings" />

        <div className="space-y-6">
          {settingsGroups.map((group, groupIndex) => (
            <section
              key={group.title}
              className="animate-slide-up"
              style={{ animationDelay: `${groupIndex * 0.1}s` }}
            >
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isToggle = "toggle" in item && item.toggle;

                  return (
                    <button
                      key={item.label}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 border border-border/50 hover:bg-secondary transition-colors"
                      onClick={() => {
                        if (isToggle && item.onChange) {
                          item.onChange();
                        } else if (!isToggle && "href" in item && item.href) {
                          navigate(item.href as string);
                        }
                      }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-foreground">
                          {item.label}
                        </p>
                        {"description" in item && (
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </div>
                      {isToggle ? (
                        <div
                          className={`w-12 h-7 rounded-full transition-colors ${
                            item.value ? "bg-primary" : "bg-muted"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-white mt-1 transition-transform ${
                              item.value ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </div>
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          {/* App Version */}
          <div className="text-center py-4 text-sm text-muted-foreground">
            <p>Giga Data v1.0.0</p>
            <p className="mt-1">© 2024 Giga Data. All rights reserved.</p>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default SettingsPage;
