import { PageHeader } from "@/components/PageHeader";
import { ShieldCheck, Smartphone, Clock } from "lucide-react";

const TwoFactorPage = () => {
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container max-w-lg mx-auto px-4">
        <PageHeader title="Two-Factor Auth" />

        <div className="space-y-6 animate-slide-up">
          {/* Status card */}
          <div className="rounded-2xl bg-card border border-border/50 p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center shrink-0">
              <ShieldCheck className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                Two-Factor Authentication
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                Not enabled
              </span>
            </div>
          </div>

          {/* Coming soon */}
          <div className="rounded-2xl bg-primary/5 border border-primary/20 p-6 text-center space-y-3">
            <Clock className="w-10 h-10 text-primary mx-auto" />
            <p className="font-semibold text-foreground">Coming Soon</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Two-factor authentication via SMS OTP or authenticator app is
              currently in development and will be available in a future update.
            </p>
          </div>

          {/* What to expect */}
          <div className="rounded-2xl bg-card border border-border/50 p-5 space-y-4">
            <p className="text-sm font-semibold text-foreground">
              What to expect
            </p>
            {[
              {
                icon: <Smartphone className="w-5 h-5 text-primary" />,
                title: "SMS OTP",
                desc: "A one-time code sent to your registered phone number each time you log in.",
              },
              {
                icon: <ShieldCheck className="w-5 h-5 text-primary" />,
                title: "Authenticator App",
                desc: "Use Google Authenticator or Authy to generate time-based codes without needing network access.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorPage;
