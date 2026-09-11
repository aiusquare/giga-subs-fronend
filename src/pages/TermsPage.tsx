import { PageHeader } from "@/components/PageHeader";
import { siteConfig } from "@/config/site";

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: `By accessing or using ${siteConfig.name} ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.`,
  },
  {
    title: "2. Eligibility",
    body: `You must be at least 18 years old and a resident of Nigeria to create an account and use our services. By registering, you confirm that all information you provide is accurate and complete.`,
  },
  {
    title: "3. Services",
    body: `The Platform provides digital utility services including but not limited to: airtime top-up, mobile data bundles, electricity token purchase, cable TV subscriptions, exam result checking, and scratch card printing. All services are subject to availability and network conditions.`,
  },
  {
    title: "4. Wallet & Payments",
    body: `All transactions are processed through your ${siteConfig.name} wallet. You are responsible for maintaining sufficient wallet balance before initiating any transaction. Failed transactions are automatically refunded to your wallet within minutes. ${siteConfig.name} does not guarantee refunds for transactions that were successfully processed by a third-party provider.`,
  },
  {
    title: "5. User Responsibilities",
    body: `You agree to: (a) keep your login credentials and transaction PIN strictly confidential; (b) immediately notify us of any unauthorised use of your account; (c) not use the Platform for any illegal, fraudulent, or abusive purpose; (d) not attempt to reverse-engineer, scrape, or interfere with the Platform's systems.`,
  },
  {
    title: "6. Pricing & Fees",
    body: `Service prices are displayed before transaction confirmation. ${siteConfig.name} reserves the right to change prices at any time. Price changes will be reflected immediately on the Platform without prior notice.`,
  },
  {
    title: "7. Limitation of Liability",
    body: `${siteConfig.name} shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform, including but not limited to service delays caused by third-party providers, network downtime, or government regulatory actions.`,
  },
  {
    title: "8. Termination",
    body: `We reserve the right to suspend or terminate your account at our sole discretion if we detect fraudulent activity, abuse, or violation of these terms. Wallet balances at the time of termination may be recovered by contacting support.`,
  },
  {
    title: "9. Changes to Terms",
    body: `These Terms may be updated from time to time. Continued use of the Platform after changes are posted constitutes acceptance of the revised Terms.`,
  },
  {
    title: "10. Governing Law",
    body: `These Terms are governed by the laws of the Federal Republic of Nigeria. Any dispute shall be subject to the exclusive jurisdiction of the courts of Nigeria.`,
  },
];

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container max-w-lg mx-auto px-4">
        <PageHeader title="Terms of Service" />

        <div className="space-y-6 animate-slide-up">
          <div className="rounded-2xl bg-card border border-border/50 p-5 space-y-1">
            <p className="text-xs text-muted-foreground">
              Last updated: January 1,{" "}
              {siteConfig.business?.foundedYear ?? 2025}
            </p>
            <p className="text-sm text-muted-foreground">
              Please read these Terms of Service carefully before using{" "}
              <span className="font-medium text-foreground">
                {siteConfig.name}
              </span>
              .
            </p>
          </div>

          <div className="space-y-4">
            {sections.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl bg-card border border-border/50 p-5 space-y-2"
              >
                <h2 className="font-semibold text-foreground text-sm">
                  {s.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.body}
                </p>
              </div>
            ))}
          </div>

          <p className="text-xs text-center text-muted-foreground pb-4">
            For questions about these Terms, contact us at{" "}
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className="text-primary underline underline-offset-2"
            >
              {siteConfig.contact.email}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
