import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { StickyPurchaseButton } from "@/components/StickyPurchaseButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { api } from "@/lib/apiClient";
import { Loader2 } from "lucide-react";

interface PricingItem {
  id: string;
  provider: string;
  plan_name: string;
  plan_code: string | null;
  selling_price: number;
}

const ScratchCardPage = () => {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [cards, setCards] = useState<PricingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<PricingItem[]>("/pricing?service_type=scratch_card")
      .then(setCards)
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  }, []);

  const selected = cards.find((c) => c.id === selectedCard);
  const totalPrice = selected ? selected.selling_price * quantity : 0;

  return (
    <div className="min-h-screen bg-background pb-40 md:pb-24">
      <div className="container max-w-lg mx-auto px-4">
        <PageHeader title="Scratch Cards" />

        <div className="space-y-6">
          {/* Card Type Selection */}
          <section className="animate-slide-up">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Select Card Type
            </h2>

            {loading && (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}

            {!loading && cards.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No scratch cards available at the moment
              </p>
            )}

            {!loading && cards.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {cards.map((card) => (
                  <Card
                    key={card.id}
                    onClick={() => {
                      setSelectedCard(card.id);
                      setQuantity(1);
                    }}
                    className={`p-4 cursor-pointer transition-all duration-200 ${
                      selectedCard === card.id
                        ? "border-primary bg-primary/10"
                        : "bg-secondary/50 hover:bg-secondary"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-warning flex items-center justify-center text-primary-foreground font-bold mb-2">
                      {card.provider.charAt(0)}
                    </div>
                    <p className="font-bold text-foreground">{card.provider}</p>
                    <p className="text-xs text-muted-foreground">
                      {card.plan_name}
                    </p>
                    <p className="text-primary font-semibold mt-2">
                      ₦{card.selling_price.toLocaleString()}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Quantity */}
          <section
            className="animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Quantity
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-xl bg-secondary/50 text-foreground font-bold text-xl hover:bg-secondary transition-colors"
              >
                -
              </button>
              <span className="text-2xl font-bold text-foreground w-12 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
                className="w-12 h-12 rounded-xl bg-secondary/50 text-foreground font-bold text-xl hover:bg-secondary transition-colors"
              >
                +
              </button>
            </div>
          </section>

          {/* Summary */}
          {selected && (
            <section
              className="animate-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="p-4 rounded-2xl bg-secondary/50 border border-border/50">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Card Type</span>
                  <span className="font-medium text-foreground">
                    {selected.provider}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-medium text-foreground">
                    {quantity}
                  </span>
                </div>
                <div className="border-t border-border my-3" />
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">Total</span>
                  <span className="text-xl font-bold text-primary">
                    ₦{totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Purchase Button */}
          <StickyPurchaseButton
            variant="gradient"
            size="xl"
            className="w-full"
            disabled={!selectedCard}
          >
            Purchase Card{quantity > 1 ? "s" : ""}
          </StickyPurchaseButton>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default ScratchCardPage;
