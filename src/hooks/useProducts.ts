import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, brand, category, price, mrp, unit, image_url, video_url, is_trending, is_active, description, images")
        .order("brand", { ascending: true });

      if (error) throw error;
      return data as unknown as Product[];
    },
  });
};

export const useTrendingProducts = () => {
  return useQuery({
    queryKey: ["products", "trending"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_trending", true)
        .order("name", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};
