import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export function useRoles() {
  return useQuery({
    queryKey: ["auth", "roles"],
    queryFn: async (): Promise<AppRole[]> => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.user.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role);
    },
    staleTime: 60_000,
  });
}

export function useCan() {
  const { data: roles = [] } = useRoles();
  const isAdmin = roles.includes("admin");
  const isManager = roles.includes("manager");
  return {
    roles,
    isAdmin,
    isManager,
    canManageEmployees: isAdmin || isManager,
    canDeleteEmployees: isAdmin,
  };
}