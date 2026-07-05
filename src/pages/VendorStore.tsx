import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import { Store, ChevronRight, Package, Star, MapPin, Mail, Phone, MessageSquare } from "lucide-react";
import type { Product } from "@/lib/types";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function VendorStore() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showContact, setShowContact] = useState(false);

  const { data: vendor, isLoading: vendorLoading } = useQuery({
    queryKey: ["vendor-store", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendors" as any)
        .select("*")
        .eq("store_slug", slug!)
        .eq("status", "approved")
        .single();
      return data as any;
    },
    enabled: !!slug,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["vendor-store-products", vendor?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, brands(*)")
        .eq("vendor_id", vendor!.id)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      return (data || []) as Product[];
    },
    enabled: !!vendor?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ["vendor-store-stats", vendor?.id],
    queryFn: async () => {
      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating")
        .in("product_id", products.map((p) => p.id));
      const avgRating = reviews && reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0;
      return { productCount: products.length, reviewCount: reviews?.length || 0, avgRating };
    },
    enabled: products.length > 0,
  });

  const handleSendMessage = async () => {
    if (!user || !vendor || !message.trim()) return;
    setSending(true);
    const { error } = await supabase.from("vendor_messages" as any).insert({
      vendor_id: vendor.id,
      sender_id: user.id,
      message: message.trim(),
      is_from_vendor: false,
    } as any);
    if (error) {
      toast.error("Failed to send message");
    } else {
      toast.success("Message sent to vendor!");
      setMessage("");
      setShowContact(false);
    }
    setSending(false);
  };

  if (vendorLoading) {
    return (
      <Layout>
        <div className="container-premium py-16">
          <div className="h-48 rounded-3xl skeleton mb-8" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i}><div className="aspect-[3/4] rounded-2xl skeleton" /></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!vendor) {
    return (
      <Layout>
        <div className="container-premium py-20 text-center">
          <p className="text-muted-foreground">Store not found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Store Banner */}
      <div className="relative h-48 md:h-64 bg-secondary overflow-hidden">
        {vendor.banner_url ? (
          <img src={vendor.banner_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-accent/20 to-primary/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      <div className="container-premium -mt-16 relative z-10 pb-16">
        {/* Store Header */}
        <div className="flex flex-col md:flex-row md:items-end gap-5 mb-8">
          <div className="w-24 h-24 rounded-2xl bg-card border-4 border-background overflow-hidden shadow-lg flex items-center justify-center shrink-0">
            {vendor.logo_url ? (
              <img src={vendor.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Store className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-headline text-foreground">{vendor.store_name}</h1>
            {vendor.store_description && (
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">{vendor.store_description}</p>
            )}
          </div>
          {user && (
            <button
              onClick={() => setShowContact(!showContact)}
              className="btn-secondary flex items-center gap-2 shrink-0"
            >
              <MessageSquare className="h-4 w-4" />
              Contact Seller
            </button>
          )}
        </div>

        {/* Store Stats */}
        <div className="flex items-center gap-6 mb-8 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span className="font-medium text-foreground">{products.length}</span> Products
          </div>
          {stats && stats.avgRating > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span className="font-medium text-foreground">{stats.avgRating.toFixed(1)}</span>
              ({stats.reviewCount} reviews)
            </div>
          )}
          {vendor.address && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {vendor.address}
            </div>
          )}
        </div>

        {/* Contact Form */}
        {showContact && user && (
          <div className="rounded-2xl border border-border bg-card p-6 mb-8 max-w-lg animate-fade-in">
            <h3 className="text-sm font-bold text-foreground mb-3">Send a message to {vendor.store_name}</h3>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input-premium min-h-[100px] resize-none mb-3"
              placeholder="Ask about products, shipping, or anything else..."
              maxLength={1000}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || sending}
                className="btn-primary text-sm py-2 px-5"
              >
                {sending ? "Sending..." : "Send Message"}
              </button>
              <button onClick={() => setShowContact(false)} className="btn-secondary text-sm py-2 px-5">Cancel</button>
            </div>
          </div>
        )}

        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">{vendor.store_name}</span>
        </nav>

        <h2 className="text-title text-foreground mb-6">Products ({products.length})</h2>

        {products.length === 0 ? (
          <p className="text-center py-16 text-muted-foreground">This store hasn't added any products yet.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {products.map((product, i) => (
              <div key={product.id} className="animate-fade-in-up opacity-0" style={{ animationDelay: `${i * 0.03}s` }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
