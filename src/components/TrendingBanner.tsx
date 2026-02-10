import { useTrendingProducts } from "@/hooks/useProducts";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Flame } from "lucide-react";
import { toast } from "sonner";

export const TrendingBanner = () => {
  const { data: trending = [] } = useTrendingProducts();
  const addItem = useCartStore((state) => state.addItem);

  if (trending.length === 0) return null;

  const handleAdd = (product: typeof trending[0]) => {
    addItem(product);
    toast.success(`${product.name} added to cart`, { duration: 2000 });
  };

  return (
    <div className="mb-8 rounded-xl border border-accent/30 bg-gradient-to-r from-accent/5 via-accent/10 to-accent/5 p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20">
          <Flame className="h-4 w-4 text-accent" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Trending Now</h2>
        <TrendingUp className="h-4 w-4 text-accent" />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {trending.map((product) => (
          <div
            key={product.id}
            className="min-w-[200px] flex-shrink-0 rounded-lg border border-border bg-card p-4 transition-all hover:shadow-md hover:scale-[1.02]"
          >
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                className="mb-3 h-24 w-full rounded-md object-cover"
                loading="lazy"
              />
            )}
            <h3 className="text-sm font-semibold text-foreground leading-tight mb-1">
              {product.name}
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              {product.brand} • {product.unit}
            </p>
            <div className="flex items-center justify-between">
              <div>
                {product.mrp && product.mrp > product.price && (
                  <span className="text-xs text-muted-foreground line-through mr-1">
                    ₹{product.mrp}
                  </span>
                )}
                <span className="text-sm font-bold text-primary">₹{product.price}</span>
              </div>
              <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => handleAdd(product)}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
