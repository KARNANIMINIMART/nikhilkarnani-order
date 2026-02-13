import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Video, X, Plus } from "lucide-react";
import { Product } from "@/types/product";

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
  is_active: true,
  description: "",
  images: [] as string[],
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

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("name").eq("is_active", true).order("name");
      if (error) throw error;
      return data.map((c: { name: string }) => c.name);
    },
  });

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
        is_active: editing.is_active !== false,
        description: editing.description || "",
        images: editing.images || [],
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

  const handleAdditionalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
      setForm((f) => ({ ...f, images: [...f.images, publicUrl] }));
      toast.success("Image added");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeAdditionalImage = (index: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
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
      is_active: form.is_active,
      description: form.description.trim() || null,
      images: form.images,
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
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Product description..."
                rows={3}
              />
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
                    {categories.map((c) => (
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
              <Label>Main Image</Label>
              <div className="flex items-center gap-3 mt-1">
                {form.image_url && (
                  <img src={form.image_url} alt="" className="h-16 w-16 rounded-md object-cover" />
                )}
                <div className="flex-1">
                  <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                  <Input
                    value={form.image_url}
                    onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                    placeholder="Or paste URL"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Additional Images</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {form.images.map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img} alt="" className="h-16 w-16 rounded-md object-cover" />
                    <button
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                      onClick={() => removeAdditionalImage(i)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="h-16 w-16 rounded-md border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-muted/50">
                  <Plus className="h-5 w-5 text-muted-foreground" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAdditionalImageUpload} disabled={uploading} />
                </label>
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

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Switch checked={form.is_trending} onCheckedChange={(v) => setForm((f) => ({ ...f, is_trending: v }))} />
                <Label>Trending 🔥</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
                <Label>{form.is_active ? "Active" : "Inactive"}</Label>
              </div>
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
