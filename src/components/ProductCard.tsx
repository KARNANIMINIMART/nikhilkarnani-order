import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCartStore } from "@/store/cartStore";
import { Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

type ProductCardProps = {
  product: Product;
};

export const ProductCard = ({ product }: ProductCardProps) => {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addItem(product);
    toast.success(`${product.name} added to cart`, {
      duration: 2000,
    });
  };

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
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
          
          <div className="inline-block rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
            {product.category}
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-3">
          <div className="text-2xl font-bold text-foreground">
            ₹{product.price}
          </div>
          <Button
            onClick={handleAddToCart}
            size="sm"
            className="gap-2 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
    </Card>
  );
};
