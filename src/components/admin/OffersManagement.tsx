import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useOffers, Offer } from "@/hooks/useOffers";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";

export const OffersManagement = () => {
  const queryClient = useQueryClient();
  const { data: offers = [], isLoading } = useOffers();
  const { data: products = [] } = useProducts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    start_date: "",
    end_date: "",
    product_ids: [] as string[],
    max_qty_per_order: "",
    is_active: true,
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", description: "", discount_type: "percentage", discount_value: "", start_date: "", end_date: "", product_ids: [], max_qty_per_order: "", is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (o: Offer) => {
    setEditing(o);
    setForm({
      title: o.title,
      description: o.description || "",
      discount_type: o.discount_type,
      discount_value: String(o.discount_value),
      start_date: o.start_date.slice(0, 16),
      end_date: o.end_date.slice(0, 16),
      product_ids: o.product_ids || [],
      max_qty_per_order: o.max_qty_per_order ? String(o.max_qty_per_order) : "",
      is_active: o.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.discount_value || !form.start_date || !form.end_date) {
      toast.error("Fill required fields");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      start_date: new Date(form.start_date).toISOString(),
      end_date: new Date(form.end_date).toISOString(),
      product_ids: form.product_ids,
      max_qty_per_order: form.max_qty_per_order ? parseInt(form.max_qty_per_order) : null,
      is_active: form.is_active,
    };

    try {
      if (editing) {
        const { error } = await supabase.from("offers").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Offer updated");
      } else {
        const { error } = await supabase.from("offers").insert(payload);
        if (error) throw error;
        toast.success("Offer created");
      }
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this offer?")) return;
    try {
      const { error } = await supabase.from("offers").delete().eq("id", id);
      if (error) throw error;
      toast.success("Offer deleted");
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  };

  const toggleProductId = (id: string) => {
    setForm((f) => ({
      ...f,
      product_ids: f.product_ids.includes(id) ? f.product_ids.filter((p) => p !== id) : [...f.product_ids, id],
    }));
  };

  const now = new Date();

  return (
    <div className="space-y-4">
      <Button onClick={openCreate} className="gap-2">
        <Plus className="h-4 w-4" /> Create Offer
      </Button>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-2">
          {offers.map((o) => {
            const isLive = o.is_active && new Date(o.start_date) <= now && new Date(o.end_date) >= now;
            return (
              <div key={o.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    <p className="font-medium text-foreground">{o.title}</p>
                    {isLive && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">LIVE</span>}
                    {!o.is_active && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Inactive</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {o.discount_value}{o.discount_type === "percentage" ? "%" : "₹"} off • {o.product_ids.length} products • {new Date(o.start_date).toLocaleDateString()} – {new Date(o.end_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(o)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(o.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {offers.length === 0 && <p className="text-sm text-muted-foreground">No offers yet</p>}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Offer" : "Create Offer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Discount Type</Label>
                <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Discount Value *</Label>
                <Input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date *</Label>
                <Input type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Max Qty Per Order</Label>
              <Input type="number" value={form.max_qty_per_order} onChange={(e) => setForm({ ...form, max_qty_per_order: e.target.value })} placeholder="Leave empty for no limit" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Active</Label>
            </div>
            <div>
              <Label>Products ({form.product_ids.length} selected)</Label>
              <ScrollArea className="h-48 border rounded-md p-2 mt-1">
                {products.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 py-1">
                    <Checkbox checked={form.product_ids.includes(p.id)} onCheckedChange={() => toggleProductId(p.id)} />
                    <span className="text-sm">{p.name} - {p.brand}</span>
                  </div>
                ))}
              </ScrollArea>
            </div>
            <Button className="w-full" onClick={handleSave}>{editing ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
