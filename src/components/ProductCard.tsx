import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCartStore } from "@/store/cartStore";
import { Plus, Minus } from "lucide-react";
import { toast } from "sonner";

type ProductCardProps = {
  product: Product;
  onClickDetail?: (product: Product) => void;
};

export const ProductCard = ({ product, onClickDetail }: ProductCardProps) => {
  const addItem = useCartStore((state) => state.addItem);
  const items = useCartStore((state) => state.items);
  const increaseQuantity = useCartStore((s) => s.increaseQuantity);
  const decreaseQuantity = useCartStore((s) => s.decreaseQuantity);

  const cartItem = items.find((i) => i.product.id === product.id);
  const cartQty = cartItem?.quantity || 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
    toast.success(`${product.name} added to cart`, { duration: 1500 });
  };

  const discount = product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  return (
    <Card
      className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer"
      onClick={() => onClickDetail?.(product)}
    >
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

          {cartQty === 0 ? (
            <Button onClick={handleAdd} size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add
            </Button>
          ) : (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => { e.stopPropagation(); decreaseQuantity(product.id); }}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-8 text-center text-sm font-semibold">{cartQty}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => { e.stopPropagation(); increaseQuantity(product.id); }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
