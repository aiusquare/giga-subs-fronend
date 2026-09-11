import { PageHeader } from "@/components/PageHeader";
import { Mail, Phone, MessageCircle, Ticket } from "lucide-react";
import { siteConfig } from "@/config/site";
import { useNavigate } from "react-router-dom";

const ContactPage = () => {
  const navigate = useNavigate();

  const contactItems = [
    {
      icon: <Mail className="w-5 h-5" />,
      label: "Email",
      value: siteConfig.contact.email,
      href: `mailto:${siteConfig.contact.email}`,
    },
    {
      icon: <Phone className="w-5 h-5" />,
      label: "Phone",
      value: siteConfig.contact.phone,
      href: `tel:${siteConfig.contact.phone}`,
    },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      label: "WhatsApp",
      value: siteConfig.contact.whatsapp,
      href: `https://wa.me/${siteConfig.contact.whatsapp?.replace(/\D/g, "")}`,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container max-w-lg mx-auto px-4">
        <PageHeader title="Contact Us" />

        <div className="space-y-6 animate-slide-up">
          {/* Contact channels */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Reach Us Directly
            </h2>
            <div className="space-y-3">
              {contactItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-2xl bg-card border border-border/50 px-4 py-4 hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {item.value}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* Support tickets CTA */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Submit a Support Ticket
            </h2>
            <div className="rounded-2xl bg-card border border-border/50 p-5 space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                For issues that need tracking — transactions, account problems,
                billing — open a support ticket and our team will respond
                directly in-app.
              </p>
              <button
                onClick={() => navigate("/tickets")}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Ticket className="w-4 h-4" />
                Open a Support Ticket
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
