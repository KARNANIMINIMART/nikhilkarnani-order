import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, Send, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

const WHATSAPP_NUMBER = "918112296227";

export const Cart = () => {
  const { items, removeItem, increaseQuantity, decreaseQuantity, getTotal, clearCart } = useCartStore();
  const [customerName, setCustomerName] = useState("");

  const handleWhatsAppOrder = () => {
    if (!customerName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    const orderLines = items.map(
      (item) =>
        `• ${item.product.name} (${item.product.brand}, ${item.product.unit}) x ${item.quantity} = ₹${
          item.product.price * item.quantity
        }`
    );

    const message = [
      `*Order from ${customerName}*`,
      "",
      ...orderLines,
      "",
      `*Total: ₹${getTotal()}*`,
      "",
      "📍 Delivery: Jaipur",
      "⏰ Requested: Next-day delivery",
    ].join("\n");

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    
    toast.success("Opening WhatsApp...");
  };

  if (items.length === 0) {
    return (
      <Card className="sticky top-20 p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 font-semibold text-foreground">Your cart is empty</h3>
          <p className="text-sm text-muted-foreground">Add products to get started</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="sticky top-20 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Your Order</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearCart}
          className="text-destructive hover:text-destructive"
        >
          Clear
        </Button>
      </div>

      <div className="mb-4 space-y-3">
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

      <Separator className="my-4" />

      <div className="mb-4 flex items-center justify-between text-lg font-bold">
        <span>Total</span>
        <span className="text-primary">₹{getTotal()}</span>
      </div>

      <Separator className="my-4" />

      <div className="space-y-4">
        <div>
          <Label htmlFor="customerName" className="mb-2 block text-sm font-medium">
            Your Name *
          </Label>
          <Input
            id="customerName"
            placeholder="Enter your name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        <Button
          className="w-full gap-2"
          size="lg"
          onClick={handleWhatsAppOrder}
        >
          <Send className="h-4 w-4" />
          Send Order via WhatsApp
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Order will be sent to +91 81122 96227
        </p>
      </div>
    </Card>
  );
};
