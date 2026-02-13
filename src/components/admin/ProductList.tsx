import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Image, Search, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Product } from "@/types/product";
import { ProductDialog } from "./ProductDialog";

interface ProductListProps {
  products: Product[];
}

export const ProductList = ({ products }: ProductListProps) => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("");
  const [bulkPriceChange, setBulkPriceChange] = useState("");

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  };

  const handleBulkAction = async () => {
    if (selected.size === 0) {
      toast.error("Select products first");
      return;
    }

    const ids = Array.from(selected);

    try {
      if (bulkAction === "trending_on") {
        const { error } = await supabase.from("products").update({ is_trending: true }).in("id", ids);
        if (error) throw error;
        toast.success(`${ids.length} products marked trending`);
      } else if (bulkAction === "trending_off") {
        const { error } = await supabase.from("products").update({ is_trending: false }).in("id", ids);
        if (error) throw error;
        toast.success(`${ids.length} products unmarked trending`);
      } else if (bulkAction === "price_increase" || bulkAction === "price_decrease") {
        const pct = parseFloat(bulkPriceChange);
        if (!pct || pct <= 0) {
          toast.error("Enter a valid percentage");
          return;
        }
        const multiplier = bulkAction === "price_increase" ? 1 + pct / 100 : 1 - pct / 100;
        const selectedProducts = products.filter((p) => ids.includes(p.id));
        
        for (const product of selectedProducts) {
          const newPrice = Math.round(product.price * multiplier);
          const { error } = await supabase.from("products").update({ price: newPrice }).eq("id", product.id);
          if (error) throw error;
        }
        toast.success(`${ids.length} products price updated by ${pct}%`);
      } else if (bulkAction === "delete") {
        if (!confirm(`Delete ${ids.length} products?`)) return;
        const { error } = await supabase.from("products").delete().in("id", ids);
        if (error) throw error;
        toast.success(`${ids.length} products deleted`);
      }

      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSelected(new Set());
      setBulkAction("");
      setBulkPriceChange("");
    } catch (err: any) {
      toast.error(err.message || "Bulk action failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      toast.success("Deleted");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 flex-wrap rounded-lg border border-primary/30 bg-primary/5 p-3">
          <span className="text-sm font-medium text-foreground">{selected.size} selected</span>
          <Select value={bulkAction} onValueChange={setBulkAction}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Bulk action..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trending_on">
                <span className="flex items-center gap-2"><TrendingUp className="h-3 w-3" /> Mark Trending</span>
              </SelectItem>
              <SelectItem value="trending_off">
                <span className="flex items-center gap-2"><TrendingDown className="h-3 w-3" /> Unmark Trending</span>
              </SelectItem>
              <SelectItem value="price_increase">
                <span className="flex items-center gap-2"><DollarSign className="h-3 w-3" /> Price Increase %</span>
              </SelectItem>
              <SelectItem value="price_decrease">
                <span className="flex items-center gap-2"><DollarSign className="h-3 w-3" /> Price Decrease %</span>
              </SelectItem>
              <SelectItem value="delete">
                <span className="flex items-center gap-2"><Trash2 className="h-3 w-3" /> Delete</span>
              </SelectItem>
            </SelectContent>
          </Select>
          {(bulkAction === "price_increase" || bulkAction === "price_decrease") && (
            <Input
              type="number"
              placeholder="e.g. 10"
              value={bulkPriceChange}
              onChange={(e) => setBulkPriceChange(e.target.value)}
              className="w-24"
            />
          )}
          <Button size="sm" onClick={handleBulkAction} disabled={!bulkAction}>
            Apply
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setSelected(new Set()); setBulkAction(""); }}>
            Clear
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <Checkbox
          checked={filtered.length > 0 && selected.size === filtered.length}
          onCheckedChange={toggleAll}
        />
        <p className="text-sm text-muted-foreground">{filtered.length} products</p>
      </div>

      <div className="space-y-2">
        {filtered.map((product) => (
          <div key={product.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
            <Checkbox
              checked={selected.has(product.id)}
              onCheckedChange={() => toggleSelect(product.id)}
            />
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {product.image_url ? (
                <img src={product.image_url} alt="" className="h-10 w-10 rounded-md object-cover flex-shrink-0" />
              ) : (
                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                  <Image className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.brand} • {product.category} • {product.unit}
                  {product.is_trending && " • 🔥 Trending"}
                  {product.is_active === false && " • ⛔ Inactive"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Switch
                checked={product.is_active !== false}
                onCheckedChange={async (v) => {
                  try {
                    const { error } = await supabase.from("products").update({ is_active: v }).eq("id", product.id);
                    if (error) throw error;
                    queryClient.invalidateQueries({ queryKey: ["products"] });
                  } catch (err: any) {
                    toast.error(err.message || "Failed");
                  }
                }}
              />
              <div className="text-right">
                {product.mrp && product.mrp > product.price && (
                  <p className="text-xs text-muted-foreground line-through">₹{product.mrp}</p>
                )}
                <p className="text-sm font-bold text-foreground">₹{product.price}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(product); setDialogOpen(true); }}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(product.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
      />
    </div>
  );
};
