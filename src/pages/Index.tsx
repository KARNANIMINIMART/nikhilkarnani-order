import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Filters } from "@/components/Filters";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetailDialog } from "@/components/ProductDetailDialog";
import { TrendingBanner } from "@/components/TrendingBanner";
import { Cart } from "@/components/Cart";
import { useProducts } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { CheckCircle, Truck, Phone, ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";
import { Product } from "@/types/product";

const Index = () => {
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    brand: "all"
  });
  const [session, setSession] = useState<Session | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const itemCount = useCartStore((state) => state.getItemCount());
  const navigate = useNavigate();
  const { data: products = [], isLoading } = useProducts();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
      }
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (product.is_active === false) return false;
      const matchesSearch = product.name.
      toLowerCase().
      includes(filters.search.toLowerCase()) ||
      product.brand.toLowerCase().includes(filters.search.toLowerCase());

      const matchesCategory = filters.category === "all" || product.category === filters.category;
      const matchesBrand = filters.brand === "all" || product.brand === filters.brand;

      return matchesSearch && matchesCategory && matchesBrand;
    });
  }, [filters, products]);

  const categories = useMemo(() => Array.from(new Set(products.filter((p) => p.is_active !== false).map((p) => p.category))).sort(), [products]);
  const brands = useMemo(() => Array.from(new Set(products.filter((p) => p.is_active !== false).map((p) => p.brand))).sort(), [products]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        

















        {/* Trending Banner */}
        <TrendingBanner />

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <Filters onFilterChange={setFilters} categories={categories} brands={brands} />

          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"} found
            </p>
          </div>

          {isLoading ?
          <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div> :
          filteredProducts.length === 0 ?
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
              <p className="mb-2 text-lg font-medium text-foreground">No products found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
            </div> :

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) =>
            <ProductCard key={product.id} product={product} onClickDetail={setDetailProduct} />
            )}
            </div>
          }
        </div>
      </main>

      {/* Footer Banner */}
      <footer className="mt-16 border-t border-border">
        <div className="bg-gradient-to-r from-primary to-primary/80 py-6">
          <div className="container mx-auto px-4 text-center">
            <p className="text-lg font-bold text-primary-foreground">KARNANI MINIMART HORECA – Reliable HoReCa Food Service Supply

            </p>
          </div>
        </div>
        <div className="bg-muted/30">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
              <p>© 2025KARNANI MINIMART HORECA – Reliable HoReCa Food Service Supply</p>
              <p>Contact: +91 81122 96227</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Cart Button */}
      {itemCount > 0 &&
      <Button
        size="lg"
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-all z-40 animate-in fade-in slide-in-from-bottom-4"
        onClick={() => setCartOpen(true)}>

          <div className="relative">
            <ShoppingCart className="h-6 w-6" />
            <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground ring-2 ring-background">
              {itemCount}
            </span>
          </div>
        </Button>
      }

      <Cart open={cartOpen} onOpenChange={setCartOpen} />
      <ProductDetailDialog product={detailProduct} open={!!detailProduct} onOpenChange={(open) => {if (!open) setDetailProduct(null);}} />
    </div>);

};

export default Index;