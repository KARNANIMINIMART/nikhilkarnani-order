import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Minus, Plus, Trash2, Send, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { ScrollArea } from "@/components/ui/scroll-area";

const WHATSAPP_NUMBER = "918112296227";

interface CartProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const Cart = ({ open, onOpenChange }: CartProps) => {
  const { items, removeItem, increaseQuantity, decreaseQuantity, getTotal, clearCart } = useCartStore();
  const [customerName, setCustomerName] = useState("");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get current user and their profile
    const loadUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Try to get the user's phone from their profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("phone")
          .eq("id", user.id)
          .maybeSingle();
        
        if (profile?.phone) {
          setCustomerName(profile.phone);
        }
      }
    };

    loadUserProfile();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const generateOrderImage = (): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const padding = 40;
      const lineHeight = 32;
      const headerHeight = 80;
      const itemCount = items.length;
      const canvasWidth = 600;
      const canvasHeight = headerHeight + padding * 2 + itemCount * (lineHeight + 12) + 120;

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Header bar
      ctx.fillStyle = "#16a34a";
      ctx.fillRect(0, 0, canvasWidth, headerHeight);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px Arial, sans-serif";
      ctx.fillText(`Order from ${customerName.trim()}`, padding, 50);

      let y = headerHeight + padding;

      // Column headers
      ctx.fillStyle = "#6b7280";
      ctx.font = "bold 14px Arial, sans-serif";
      ctx.fillText("ITEM", padding, y);
      ctx.fillText("QTY", 360, y);
      ctx.fillText("AMOUNT", 460, y);
      y += 8;
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvasWidth - padding, y);
      ctx.stroke();
      y += 20;

      // Items
      ctx.font = "15px Arial, sans-serif";
      items.forEach((item) => {
        ctx.fillStyle = "#111827";
        ctx.fillText(`${item.product.name}`, padding, y);
        ctx.fillStyle = "#6b7280";
        ctx.font = "13px Arial, sans-serif";
        const mrpText = item.product.mrp && item.product.mrp > item.product.price ? ` (MRP ₹${item.product.mrp})` : "";
        ctx.fillText(`${item.product.brand} • ${item.product.unit}${mrpText}`, padding, y + 18);
        ctx.fillStyle = "#111827";
        ctx.font = "15px Arial, sans-serif";
        ctx.fillText(`x${item.quantity}`, 370, y + 8);
        ctx.fillText(`₹${item.product.price * item.quantity}`, 460, y + 8);
        y += lineHeight + 12;
      });

      // Separator
      y += 8;
      ctx.strokeStyle = "#d1d5db";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvasWidth - padding, y);
      ctx.stroke();
      y += 30;

      // Total
      ctx.fillStyle = "#16a34a";
      ctx.font = "bold 24px Arial, sans-serif";
      ctx.fillText(`Total: ₹${getTotal()}`, padding, y);

      // Footer
      y += 36;
      ctx.fillStyle = "#9ca3af";
      ctx.font = "12px Arial, sans-serif";
      ctx.fillText(`📍 Delivery: Jaipur  •  ⏰ Next-day delivery  •  ${new Date().toLocaleDateString()}`, padding, y);

      canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.92);
    });
  };

  const handleWhatsAppOrder = async () => {
    const name = customerName.trim();
    if (!name) {
      toast.error("Please enter your name");
      return;
    }

    if (name.length > 100) {
      toast.error("Name must be less than 100 characters");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Save order to database if user is authenticated
    if (user) {
      try {
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            customer_name: name,
            total_amount: getTotal(),
            status: "sent",
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

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItems);

        if (itemsError) throw itemsError;

        toast.success("Order saved to history");
      } catch (error: any) {
        console.error("Error saving order:", error);
        toast.error("Failed to save order to history");
      }
    }

    try {
      const imageBlob = await generateOrderImage();
      const file = new File([imageBlob], "order.jpg", { type: "image/jpeg" });

      // Try Web Share API (works on mobile)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Order",
          text: `Order from ${name} - Total: ₹${getTotal()}`,
        });
        toast.success("Order shared!");
      } else {
        // Fallback: download image + open WhatsApp with text
        const url = URL.createObjectURL(imageBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "order.jpg";
        a.click();
        URL.revokeObjectURL(url);

        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
          `Order from ${name} - Total: ₹${getTotal()}. Please see attached image.`
        )}`;
        window.open(whatsappUrl, "_blank");
        toast.success("Image downloaded! Attach it in WhatsApp.");
      }
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to share order");
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Your Order</DialogTitle>
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-destructive hover:text-destructive h-8"
              >
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
            {/* Customer Name Input - Top Section */}
            <div className="px-6 pt-4">
              <Label htmlFor="customerName" className="mb-2 block text-sm font-medium">
                Your Name / Phone *
              </Label>
              <Input
                id="customerName"
                placeholder="Enter your name or phone"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                maxLength={100}
              />
              {user && (
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-filled from your profile
                </p>
              )}
            </div>

            <Separator className="my-4" />

            {/* Scrollable Items List */}
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-3 pb-4">
                {items.map((item) => (
                  <div key={item.product.id} className="rounded-lg border border-border p-3">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-foreground leading-tight">
                          {item.product.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {item.product.brand} • {item.product.unit}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => decreaseQuantity(item.product.id)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => increaseQuantity(item.product.id)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="font-semibold text-foreground">
                        ₹{item.product.price * item.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Bottom Section - Total and Submit */}
            <div className="border-t border-border px-6 py-4 bg-muted/20">
              <div className="mb-4 flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">₹{getTotal()}</span>
              </div>

              <Button
                className="w-full gap-2"
                size="lg"
                onClick={handleWhatsAppOrder}
              >
                <Send className="h-4 w-4" />
                Send Order via WhatsApp
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-3">
                Order will be sent to +91 81122 96227
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
