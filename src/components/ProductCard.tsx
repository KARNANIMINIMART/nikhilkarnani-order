import { useState } from "react";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCartStore } from "@/store/cartStore";
import { Plus, Check, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

type ProductCardProps = {
  product: Product;
};

export const ProductCard = ({ product }: ProductCardProps) => {
  const addItem = useCartStore((state) => state.addItem);
  const items = useCartStore((state) => state.items);
  const [justAdded, setJustAdded] = useState(false);

  const cartItem = items.find((i) => i.product.id === product.id);
  const cartQty = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    addItem(product);
    setJustAdded(true);
    toast.success(`${product.name} added to cart`, { duration: 2000 });
    setTimeout(() => setJustAdded(false), 1200);
  };

  const discount = product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
      {product.image_url && (
        <div className="relative overflow-hidden">
          <img
            src={product.image_url}
            alt={product.name}
            className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {discount > 0 && (
            <span className="absolute top-2 right-2 rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
              {discount}% OFF
            </span>
          )}
          {product.is_trending && (
            <span className="absolute top-2 left-2 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
              🔥 Trending
            </span>
          )}
        </div>
      )}
      <div className="p-5">
        <div className="mb-4">
          <div className="mb-2 flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground leading-tight mb-1">
                {product.name}
              </h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-primary">{product.brand}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{product.unit}</span>
              </div>
            </div>
          </div>

          {!product.image_url && discount > 0 && (
            <span className="inline-block rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive mr-2">
              {discount}% OFF
            </span>
          )}
          
          <div className="inline-block rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
            {product.category}
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-3">
          <div>
            {product.mrp && product.mrp > product.price && (
              <div className="text-sm text-muted-foreground line-through">
                MRP ₹{product.mrp}
              </div>
            )}
            <div className="text-2xl font-bold text-foreground">
              ₹{product.price}
            </div>
          </div>
          <Button
            onClick={handleAddToCart}
            size="sm"
            variant={justAdded ? "secondary" : "default"}
            className={`gap-2 transition-all duration-300 ${justAdded ? "scale-110" : ""}`}
          >
            {justAdded ? (
              <>
                <Check className="h-4 w-4 animate-scale-in" />
                Added
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add
                {cartQty > 0 && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                    {cartQty}
                  </span>
                )}
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};
