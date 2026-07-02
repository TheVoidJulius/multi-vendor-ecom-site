import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Star, Eye, Store } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import { cn, formatPrice } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className }: ProductCardProps) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const wishlisted = user ? isInWishlist(product.id) : false;

  const { data: vendor } = useQuery({
    queryKey: ["product-vendor", (product as any).vendor_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendors" as any)
        .select("store_name, store_slug")
        .eq("id", (product as any).vendor_id)
        .single();
      return data as any;
    },
    enabled: !!(product as any).vendor_id,
  });

  const discount = product.compare_at_price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : 0;

  return (
    <div className={cn("product-card group", className)}>
      {/* Image */}
      <Link to={`/products/${product.slug}`} className="product-card-image block aspect-[3/4]">
        <img
          src={product.images?.[0] || "/placeholder.svg"}
          alt={product.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.is_new && <span className="badge-new">New</span>}
          {discount > 0 && <span className="badge-sale">-{discount}%</span>}
          {product.is_featured && !product.is_new && !discount && (
            <span className="badge-featured">Featured</span>
          )}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />

        {/* Quick add button */}
        {(product.stock_quantity ?? 0) > 0 ? (
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-out">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); addItem(product.id); }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary/95 backdrop-blur-sm text-primary-foreground py-2.5 text-xs font-semibold tracking-wider uppercase transition-all duration-200 hover:bg-primary"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Add to Cart
            </button>
          </div>
        ) : (
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="w-full flex items-center justify-center gap-2 rounded-xl bg-destructive/90 backdrop-blur-sm text-destructive-foreground py-2.5 text-xs font-semibold tracking-wider uppercase">
              Out of Stock
            </div>
          </div>
        )}
      </Link>

      {/* Side actions */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
        <button
          onClick={(e) => { e.preventDefault(); user && toggleWishlist(product.id); }}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full bg-background/90 backdrop-blur-md shadow-md transition-all duration-200 hover:scale-110",
            wishlisted ? "text-destructive" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Heart className={cn("h-4 w-4", wishlisted && "fill-current")} />
        </button>
        <Link
          to={`/products/${product.slug}`}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-background/90 backdrop-blur-md shadow-md text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110"
        >
          <Eye className="h-4 w-4" />
        </Link>
      </div>

      {/* Product info */}
      <Link to={`/products/${product.slug}`} className="block p-4 pt-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60 mb-1.5">
          {(product as any).brands?.name}
        </p>
        <h3 className="text-sm font-medium text-foreground line-clamp-1 leading-snug">{product.name}</h3>
        {vendor && (
          <Link
            to={`/store/${vendor.store_slug}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 mt-1.5 text-[10px] text-gold hover:text-gold-dark transition-colors"
          >
            <Store className="h-3 w-3" />
            {vendor.store_name}
          </Link>
        )}

        {/* Rating */}
        {product.rating && product.rating > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3 w-3",
                    i < Math.round(product.rating!) ? "fill-gold text-gold" : "fill-muted text-muted"
                  )}
                />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground">
              ({product.review_count})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-base font-bold text-foreground">{formatPrice(product.price)}</span>
          {product.compare_at_price && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.compare_at_price)}</span>
          )}
        </div>
      </Link>
    </div>
  );
}
