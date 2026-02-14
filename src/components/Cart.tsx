import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Minus, Plus, Trash2, Send, ShoppingCart, Clock, LogIn, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const WHATSAPP_NUMBER = "918112296227";

interface CartProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const Cart = ({ open, onOpenChange }: CartProps) => {
  const { items, removeItem, increaseQuantity, decreaseQuantity, getTotal, clearCart } = useCartStore();
  const [customerName, setCustomerName] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const { data: settings } = useSiteSettings();
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("phone, outlet_name, owner_name")
          .eq("id", user.id)
          .maybeSingle();
        if (profile) {
          setCustomerName(profile.outlet_name || profile.owner_name || profile.phone || "");
        }
      }
    };
    loadUserProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => { setUser(session?.user ?? null); }
    );
    return () => subscription.unsubscribe();
  }, []);

  const handleWhatsAppOrder = async () => {
    if (!user) {
      toast.error("Please sign in to place an order");
      navigate("/auth");
      onOpenChange(false);
      return;
    }

    const name = customerName.trim();
    if (!name) { toast.error("Please enter your name"); return; }
    if (name.length > 100) { toast.error("Name must be less than 100 characters"); return; }
    if (items.length === 0) { toast.error("Your cart is empty"); return; }

    // Save order to database
    try {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          customer_name: name,
          total_amount: getTotal(),
          status: "sent",
          special_requests: specialRequests.trim() || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: orderData.id,
        product_name: item.product.name,
        product_brand: item.product.brand,
        product_unit: item.product.unit,
        product_image: null,
        quantity: item.quantity,
        price_per_unit: item.product.price,
        subtotal: item.product.price * item.quantity,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;
      toast.success("Order saved to history");
    } catch (error: any) {
      console.error("Error saving order:", error);
      toast.error("Failed to save order to history");
    }

    try {
      let orderText = `*Order from ${name}*\n\n`;
      items.forEach((item) => {
        const mrpText = item.product.mrp && item.product.mrp > item.product.price ? ` (MRP ₹${item.product.mrp})` : "";
        orderText += `• ${item.product.name} - ${item.product.brand} ${item.product.unit}${mrpText}\n  Qty: ${item.quantity} × ₹${item.product.price} = ₹${item.product.price * item.quantity}\n`;
      });
      orderText += `\n*Total: ₹${getTotal()}*`;
      if (specialRequests.trim()) {
        orderText += `\n\n📝 *Special Requests:*\n${specialRequests.trim()}`;
      }

      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(orderText)}`;
      window.open(whatsappUrl, "_blank");
      toast.success("Opening WhatsApp...");
    } catch (error) {
      console.error("WhatsApp error:", error);
      toast.error("Failed to open WhatsApp");
    }

    setSpecialRequests("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Your Order</DialogTitle>
            {items.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:text-destructive h-8">
                Clear
              </Button>
            )}
          </div>
        </DialogHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 font-semibold text-foreground">Your cart is empty</h3>
            <p className="text-sm text-muted-foreground">Add products to get started</p>
          </div>
        ) : (
          <>
            {/* Customer Name */}
            <div className="px-6 pt-4">
              <Label htmlFor="customerName" className="mb-2 block text-sm font-medium">Your Name / Outlet *</Label>
              <Input id="customerName" placeholder="Enter your name or outlet" value={customerName} onChange={(e) => setCustomerName(e.target.value)} maxLength={100} />
              {user && <p className="text-xs text-muted-foreground mt-1">Auto-filled from your profile</p>}
            </div>

            <Separator className="my-4" />

            {/* Scrollable Items */}
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-3 pb-4">
                {items.map((item) => (
                  <div key={item.product.id} className="rounded-lg border border-border p-3">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-foreground leading-tight">{item.product.name}</h4>
                        <p className="text-xs text-muted-foreground">{item.product.brand} • {item.product.unit}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeItem(item.product.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => decreaseQuantity(item.product.id)}><Minus className="h-3 w-3" /></Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => increaseQuantity(item.product.id)}><Plus className="h-3 w-3" /></Button>
                      </div>
                      <span className="font-semibold text-foreground">₹{item.product.price * item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Special Requests */}
            <div className="px-6 pb-2">
              <Label htmlFor="specialRequests" className="mb-2 block text-sm font-medium flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> Special Requests (Optional)
              </Label>
              <Textarea
                id="specialRequests"
                placeholder="Any specific requirements? e.g. delivery time, packaging..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                maxLength={500}
                className="resize-none h-16 text-sm"
              />
            </div>

            {/* Bottom Section */}
            <div className="border-t border-border px-6 py-4 bg-muted/20">
              {settings?.delivery_timing && (
                <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>{settings.delivery_timing}</span>
                </div>
              )}

              <div className="mb-4 flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">₹{getTotal()}</span>
              </div>

              {user ? (
                <Button className="w-full gap-2" size="lg" onClick={handleWhatsAppOrder}>
                  <Send className="h-4 w-4" /> Send Order via WhatsApp
                </Button>
              ) : (
                <Button className="w-full gap-2" size="lg" onClick={() => { onOpenChange(false); navigate("/auth"); }}>
                  <LogIn className="h-4 w-4" /> Sign In to Place Order
                </Button>
              )}

              <p className="text-xs text-center text-muted-foreground mt-3">
                {user ? "Order will be sent to +91 81122 96227" : "Sign in with Google to place your order"}
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
