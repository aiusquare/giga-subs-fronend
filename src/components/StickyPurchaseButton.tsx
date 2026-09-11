import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StickyPurchaseButtonProps = ComponentProps<typeof Button>;

export function StickyPurchaseButton({
  children,
  className,
  ...props
}: StickyPurchaseButtonProps) {
  return (
    <div className="fixed inset-x-0 bottom-20 z-40 px-4 md:bottom-4 md:px-0">
      <div className="mx-auto max-w-lg rounded-2xl border border-border/60 bg-background/90 p-1.5 shadow-lg backdrop-blur-md">
        <Button {...props} className={cn("w-full", className)}>
          {children}
        </Button>
      </div>
    </div>
  );
}
