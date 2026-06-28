import type { Database } from "@/integrations/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"] & {
  brands?: Brand | null;
  categories?: Category | null;
};
export type Brand = Database["public"]["Tables"]["brands"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type CartItem = Database["public"]["Tables"]["cart_items"]["Row"] & {
  products?: Product | null;
};
export type WishlistItem = Database["public"]["Tables"]["wishlist_items"]["Row"] & {
  products?: Product | null;
};
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type Banner = Database["public"]["Tables"]["banners"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Address = Database["public"]["Tables"]["addresses"]["Row"];
