import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Filters } from "@/components/Filters";
import { ProductCard } from "@/components/ProductCard";
import { Cart } from "@/components/Cart";
import { PRODUCTS } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { CheckCircle, Truck, Phone } from "lucide-react";

const Index = () => {
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    brand: "all",
  });
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(filters.search.toLowerCase()) ||
        product.brand.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesCategory = filters.category === "all" || product.category === filters.category;
      const matchesBrand = filters.brand === "all" || product.brand === filters.brand;

      return matchesSearch && matchesCategory && matchesBrand;
    });
  }, [filters]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8 rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 p-8 text-center">
          <h1 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">
            Nikhil Karnani - Premium HoReCa Food Supplies
          </h1>
          <p className="mb-6 text-muted-foreground">
            Trusted partner for Veeba, Wizzie, Foodfest, Testo, Nutaste, Lactilas, Tasty Pixel, and more
          </p>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="text-foreground">Authentic Products</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-success" />
              <span className="text-foreground">Next-day Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-success" />
              <span className="text-foreground">+91 81122 96227</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Filters onFilterChange={setFilters} />
            
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"} found
              </p>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
                <p className="mb-2 text-lg font-medium text-foreground">No products found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <Cart />
          </div>
        </div>
      </main>

      <footer className="mt-16 border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
            <p>© 2025 Nikhil Karnani. Premium food supplies for Jaipur.</p>
            <p>Contact: +91 81122 96227</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
