import { useState } from "react";
import { BookUser } from "lucide-react";
import { isContactPickerAvailable, pickContactPhone } from "@/lib/androidBridge";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  placeholder = "Enter phone number",
  className,
  disabled,
}: PhoneInputProps) {
  const canPick = isContactPickerAvailable();
  const [picking, setPicking] = useState(false);

  const handlePickContact = async () => {
    setPicking(true);
    try {
      const phone = await pickContactPhone();
      if (phone) onChange(phone);
    } finally {
      setPicking(false);
    }
  };

  return (
    <div className="relative flex items-center">
      <input
        type="tel"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground",
          "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary",
          canPick && "pr-12",
          className
        )}
      />
      {canPick && (
        <button
          type="button"
          onClick={handlePickContact}
          disabled={disabled || picking}
          aria-label="Pick from contacts"
          className={cn(
            "absolute right-3 p-1.5 rounded-lg text-muted-foreground",
            "hover:text-primary hover:bg-primary/10 transition-colors",
            "disabled:opacity-50 disabled:pointer-events-none"
          )}
        >
          <BookUser className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
