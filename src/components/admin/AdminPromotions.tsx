import { useState, useRef } from "react";
import { api } from "@/lib/apiClient";
import { useAllPromotions, Promotion } from "@/hooks/usePromotions";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  Megaphone,
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const defaultForm = {
  title: "",
  description: "",
  badge_text: "",
  gradient: "from-primary to-primary/60",
  cta_text: "Learn More",
  cta_link: "",
  is_active: true,
  display_order: 0,
  starts_at: "",
  expires_at: "",
  image_url: "",
};

export function AdminPromotions() {
  const { data: promotions, isLoading } = useAllPromotions();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const gradientOptions = [
    { label: "Primary", value: "from-primary to-primary/60" },
    { label: "Blue", value: "from-blue-600 to-blue-400" },
    { label: "Green", value: "from-green-600 to-green-400" },
    { label: "Orange", value: "from-orange-600 to-orange-400" },
    { label: "Purple", value: "from-purple-600 to-purple-400" },
    { label: "Rose", value: "from-rose-600 to-rose-400" },
  ];

  const openAdd = () => {
    setEditingId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (p: Promotion) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      description: p.description || "",
      badge_text: p.badge_text || "",
      gradient: p.gradient || "from-primary to-primary/60",
      cta_text: p.cta_text || "Learn More",
      cta_link: p.cta_link || "",
      is_active: p.is_active,
      display_order: p.display_order,
      starts_at: p.starts_at ? p.starts_at.slice(0, 16) : "",
      expires_at: p.expires_at ? p.expires_at.slice(0, 16) : "",
      image_url: p.image_url || "",
    });
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const data = await api.upload<{ url: string }>(
        "/admin/promotions/upload",
        formData,
      );
      setForm((prev) => ({ ...prev, image_url: data.url }));
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error("Failed to upload image");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setForm((prev) => ({ ...prev, image_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    const payload = {
      title: form.title,
      description: form.description || null,
      badge_text: form.badge_text || null,
      gradient: form.gradient,
      cta_text: form.cta_text || null,
      cta_link: form.cta_link || null,
      is_active: form.is_active,
      display_order: form.display_order,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      expires_at: form.expires_at
        ? new Date(form.expires_at).toISOString()
        : null,
      image_url: form.image_url || null,
    };

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/promotions/${editingId}`, payload);
        toast.success("Promotion updated");
      } else {
        await api.post("/admin/promotions", payload);
        toast.success("Promotion created");
      }
      queryClient.invalidateQueries({ queryKey: ["promotions-admin"] });
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      setDialogOpen(false);
    } catch (err: any) {
      toast.error("Failed to save promotion");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.del(`/admin/promotions/${id}`);
      toast.success("Promotion deleted");
      queryClient.invalidateQueries({ queryKey: ["promotions-admin"] });
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
    } catch (err: any) {
      toast.error("Failed to delete");
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await api.put(`/admin/promotions/${id}`, { is_active: !current });
      queryClient.invalidateQueries({ queryKey: ["promotions-admin"] });
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
    } catch (err: any) {
      toast.error("Failed to update");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Promotions</h2>
        </div>
        <Button onClick={openAdd} size="sm" className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-1" /> Add Promotion
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Badge</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : !promotions?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No promotions yet
                  </TableCell>
                </TableRow>
              ) : (
                promotions.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt=""
                          className="w-10 h-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell>{p.badge_text || "—"}</TableCell>
                    <TableCell>
                      <Switch
                        checked={p.is_active}
                        onCheckedChange={() => toggleActive(p.id, p.is_active)}
                      />
                    </TableCell>
                    <TableCell>{p.display_order}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(p)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Add"} Promotion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Image Upload */}
            <div>
              <Label>Card Image</Label>
              {form.image_url ? (
                <div className="relative mt-1 rounded-lg overflow-hidden border border-border">
                  <img
                    src={form.image_url}
                    alt="Preview"
                    className="w-full h-40 object-cover"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="mt-1 w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Upload className="w-6 h-6" />
                  <span className="text-sm">
                    {uploading ? "Uploading..." : "Click to upload image"}
                  </span>
                  <span className="text-xs">Max 5MB • JPG, PNG, WebP</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            <div>
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Badge Text</Label>
                <Input
                  value={form.badge_text}
                  onChange={(e) =>
                    setForm({ ...form, badge_text: e.target.value })
                  }
                  placeholder="e.g. NEW, HOT"
                />
              </div>
              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      display_order: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label>
                Gradient Style{" "}
                {form.image_url && (
                  <span className="text-xs text-muted-foreground">
                    (used as overlay)
                  </span>
                )}
              </Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {gradientOptions.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setForm({ ...form, gradient: g.value })}
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${g.value} border-2 ${form.gradient === g.value ? "border-foreground" : "border-transparent"}`}
                    title={g.label}
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>CTA Text</Label>
                <Input
                  value={form.cta_text}
                  onChange={(e) =>
                    setForm({ ...form, cta_text: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>CTA Link</Label>
                <Input
                  value={form.cta_link}
                  onChange={(e) =>
                    setForm({ ...form, cta_link: e.target.value })
                  }
                  placeholder="/data"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Starts At</Label>
                <Input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) =>
                    setForm({ ...form, starts_at: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Expires At</Label>
                <Input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) =>
                    setForm({ ...form, expires_at: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label>Active</Label>
            </div>
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={uploading || saving}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? "Update" : "Create"} Promotion
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
