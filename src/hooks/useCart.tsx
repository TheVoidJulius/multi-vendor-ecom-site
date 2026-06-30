import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { CartItem } from "@/lib/types";
import { toast } from "sonner";

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  itemCount: number;
  total: number;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["cart", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("cart_items")
        .select("*, products(*)")
        .eq("user_id", user.id);
      if (error) throw error;
      return data as CartItem[];
    },
    enabled: !!user,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["cart"] });

  const addMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      if (!user) throw new Error("Please sign in");
      const { error } = await supabase.from("cart_items").upsert(
        { user_id: user.id, product_id: productId, quantity },
        { onConflict: "user_id,product_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Added to cart"); },
    onError: (e) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) return;
      const { error } = await supabase.from("cart_items").delete().eq("user_id", user.id).eq("product_id", productId);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Removed from cart"); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      if (!user) return;
      if (quantity <= 0) {
        await supabase.from("cart_items").delete().eq("user_id", user.id).eq("product_id", productId);
      } else {
        await supabase.from("cart_items").update({ quantity }).eq("user_id", user.id).eq("product_id", productId);
      }
    },
    onSuccess: invalidate,
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.from("cart_items").delete().eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + (item.products?.price ?? 0) * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isLoading,
        itemCount,
        total,
        addItem: (productId, quantity) => addMutation.mutateAsync({ productId, quantity }),
        removeItem: (productId) => removeMutation.mutateAsync(productId),
        updateQuantity: (productId, quantity) => updateMutation.mutateAsync({ productId, quantity }),
        clearCart: () => clearMutation.mutateAsync(),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
