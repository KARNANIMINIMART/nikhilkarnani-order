import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Package, Check, Clock, Truck, MessageCircle } from "lucide-react";
import { format } from "date-fns";

type Order = {
  id: string;
  user_id: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
};

type OrderItem = {
  id: string;
  order_id: string;
  product_name: string;
  product_brand: string;
  product_unit: string;
  quantity: number;
  price_per_unit: number;
  subtotal: number;
  product_image: string | null;
};

const STATUS_OPTIONS = [
  { value: "sent", label: "Sent", icon: Clock, color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  { value: "confirmed", label: "Confirmed", icon: Check, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  { value: "delivered", label: "Delivered", icon: Truck, color: "bg-green-500/10 text-green-600 border-green-500/20" },
];

export const OrderManagement = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });

  const { data: orderItems = [] } = useQuery({
    queryKey: ["admin-order-items", expandedOrder],
    queryFn: async () => {
      if (!expandedOrder) return [];
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", expandedOrder);
      if (error) throw error;
      return data as OrderItem[];
    },
    enabled: !!expandedOrder,
  });

  const updateStatus = async (orderId: string, status: string, customerName: string) => {
    try {
      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
      if (error) throw error;
      toast.success(`Order marked as ${status}`);
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });

      // Send WhatsApp notification when delivered
      if (status === "delivered") {
        const msg = `Hi ${customerName}! 🎉 Your order has been *delivered* successfully. Thank you for ordering from KARNANI MINIMART - Premium HoReCa Food Supplies! 🙏`;
        // Look up user's phone from profiles
        const order = orders.find((o) => o.id === orderId);
        if (order) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("phone")
            .eq("id", order.user_id)
            .maybeSingle();
          if (profile?.phone) {
            const phone = profile.phone.replace(/\D/g, "");
            const whatsappUrl = `https://wa.me/${phone.startsWith("91") ? phone : "91" + phone}?text=${encodeURIComponent(msg)}`;
            window.open(whatsappUrl, "_blank");
          } else {
            toast.info("No phone number found for customer. WhatsApp notification skipped.");
          }
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    }
  };

  const filtered = orders.filter((o) => {
    const matchesSearch = o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (status: string) =>
    STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];

  if (isLoading) {
    return <p className="text-muted-foreground py-8 text-center">Loading orders...</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground mb-3">{filtered.length} orders</p>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            const isExpanded = expandedOrder === order.id;

            return (
              <div key={order.id} className="rounded-lg border border-border bg-card overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-foreground">{order.customer_name}</p>
                      <Badge variant="outline" className={statusConfig.color}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")} • ₹{order.total_amount}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {STATUS_OPTIONS.map((s) => (
                      <Button
                        key={s.value}
                        size="sm"
                        variant={order.status === s.value ? "default" : "outline"}
                        className="text-xs h-7 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus(order.id, s.value, order.customer_name);
                        }}
                      >
                        {s.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border px-4 py-3 bg-muted/20">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Order Items</p>
                    {orderItems.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Loading items...</p>
                    ) : (
                      <div className="space-y-2">
                        {orderItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 text-sm">
                            {item.product_image ? (
                              <img src={item.product_image} alt="" className="h-8 w-8 rounded object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded bg-muted" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground truncate">{item.product_name}</p>
                              <p className="text-xs text-muted-foreground">{item.product_brand} • {item.product_unit}</p>
                            </div>
                            <p className="text-sm text-foreground">
                              {item.quantity} × ₹{item.price_per_unit} = ₹{item.subtotal}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
