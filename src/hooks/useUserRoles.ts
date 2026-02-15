import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "salesperson" | "operations" | "editor" | "user";

export const useUserRoles = () => {
  return useQuery({
    queryKey: ["user-roles"],
    queryFn: async (): Promise<AppRole[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) throw error;
      return (data || []).map((r) => r.role as AppRole);
    },
  });
};

export const useHasRole = (...roles: AppRole[]) => {
  const { data: userRoles = [], ...rest } = useUserRoles();
  const hasRole = roles.some((r) => userRoles.includes(r));
  return { hasRole, roles: userRoles, ...rest };
};
