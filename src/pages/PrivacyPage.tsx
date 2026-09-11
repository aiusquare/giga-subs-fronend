import { PageHeader } from "@/components/PageHeader";
import { siteConfig } from "@/config/site";

const sections = [
  {
    title: "1. Information We Collect",
    body: `We collect the following types of information when you use ${siteConfig.name}:\n\n• Account information: full name, email address, phone number, and password.\n• Transaction data: purchase history, wallet top-ups, and recipient phone numbers.\n• Device & usage data: IP address, browser type, operating system, and pages visited — used solely for analytics and fraud prevention.\n• Communications: messages you send us through the Contact Us page or support channels.`,
  },
  {
    title: "2. How We Use Your Information",
    body: `Your information is used to:\n\n• Process your transactions and deliver purchased services.\n• Maintain your account and wallet balance.\n• Send transaction confirmations and account notifications.\n• Detect and prevent fraud and unauthorised access.\n• Improve the Platform's features and user experience.\n• Comply with applicable legal and regulatory obligations.`,
  },
  {
    title: "3. Sharing of Information",
    body: `We do not sell, rent, or trade your personal information to third parties. We may share your data only with:\n\n• Service providers (e.g., network operators, payment processors) strictly for fulfilling your transactions.\n• Law enforcement agencies when required by law or to protect the rights and safety of users.\n• Business successors in the event of a merger, acquisition, or sale of assets.`,
  },
  {
    title: "4. Data Security",
    body: `We implement industry-standard security measures including encrypted data storage, secure HTTPS connections, and hashed PIN storage. Despite these measures, no system is completely secure, and we cannot guarantee absolute security of your data.`,
  },
  {
    title: "5. Data Retention",
    body: `We retain your personal data for as long as your account is active or as required for legal, regulatory, or legitimate business purposes. Transaction records are kept for a minimum of 5 years in compliance with financial regulations.`,
  },
  {
    title: "6. Your Rights",
    body: `You have the right to:\n\n• Access the personal data we hold about you.\n• Request correction of inaccurate data.\n• Request deletion of your account and associated data (subject to legal retention requirements).\n• Withdraw consent for specific data processing activities.\n\nTo exercise these rights, contact us at the email address below.`,
  },
  {
    title: "7. Cookies",
    body: `We use essential cookies and local storage to maintain your login session and theme preferences. We do not use advertising or third-party tracking cookies.`,
  },
  {
    title: "8. Children's Privacy",
    body: `Our services are not directed at individuals under the age of 18. We do not knowingly collect personal information from minors. If you believe a child has provided us with personal data, please contact us immediately.`,
  },
  {
    title: "9. Changes to This Policy",
    body: `We may update this Privacy Policy periodically. We will notify you of material changes by posting the new policy on this page with a revised date. Your continued use of the Platform after any changes constitutes acceptance.`,
  },
  {
    title: "10. Contact",
    body: `If you have questions or concerns about this Privacy Policy, please contact our support team.`,
  },
];

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container max-w-lg mx-auto px-4">
        <PageHeader title="Privacy Policy" />

        <div className="space-y-6 animate-slide-up">
          <div className="rounded-2xl bg-card border border-border/50 p-5 space-y-1">
            <p className="text-xs text-muted-foreground">
              Last updated: January 1,{" "}
              {siteConfig.business?.foundedYear ?? 2025}
            </p>
            <p className="text-sm text-muted-foreground">
              Your privacy matters to us.{" "}
              <span className="font-medium text-foreground">
                {siteConfig.name}
              </span>{" "}
              is committed to protecting your personal information.
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
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {s.body}
                </p>
              </div>
            ))}
          </div>

          <p className="text-xs text-center text-muted-foreground pb-4">
            Questions? Email us at{" "}
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

export default PrivacyPage;
