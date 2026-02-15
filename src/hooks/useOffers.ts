import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Offer = {
  id: string;
  title: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  start_date: string;
  end_date: string;
  product_ids: string[];
  max_qty_per_order: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const useOffers = () => {
  return useQuery({
    queryKey: ["offers"],
    queryFn: async (): Promise<Offer[]> => {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Offer[];
    },
  });
};

export const useActiveOffers = () => {
  return useQuery({
    queryKey: ["offers", "active"],
    queryFn: async (): Promise<Offer[]> => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("is_active", true)
        .lte("start_date", now)
        .gte("end_date", now);
      if (error) throw error;
      return data as unknown as Offer[];
    },
  });
};

export const getProductOffer = (productId: string, offers: Offer[]): Offer | null => {
  const now = new Date();
  const applicable = offers.filter(
    (o) =>
      o.is_active &&
      new Date(o.start_date) <= now &&
      new Date(o.end_date) >= now &&
      o.product_ids.includes(productId)
  );
  if (applicable.length === 0) return null;
  // Return best discount
  return applicable.reduce((best, o) => {
    const bestVal = best.discount_type === "percentage" ? best.discount_value : best.discount_value;
    const oVal = o.discount_type === "percentage" ? o.discount_value : o.discount_value;
    return oVal > bestVal ? o : best;
  });
};

export const calcDiscountedPrice = (price: number, offer: Offer): number => {
  if (offer.discount_type === "percentage") {
    return Math.round(price * (1 - offer.discount_value / 100));
  }
  return Math.max(0, price - offer.discount_value);
};
