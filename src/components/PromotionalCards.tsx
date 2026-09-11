import { usePromotions } from "@/hooks/usePromotions";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles, Zap, Gift, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

const decorativeIcons = [Sparkles, Zap, Gift, Star];

export function PromotionalCards() {
  const { data: promotions, isLoading } = usePromotions();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const count = promotions?.length ?? 0;

  const scrollTo = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.children[index] as HTMLElement | undefined;
    if (card) el.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
    setActive(index);
  };

  // Auto-scroll every 4 s
  useEffect(() => {
    if (count < 2) return;
    timerRef.current = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % count;
        scrollTo(next);
        return next;
      });
    }, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [count]);

  // Pause auto-scroll while user is dragging
  const pauseTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };
  const resumeTimer = () => {
    if (count < 2) return;
    timerRef.current = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % count;
        scrollTo(next);
        return next;
      });
    }, 4000);
  };

  // Sync active dot with scroll position
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.offsetWidth);
    setActive(idx);
  };

  if (isLoading || !promotions?.length) return null;

  return (
    <section className="space-y-2">
      {/* Horizontal scroll strip */}
      <div
        ref={scrollRef}
        onMouseDown={pauseTimer}
        onMouseUp={resumeTimer}
        onTouchStart={pauseTimer}
        onTouchEnd={resumeTimer}
        onScroll={onScroll}
        className="flex overflow-x-auto snap-x snap-mandatory gap-3 scrollbar-hide pb-1"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {promotions.map((promo, index) => {
          const DecoIcon = decorativeIcons[index % decorativeIcons.length];
          const hasImage = !!promo.image_url;

          return (
            <div
              key={promo.id}
              className="min-w-[calc(100%-1rem)] snap-center rounded-xl overflow-hidden relative flex-shrink-0"
              style={{ scrollSnapAlign: "center" }}
            >
              {/* Background: image or gradient */}
              {hasImage ? (
                <>
                  <img
                    src={promo.image_url!}
                    alt={promo.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${promo.gradient || "from-black/70 to-black/40"} opacity-70`}
                  />
                </>
              ) : (
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${promo.gradient || "from-purple-600 via-purple-500 to-fuchsia-500"}`}
                />
              )}

              {/* Decorative icons */}
              {!hasImage && (
                <>
                  <div className="absolute -right-4 -bottom-4 opacity-10 animate-[spin_20s_linear_infinite]">
                    <DecoIcon className="w-32 h-32 text-white" strokeWidth={1} />
                  </div>
                  <div className="absolute right-8 top-6 opacity-20 animate-float">
                    <DecoIcon className="w-12 h-12 text-white" strokeWidth={1.5} />
                  </div>
                  <div className="absolute left-1/2 -top-3 opacity-[0.07] animate-[pulse_3s_ease-in-out_infinite]">
                    <DecoIcon className="w-20 h-20 text-white" strokeWidth={1} />
                  </div>
                </>
              )}

              <CardContent className="p-5 flex flex-col justify-between min-h-[150px] relative z-10 text-white">
                <div className="space-y-2">
                  {promo.badge_text && (
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                      <span className="text-[11px] font-bold tracking-wider uppercase text-yellow-200">
                        {promo.badge_text}
                      </span>
                    </div>
                  )}
                  <h3 className="font-bold text-lg leading-tight drop-shadow-sm">{promo.title}</h3>
                  {promo.description && (
                    <p className="text-sm opacity-90 leading-snug drop-shadow-sm break-words">
                      {promo.description}
                    </p>
                  )}
                </div>
                {promo.cta_link && (
                  <Button
                    size="sm"
                    className="mt-4 self-start bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm rounded-full px-5 font-semibold text-xs"
                    onClick={() => navigate(promo.cta_link!)}
                  >
                    {promo.cta_text || "Claim Now"}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </CardContent>
            </div>
          );
        })}
      </div>

      {/* Dot indicators */}
      {count > 1 && (
        <div className="flex justify-center gap-1.5">
          {promotions.map((_, i) => (
            <button
              key={i}
              onClick={() => { pauseTimer(); scrollTo(i); resumeTimer(); }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
