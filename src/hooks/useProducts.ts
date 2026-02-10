import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("brand", { ascending: true });

      if (error) throw error;
      return data;
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
