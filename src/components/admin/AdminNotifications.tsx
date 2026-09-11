import { useState } from "react";
import { useAdminNotifications } from "@/hooks/useNotifications";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Send,
  Trash2,
  Users,
  User,
  Info,
  AlertTriangle,
  Gift,
  Megaphone,
  Pin,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Notification } from "@/hooks/useNotifications";

const notificationTypes = [
  { value: "info", label: "Info", icon: Info },
  { value: "warning", label: "Warning", icon: AlertTriangle },
  { value: "promo", label: "Promotion", icon: Gift },
  { value: "announcement", label: "Announcement", icon: Megaphone },
];

const typeBadgeVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  info: "secondary",
  warning: "destructive",
  promo: "default",
  announcement: "outline",
};

export function AdminNotifications() {
  const {
    data: notifications,
    isLoading,
    sendNotification,
    deleteNotification,
    updateNotification,
  } = useAdminNotifications();
  const { users } = useAdminUsers();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [isGlobal, setIsGlobal] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isSticky, setIsSticky] = useState(false);

  // Edit state
  const [editingNotif, setEditingNotif] = useState<Notification | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editType, setEditType] = useState("info");
  const [editIsSticky, setEditIsSticky] = useState(false);

  const openEdit = (notif: Notification) => {
    setEditingNotif(notif);
    setEditTitle(notif.title);
    setEditMessage(notif.message);
    setEditType(notif.type);
    setEditIsSticky(notif.is_sticky);
  };

  const handleUpdate = () => {
    if (!editingNotif || !editTitle.trim() || !editMessage.trim()) {
      toast.error("Title and message are required");
      return;
    }
    updateNotification.mutate(
      {
        id: editingNotif.id,
        title: editTitle.trim(),
        message: editMessage.trim(),
        type: editType,
        is_sticky: editIsSticky,
      },
      {
        onSuccess: () => {
          toast.success("Notification updated");
          setEditingNotif(null);
        },
        onError: () => toast.error("Failed to update notification"),
      },
    );
  };

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (!isGlobal && !selectedUserId) {
      toast.error("Please select a user for targeted notification");
      return;
    }

    sendNotification.mutate(
      {
        title: title.trim(),
        message: message.trim(),
        type,
        is_global: isGlobal,
        is_sticky: isSticky,
        user_id: isGlobal ? undefined : selectedUserId,
      },
      {
        onSuccess: () => {
          toast.success(
            isGlobal ? "Broadcast sent to all users" : "Notification sent",
          );
          setTitle("");
          setMessage("");
          setType("info");
          setIsSticky(false);
        },
        onError: () => toast.error("Failed to send notification"),
      },
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Compose */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Send className="w-5 h-5" />
              Send Notification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Notification title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {notificationTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <span className="flex items-center gap-2">
                          <t.icon className="w-4 h-4" />
                          {t.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Write your notification message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="global-toggle"
                  checked={isGlobal}
                  onCheckedChange={setIsGlobal}
                />
                <Label
                  htmlFor="global-toggle"
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  {isGlobal ? (
                    <Users className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  {isGlobal ? "Broadcast to all" : "Send to specific user"}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="sticky-toggle"
                  checked={isSticky}
                  onCheckedChange={setIsSticky}
                />
                <Label
                  htmlFor="sticky-toggle"
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <Pin className="w-4 h-4" />
                  {isSticky ? "Sticky (must acknowledge)" : "One-time popup"}
                </Label>
              </div>
            </div>

            {!isGlobal && (
              <div className="space-y-2">
                <Label>Select User</Label>
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((u: any) => (
                      <SelectItem key={u.user_id} value={u.user_id}>
                        {u.full_name || u.phone || u.user_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              onClick={handleSend}
              disabled={sendNotification.isPending}
              className="w-full md:w-auto"
            >
              <Send className="w-4 h-4 mr-2" />
              {sendNotification.isPending ? "Sending..." : "Send Notification"}
            </Button>
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notification History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : !notifications?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No notifications sent yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((notif) => (
                      <TableRow key={notif.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{notif.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {notif.message}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              typeBadgeVariant[notif.type] || "secondary"
                            }
                          >
                            {notif.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {notif.is_global ? (
                              <>
                                <Users className="w-3 h-3 mr-1" />
                                All
                              </>
                            ) : (
                              <>
                                <User className="w-3 h-3 mr-1" />
                                User
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notif.created_at), {
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(notif)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() =>
                                deleteNotification.mutate(notif.id, {
                                  onSuccess: () =>
                                    toast.success("Notification deleted"),
                                })
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingNotif}
        onOpenChange={(o) => {
          if (!o) setEditingNotif(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4" /> Edit Notification
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Notification title..."
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={editType} onValueChange={setEditType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">
                        <t.icon className="w-4 h-4" />
                        {t.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                rows={3}
                placeholder="Message..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="edit-sticky"
                checked={editIsSticky}
                onCheckedChange={setEditIsSticky}
              />
              <Label
                htmlFor="edit-sticky"
                className="flex items-center gap-1.5 cursor-pointer"
              >
                <Pin className="w-4 h-4" />{" "}
                {editIsSticky ? "Sticky (must acknowledge)" : "One-time popup"}
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingNotif(null)}
              disabled={updateNotification.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={
                updateNotification.isPending ||
                !editTitle.trim() ||
                !editMessage.trim()
              }
            >
              {updateNotification.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
