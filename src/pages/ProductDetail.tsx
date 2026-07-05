import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { Heart, ShoppingBag, Star, Minus, Plus, ChevronRight, Shield, Truck, RotateCcw, Store, MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import ProductReviews from "@/components/products/ProductReviews";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import type { Product } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";
import { toast } from "sonner";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [vendorMessage, setVendorMessage] = useState("");
  const [showVendorChat, setShowVendorChat] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, brands(*), categories(*)")
        .eq("slug", slug!)
        .single();
      return data as Product;
    },
    enabled: !!slug,
  });

  const { data: vendor } = useQuery({
    queryKey: ["product-vendor-detail", (product as any)?.vendor_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendors" as any)
        .select("store_name, store_slug, logo_url")
        .eq("id", (product as any).vendor_id)
        .single();
      return data as any;
    },
    enabled: !!(product as any)?.vendor_id,
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ["related-products", product?.category_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, brands(*)")
        .eq("category_id", product!.category_id!)
        .neq("id", product!.id)
        .limit(4);
      return (data || []) as Product[];
    },
    enabled: !!product?.category_id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container-premium py-16">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
            <div className="aspect-square rounded-3xl skeleton" />
            <div className="space-y-4 py-8">
              <div className="h-4 w-20 skeleton" />
              <div className="h-10 w-3/4 skeleton" />
              <div className="h-4 w-1/2 skeleton" />
              <div className="h-4 w-full skeleton mt-8" />
              <div className="h-4 w-4/5 skeleton" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container-premium py-20 text-center">
          <p className="text-muted-foreground">Product not found.</p>
        </div>
      </Layout>
    );
  }

  const wishlisted = user ? isInWishlist(product.id) : false;
  const discount = product.compare_at_price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : 0;

  const isOutOfStock = (product.stock_quantity ?? 0) <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error("This product is out of stock");
      return;
    }
    addItem(product.id, quantity);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="container-premium py-4">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to={`/categories/${(product as any).categories?.slug || ''}`} className="hover:text-foreground transition-colors">
            {(product as any).categories?.name || "Products"}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">{product.name}</span>
        </nav>
      </div>

      <div className="container-premium pb-20">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          {/* Images */}
          <div className="space-y-4 animate-fade-in">
            <div className="aspect-square overflow-hidden rounded-3xl bg-secondary/50 border border-border/30">
              <img
                src={product.images?.[selectedImage] || "/placeholder.svg"}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      "w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-200",
                      i === selectedImage ? "border-foreground shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="flex flex-col animate-fade-in-up opacity-0" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Link to={`/brands/${(product as any).brands?.slug || ''}`} className="text-xs font-bold uppercase tracking-[0.15em] text-accent hover:underline">
                {(product as any).brands?.name}
              </Link>
              {product.is_new && <span className="badge-new">New</span>}
              {vendor && (
                <Link to={`/store/${vendor.store_slug}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors ml-2 px-2.5 py-1 rounded-full bg-secondary/60">
                  <Store className="h-3 w-3" />
                  Sold by {vendor.store_name}
                </Link>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-[-0.02em] leading-[1.1]">
              {product.name}
            </h1>

            {/* Rating */}
            {product.rating && product.rating > 0 && (
              <div className="flex items-center gap-2.5 mt-4">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < Math.round(product.rating!) ? "fill-warning text-warning" : "fill-muted text-muted"
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.rating} · {product.review_count} reviews
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mt-6">
              <span className="text-4xl font-bold text-foreground">
                {formatPrice(product.price)}
              </span>
              {product.compare_at_price && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.compare_at_price)}
                  </span>
                  <span className="badge-sale">-{discount}%</span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-muted-foreground mt-6 leading-[1.7] text-[15px]">
              {product.description}
            </p>

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-3 mt-8">
              <div className="flex items-center gap-3 border border-border rounded-full px-4 py-2.5">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-muted-foreground hover:text-foreground transition-colors">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold w-8 text-center text-foreground">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button onClick={handleAddToCart} disabled={isOutOfStock} className={cn("btn-primary flex-1 group", isOutOfStock && "opacity-50 cursor-not-allowed")}>
                <ShoppingBag className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </button>
              <button
                onClick={() => user && toggleWishlist(product.id)}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300",
                  wishlisted ? "border-destructive text-destructive bg-destructive/5" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
                )}
              >
                <Heart className={cn("h-5 w-5 transition-transform", wishlisted && "fill-current scale-110")} />
              </button>
            </div>

            {/* Features */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { icon: Truck, label: "Free Shipping", sub: "Orders ₹999+" },
                { icon: Shield, label: "Warranty", sub: "1 Year" },
                { icon: RotateCcw, label: "Easy Returns", sub: "30 Days" },
              ].map((feat) => (
                <div key={feat.label} className="flex flex-col items-center text-center p-3 rounded-xl bg-secondary/50">
                  <feat.icon className="h-4 w-4 text-muted-foreground mb-1.5" />
                  <p className="text-[11px] font-semibold text-foreground">{feat.label}</p>
                  <p className="text-[10px] text-muted-foreground">{feat.sub}</p>
                </div>
              ))}
            </div>

            {/* Stock */}
            <div className="mt-6 text-sm">
               {(product.stock_quantity ?? 0) > 0 ? (
                <span className="text-success font-medium">✓ In Stock ({product.stock_quantity} available)</span>
              ) : (
                <span className="text-destructive font-medium">Out of Stock</span>
              )}
            </div>

            {/* Contact Vendor */}
            {vendor && user && (
              <div className="mt-6">
                {!showVendorChat ? (
                  <button
                    onClick={() => setShowVendorChat(true)}
                    className="btn-secondary flex items-center gap-2 text-sm"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Ask {vendor.store_name} a question
                  </button>
                ) : (
                  <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3 animate-fade-in">
                    <p className="text-sm font-medium text-foreground">Message to {vendor.store_name}</p>
                    <textarea
                      value={vendorMessage}
                      onChange={(e) => setVendorMessage(e.target.value)}
                      className="input-premium min-h-[80px] resize-none text-sm"
                      placeholder="Ask about this product..."
                      maxLength={1000}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          if (!vendorMessage.trim()) return;
                          setSendingMessage(true);
                          const vendorId = (product as any).vendor_id;
                          await supabase.from("vendor_messages" as any).insert({
                            vendor_id: vendorId,
                            sender_id: user.id,
                            product_id: product.id,
                            message: vendorMessage.trim(),
                            is_from_vendor: false,
                          } as any);
                          toast.success("Message sent!");
                          setVendorMessage("");
                          setShowVendorChat(false);
                          setSendingMessage(false);
                        }}
                        disabled={!vendorMessage.trim() || sendingMessage}
                        className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {sendingMessage ? "Sending..." : "Send"}
                      </button>
                      <button onClick={() => setShowVendorChat(false)} className="btn-secondary text-sm py-2 px-4">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <ProductReviews productId={product.id} />

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mt-24">
            <div className="flex items-end justify-between mb-10">
              <h2 className="text-title text-foreground">You May Also Like</h2>
              <Link to="/products" className="nav-link flex items-center gap-1 mb-0.5">
                View More <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
