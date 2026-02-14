import { ShoppingCart, Store, LogOut, User, History, Shield } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useIsAdmin } from "@/hooks/useAdmin";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { Cart } from "@/components/Cart";

export const Header = () => {
  const itemCount = useCartStore((state) => state.getItemCount());
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const { data: isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out"
      });
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to log out",
        variant: "destructive"
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Store className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-base text-center">KARNANI MINIMART</h1>
              <p className="text-xs text-muted-foreground">​     </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:block text-sm text-muted-foreground">Mansarovar, Jaipur • Next-day delivery

            </div>
            
            {user &&
            <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground hidden md:inline">
                  {user.phone || "User"}
                </span>
              </div>
            }

            {user &&
            <>
                {isAdmin &&
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin")}
                className="gap-2 text-accent">

                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Button>
              }
                <Button variant="ghost" size="sm" onClick={() => navigate("/profile")} className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/orders")} className="gap-2">
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">Orders</span>
                </Button>
              </>
            }
            
            <Button variant="ghost" size="icon" className="relative" onClick={() => setCartOpen(true)}>
              <ShoppingCart className="h-6 w-6 text-foreground" />
              {itemCount > 0 &&
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                  {itemCount}
                </span>
              }
            </Button>

            {user ?
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button> :

            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            }
          </div>
        </div>
      </div>

      <Cart open={cartOpen} onOpenChange={setCartOpen} />
    </header>);

};