import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useAdminGuard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
    if (!loading && !roleLoading && user && isAdmin === false) {
      navigate("/");
    }
  }, [loading, roleLoading, user, isAdmin, navigate]);

  return { isAdmin: !!isAdmin, isLoading: loading || roleLoading };
}
