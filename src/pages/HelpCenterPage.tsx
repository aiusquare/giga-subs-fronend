import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    question: "How do I fund my wallet?",
    answer:
      "Go to Dashboard and tap 'Fund Wallet'. You can fund via bank transfer or card payment. Funds are credited instantly after confirmation.",
  },
  {
    question: "How do I buy data or airtime?",
    answer:
      "From the Dashboard tap 'Data' or 'Airtime', select your network, enter the phone number and amount, then confirm with your PIN.",
  },
  {
    question: "How long does an electricity token take?",
    answer:
      "Electricity tokens are delivered instantly in most cases. If your token is not received within 5 minutes, please contact support.",
  },
  {
    question: "What should I do if a transaction fails?",
    answer:
      "If a transaction fails, your wallet will be automatically refunded within a few minutes. Check your transaction history for details. If the refund is not received after 10 minutes, contact support.",
  },
  {
    question: "How do I change my PIN?",
    answer:
      "Go to Settings → Change PIN. You will need to enter your current PIN followed by the new PIN twice to confirm.",
  },
  {
    question: "Can I use the API?",
    answer:
      "Yes. Go to Settings → API Access or visit the API page to generate your API key and view the documentation.",
  },
  {
    question: "How do I contact support?",
    answer:
      "You can reach us via the Contact Us page, WhatsApp, or email. Our support team is available Monday – Saturday, 8 AM – 8 PM.",
  },
];

const HelpCenterPage = () => {
  const [open, setOpen] = useState<number | null>(null);

  const toggle = (i: number) => setOpen((prev) => (prev === i ? null : i));

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container max-w-lg mx-auto px-4">
        <PageHeader title="Help Center" />

        <div className="space-y-8 animate-slide-up">
          {/* Hero */}
          <div className="rounded-2xl bg-primary/10 border border-primary/20 p-5 text-center">
            <p className="text-2xl font-bold text-primary mb-1">
              How can we help you?
            </p>
            <p className="text-sm text-muted-foreground">
              Browse the frequently asked questions below or contact us
              directly.
            </p>
          </div>

          {/* FAQ */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Frequently Asked Questions
            </h2>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  className="w-full text-left rounded-2xl bg-card border border-border/50 px-4 py-4 transition-all duration-200"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-foreground text-sm">
                      {faq.question}
                    </span>
                    {open === i ? (
                      <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
                    )}
                  </div>
                  {open === i && (
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="rounded-2xl bg-card border border-border/50 p-5 text-center space-y-1">
            <p className="font-semibold text-foreground">Still need help?</p>
            <p className="text-sm text-muted-foreground">
              Our support team is ready to assist you.
            </p>
            <a
              href="/contact"
              className="inline-block mt-3 px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterPage;
