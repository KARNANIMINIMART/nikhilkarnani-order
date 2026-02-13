import { useState } from "react";
import { Product } from "@/types/product";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";
import { Plus, Minus, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface ProductDetailDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProductDetailDialog = ({ product, open, onOpenChange }: ProductDetailDialogProps) => {
  const [imgIndex, setImgIndex] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const increaseQuantity = useCartStore((s) => s.increaseQuantity);
  const decreaseQuantity = useCartStore((s) => s.decreaseQuantity);

  if (!product) return null;

  const allImages = [
    ...(product.image_url ? [product.image_url] : []),
    ...(product.images?.filter((img) => img && img !== product.image_url) || []),
  ];

  const cartItem = items.find((i) => i.product.id === product.id);
  const cartQty = cartItem?.quantity || 0;

  const discount = product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const handleAdd = () => {
    addItem(product);
    toast.success(`${product.name} added to cart`, { duration: 1500 });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{product.name}</DialogTitle>
        </DialogHeader>

        {/* Image Gallery */}
        {allImages.length > 0 && (
          <div className="relative">
            <img
              src={allImages[imgIndex] || allImages[0]}
              alt={product.name}
              className="w-full h-64 object-cover rounded-lg"
            />
            {allImages.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80"
                  onClick={() => setImgIndex((i) => (i - 1 + allImages.length) % allImages.length)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80"
                  onClick={() => setImgIndex((i) => (i + 1) % allImages.length)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="flex justify-center gap-1.5 mt-2">
                  {allImages.map((_, i) => (
                    <button
                      key={i}
                      className={`h-2 w-2 rounded-full transition-colors ${i === imgIndex ? "bg-primary" : "bg-muted-foreground/30"}`}
                      onClick={() => setImgIndex(i)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-primary">{product.brand}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{product.unit}</span>
            <span className="text-muted-foreground">•</span>
            <span className="inline-block rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {product.category}
            </span>
          </div>

          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          <div className="flex items-center justify-between pt-2">
            <div>
              {product.mrp && product.mrp > product.price && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground line-through">MRP ₹{product.mrp}</span>
                  {discount > 0 && (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">
                      {discount}% OFF
                    </span>
                  )}
                </div>
              )}
              <div className="text-3xl font-bold text-foreground">₹{product.price}</div>
            </div>

            {cartQty === 0 ? (
              <Button onClick={handleAdd} className="gap-2">
                <Plus className="h-4 w-4" /> Add to Cart
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => decreaseQuantity(product.id)}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-semibold">{cartQty}</span>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => increaseQuantity(product.id)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
