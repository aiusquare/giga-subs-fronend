import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { Wifi, Zap, Tv, Receipt, GraduationCap, Plane, Car, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const billCategories = [
  { icon: <Wifi className="w-6 h-6" />, label: "Internet", href: "/data", gradient: "var(--gradient-primary)" },
  { icon: <Zap className="w-6 h-6" />, label: "Electricity", href: "/electricity", gradient: "var(--gradient-warning)" },
  { icon: <Tv className="w-6 h-6" />, label: "Cable TV", href: "/cable", gradient: "var(--gradient-purple)" },
  { icon: <GraduationCap className="w-6 h-6" />, label: "Education", href: "/education", gradient: "var(--gradient-success)" },
  { icon: <Plane className="w-6 h-6" />, label: "Flight", href: "/flight", gradient: "var(--gradient-primary)" },
  { icon: <Car className="w-6 h-6" />, label: "Transport", href: "/transport", gradient: "var(--gradient-warning)" },
  { icon: <Building2 className="w-6 h-6" />, label: "Government", href: "/government", gradient: "var(--gradient-purple)" },
  { icon: <Receipt className="w-6 h-6" />, label: "Others", href: "/more", gradient: "var(--gradient-success)" },
];

const BillsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container max-w-lg mx-auto px-4">
        <PageHeader title="Pay Bills" />

        <div className="space-y-6">
          <section className="animate-slide-up">
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Select Bill Category</h2>
            <div className="grid grid-cols-4 gap-4">
              {billCategories.map((category, index) => (
                <button
                  key={category.label}
                  onClick={() => navigate(category.href)}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-secondary/50 hover:bg-secondary border border-border/50 transition-all duration-200"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-primary-foreground"
                    style={{ background: category.gradient }}
                  >
                    {category.icon}
                  </div>
                  <span className="text-xs font-medium text-foreground text-center">
                    {category.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Recent Bills */}
          <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Recent Bills</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 border border-border/50">
                <div className="w-10 h-10 rounded-xl bg-gradient-warning flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">EKEDC Electricity</p>
                  <p className="text-sm text-muted-foreground">Meter: 12345678901</p>
                </div>
                <button className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
                  Pay
                </button>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 border border-border/50">
                <div className="w-10 h-10 rounded-xl bg-gradient-purple flex items-center justify-center">
                  <Tv className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">DStv Premium</p>
                  <p className="text-sm text-muted-foreground">IUC: 7012345678</p>
                </div>
                <button className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
                  Pay
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default BillsPage;
