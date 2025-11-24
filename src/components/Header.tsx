import { ShoppingCart, Store } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

export const Header = () => {
  const itemCount = useCartStore((state) => state.getItemCount());

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Store className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Ayekart HoReCa</h1>
              <p className="text-xs text-muted-foreground">Premium Food Supplies</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:block text-sm text-muted-foreground">
              Jaipur • Next-day delivery
            </div>
            <div className="relative">
              <ShoppingCart className="h-6 w-6 text-foreground" />
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                  {itemCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
