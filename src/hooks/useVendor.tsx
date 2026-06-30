import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useVendor() {
  const { user } = useAuth();

  const { data: vendor, isLoading, refetch } = useQuery({
    queryKey: ["vendor-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendors" as any)
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data as any;
    },
    enabled: !!user,
  });

  const isVendor = !!vendor && vendor.status === "approved";
  const isPendingVendor = !!vendor && vendor.status === "pending";
  const isRejectedVendor = !!vendor && vendor.status === "rejected";

  return { vendor, isVendor, isPendingVendor, isRejectedVendor, isLoading, refetch };
}
