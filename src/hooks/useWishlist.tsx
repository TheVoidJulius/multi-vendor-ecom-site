import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { WishlistItem } from "@/lib/types";
import { toast } from "sonner";

export function useWishlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["wishlist", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("wishlist_items")
        .select("*, products(*)")
        .eq("user_id", user.id);
      if (error) throw error;
      return data as WishlistItem[];
    },
    enabled: !!user,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["wishlist"] });

  const toggleMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Please sign in");
      const existing = items.find((i) => i.product_id === productId);
      if (existing) {
        await supabase.from("wishlist_items").delete().eq("id", existing.id);
      } else {
        await supabase.from("wishlist_items").insert({ user_id: user.id, product_id: productId });
      }
    },
    onSuccess: () => { invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const isInWishlist = (productId: string) => items.some((i) => i.product_id === productId);

  return {
    items,
    isLoading,
    toggleWishlist: (productId: string) => toggleMutation.mutateAsync(productId),
    isInWishlist,
  };
}
