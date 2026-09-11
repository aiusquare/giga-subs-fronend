import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Notification } from "@/hooks/useNotifications";
import { showAndroidNotification } from "@/lib/androidBridge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Info, AlertTriangle, Gift, Megaphone, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const typeIcons: Record<string, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  promo: Gift,
  announcement: Megaphone,
};

const typeColors: Record<string, string> = {
  info: "text-primary",
  warning: "text-warning",
  promo: "text-success",
  announcement: "text-accent-foreground",
};

export function NotificationPopup() {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const [popup, setPopup] = useState<Notification | null>(null);
  const queue = useRef<Notification[]>([]);
  const showing = useRef(false);
  const shownIds = useRef<Set<string>>(new Set());

  const showNext = () => {
    if (queue.current.length > 0) {
      showing.current = true;
      const next = queue.current.shift()!;
      shownIds.current.add(next.id);
      // Mirror to Android native notification tray
      showAndroidNotification(next.title, next.message);
      setPopup(next);
    } else {
      showing.current = false;
    }
  };

  // Load pending popups on mount/login — polling-based (non-admin only)
  useEffect(() => {
    if (!user || isAdmin) return;

    const loadPopups = async () => {
      try {
        const all = await api.get<Notification[]>("/notifications?limit=50");

        // Sticky: show every session; non-sticky: only if unread
        const toShow = all.filter(
          (n) => !shownIds.current.has(n.id) && (n.is_sticky || !n.is_read)
        );

        if (toShow.length > 0) {
          queue.current.push(...toShow);
          if (!showing.current) showNext();
        }
      } catch {
        // silently ignore — popup is non-critical
      }
    };

    loadPopups();
  }, [user, isAdmin]);

  const handleDismiss = () => {
    if (popup?.is_sticky) return; // Sticky can't be dismissed via overlay
    dismissCurrent();
  };

  const handleAcknowledge = () => {
    dismissCurrent();
  };

  const dismissCurrent = () => {
    if (popup && !popup.is_sticky) {
      // Mark as read server-side (fire-and-forget)
      api.post(`/notifications/${popup.id}/read`).catch(() => {});
    }
    setPopup(null);
    setTimeout(showNext, 300);
  };

  // Don't render anything for admins
  if (isAdmin || !popup) return null;

  const Icon = typeIcons[popup.type] || Info;
  const color = typeColors[popup.type] || "text-muted-foreground";

  return (
    <AlertDialog open={!!popup} onOpenChange={(open) => !open && handleDismiss()}>
      <AlertDialogContent className="max-w-sm" onEscapeKeyDown={popup.is_sticky ? (e) => e.preventDefault() : undefined}>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-full bg-muted", color)}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-base">{popup.title}</AlertDialogTitle>
            </div>
            {popup.is_sticky && (
              <Badge variant="destructive" className="text-xs flex items-center gap-1">
                <Pin className="w-3 h-3" />
                Urgent
              </Badge>
            )}
          </div>
          <AlertDialogDescription className="mt-2 text-sm">
            {popup.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleAcknowledge}>
            {popup.is_sticky ? "I Acknowledge" : "OK"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
