import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface PinConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  verifyPin: (pin: string) => Promise<boolean>;
  title?: string;
  description?: string;
}

export function PinConfirmation({
  open,
  onOpenChange,
  onConfirm,
  verifyPin,
  title = "Enter PIN",
  description = "Enter your 4-digit transaction PIN to confirm",
}: PinConfirmationProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePinComplete = (value: string) => {
    setPin(value);
    setError("");
  };

  const handleConfirm = async () => {
    if (pin.length !== 4) {
      setError("Please enter your 4-digit PIN");
      return;
    }

    setIsProcessing(true);
    const valid = await verifyPin(pin);
    if (!valid) {
      setError("Incorrect PIN. Please try again.");
      setPin("");
      setIsProcessing(false);
      return;
    }
    setIsProcessing(false);
    setPin("");
    onOpenChange(false);
    onConfirm();
  };

  const handleClose = () => {
    setPin("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="pb-8">
        <DrawerHeader className="text-center">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>

        <div className="px-4 space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={4}
              value={pin}
              onChange={handlePinComplete}
              disabled={isProcessing}
              autoFocus
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="w-14 h-14 text-xl" isMasked />
                <InputOTPSlot index={1} className="w-14 h-14 text-xl" isMasked />
                <InputOTPSlot index={2} className="w-14 h-14 text-xl" isMasked />
                <InputOTPSlot index={3} className="w-14 h-14 text-xl" isMasked />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}

          <Button
            variant="gradient"
            size="xl"
            className="w-full"
            onClick={handleConfirm}
            disabled={pin.length !== 4 || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm"
            )}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
