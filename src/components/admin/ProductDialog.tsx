import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Video } from "lucide-react";
import { Product } from "@/types/product";
import { CATEGORY_CONFIG } from "@/data/categories";

const CATEGORIES = Object.keys(CATEGORY_CONFIG);

const emptyProduct = {
  name: "",
  brand: "",
  category: "",
  price: 0,
  mrp: null as number | null,
  unit: "",
  image_url: "",
  video_url: "",
  is_trending: false,
};

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Product | null;
}

export const ProductDialog = ({ open, onOpenChange, editing }: ProductDialogProps) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyProduct);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        brand: editing.brand,
        category: editing.category,
        price: editing.price,
        mrp: editing.mrp ?? null,
        unit: editing.unit,
        image_url: editing.image_url || "",
        video_url: editing.video_url || "",
        is_trending: editing.is_trending || false,
      });
    } else {
      setForm(emptyProduct);
    }
  }, [editing, open]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: publicUrl }));
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.brand || !form.category || !form.unit || form.price <= 0) {
      toast.error("Fill all required fields");
      return;
    }

    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      category: form.category,
      price: form.price,
      mrp: form.mrp || null,
      unit: form.unit.trim(),
      image_url: form.image_url || null,
      video_url: form.video_url || null,
      is_trending: form.is_trending,
    };

    try {
      if (editing) {
        const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Product updated");
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
        toast.success("Product added");
      }
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-4 pb-4">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} maxLength={200} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Brand *</Label>
                <Input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} maxLength={100} />
              </div>
              <div>
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Price (₹) *</Label>
                <Input type="number" value={form.price || ""} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>MRP (₹)</Label>
                <Input type="number" value={form.mrp || ""} onChange={(e) => setForm((f) => ({ ...f, mrp: Number(e.target.value) || null }))} placeholder="Optional" />
              </div>
              <div>
                <Label>Unit *</Label>
                <Input value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} placeholder="e.g. 1kg" maxLength={50} />
              </div>
            </div>

            <div>
              <Label>Product Image</Label>
              <div className="flex items-center gap-3 mt-1">
                {form.image_url && (
                  <img src={form.image_url} alt="" className="h-16 w-16 rounded-md object-cover" />
                )}
                <div className="flex-1">
                  <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                  <p className="text-xs text-muted-foreground mt-1">Or paste URL below</p>
                  <Input
                    value={form.image_url}
                    onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Video className="h-4 w-4" /> Video Link
              </Label>
              <Input
                value={form.video_url}
                onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
                placeholder="YouTube or video URL"
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={form.is_trending} onCheckedChange={(v) => setForm((f) => ({ ...f, is_trending: v }))} />
              <Label>Mark as Trending 🔥</Label>
            </div>
          </div>
        </ScrollArea>
        <div className="border-t border-border px-6 py-4">
          <Button className="w-full" onClick={handleSave}>
            {editing ? "Update Product" : "Add Product"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
