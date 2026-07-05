import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, Sparkles, Zap, Star, Mail, Crown } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import type { Product, Brand, Category } from "@/lib/types";
import { toast } from "sonner";
import SmartSearchBar from "@/components/ai/SmartSearchBar";
import AIRecommendations from "@/components/ai/AIRecommendations";

export default function Index() {
  const [email, setEmail] = useState("");

  const { data: featuredProducts = [] } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, brands(*)")
        .eq("is_featured", true)
        .limit(8);
      return (data || []) as Product[];
    },
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["brands", "featured"],
    queryFn: async () => {
      const { data } = await supabase
        .from("brands")
        .select("*")
        .eq("is_featured", true)
        .limit(4);
      return (data || []) as Brand[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").limit(6);
      return (data || []) as Category[];
    },
  });

  const { data: newProducts = [] } = useQuery({
    queryKey: ["products", "new"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, brands(*)")
        .eq("is_new", true)
        .limit(4);
      return (data || []) as Product[];
    },
  });

  const { data: saleProducts = [] } = useQuery({
    queryKey: ["products", "sale"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, brands(*)")
        .eq("is_on_sale", true)
        .limit(4);
      return (data || []) as Product[];
    },
  });

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success("Thanks for subscribing!");
      setEmail("");
    }
  };

  return (
    <Layout>
      {/* ===== HERO ===== */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="container-premium py-24 md:py-36 lg:py-44 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-gold/20 bg-gold/5 px-5 py-2 mb-10 animate-fade-in-up opacity-0" style={{ animationDelay: "0s" }}>
              <Crown className="h-3.5 w-3.5 text-gold" />
              <span className="text-[11px] font-semibold text-gold tracking-[0.1em] uppercase">New Collection 2026</span>
            </div>
            <h1 className="text-display text-foreground animate-fade-in-up opacity-0" style={{ animationDelay: "0.08s" }}>
              Premium
              <br />
              <span className="text-gold">Redefined.</span>
            </h1>
            <p className="mt-8 text-body-large max-w-lg animate-fade-in-up opacity-0" style={{ animationDelay: "0.16s" }}>
              Curated collections from the world's finest brands and vendors. Experience shopping at its most refined.
            </p>
            <div className="mt-12 flex flex-wrap items-center gap-5 animate-fade-in-up opacity-0" style={{ animationDelay: "0.24s" }}>
              <Link to="/products" className="btn-gold group">
                Shop Collection
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link to="/brands" className="btn-secondary">
                Explore Brands
              </Link>
            </div>
            <div className="mt-12 animate-fade-in-up opacity-0" style={{ animationDelay: "0.32s" }}>
              <SmartSearchBar />
            </div>
          </div>
        </div>
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-1/2 h-full hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-background z-10" />
          {featuredProducts[0]?.images?.[0] && (
            <img
              src={featuredProducts[0].images[0]}
              alt=""
              className="h-full w-full object-cover opacity-15"
            />
          )}
        </div>
        {/* Gold accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      </section>

      {/* ===== FEATURED BRANDS ===== */}
      {brands.length > 0 && (
        <section className="container-premium section-padding">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold mb-3">Trending</p>
              <h2 className="text-headline text-foreground">Featured Brands</h2>
            </div>
            <Link to="/brands" className="nav-link flex items-center gap-1.5 mb-1">
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {brands.map((brand, i) => (
              <Link
                key={brand.id}
                to={`/brands/${brand.slug}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-secondary animate-fade-in-up opacity-0 hover-lift"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <img
                  src={brand.banner_url || "/placeholder.svg"}
                  alt={brand.name}
                  className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
                <div className="absolute bottom-5 left-5">
                  <h3 className="text-xl font-light text-white tracking-tight font-serif">{brand.name}</h3>
                  <p className="text-white/50 text-xs mt-1.5 flex items-center gap-1 tracking-wider uppercase">
                    Explore <ChevronRight className="h-3 w-3" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== FEATURED PRODUCTS ===== */}
      {featuredProducts.length > 0 && (
        <section className="bg-secondary/20 section-padding">
          <div className="container-premium">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold mb-3">Curated</p>
                <h2 className="text-headline text-foreground">Featured Products</h2>
              </div>
              <Link to="/products" className="nav-link flex items-center gap-1.5 mb-1">
                Shop All <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
              {featuredProducts.map((product, i) => (
                <div key={product.id} className="animate-fade-in-up opacity-0" style={{ animationDelay: `${i * 0.06}s` }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <AIRecommendations title="Picked for You" limit={6} />

      {/* ===== CATEGORIES ===== */}
      {categories.length > 0 && (
        <section className="container-premium section-padding">
          <div className="text-center mb-14">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold mb-3">Browse</p>
            <h2 className="text-headline text-foreground">Shop by Category</h2>
            <div className="gold-divider mt-5" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {categories.map((cat, i) => (
              <Link
                key={cat.id}
                to={`/categories/${cat.slug}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-secondary hover-lift animate-fade-in-up opacity-0"
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <img
                  src={cat.image_url || "/placeholder.svg"}
                  alt={cat.name}
                  className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/10 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <h3 className="text-lg font-light text-white font-serif">{cat.name}</h3>
                  <p className="text-white/50 text-xs mt-1">{cat.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== FLASH SALE ===== */}
      {saleProducts.length > 0 && (
        <section className="relative overflow-hidden section-padding" style={{ background: "var(--gradient-dark)" }}>
          <div className="container-premium relative z-10">
            <div className="flex items-end justify-between mb-12">
              <div>
                <div className="inline-flex items-center gap-2.5 rounded-full bg-gold/10 border border-gold/20 px-4 py-1.5 mb-4">
                  <Zap className="h-3.5 w-3.5 text-gold" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Flash Sale</span>
                </div>
                <h2 className="text-headline text-white font-serif">Limited Time Deals</h2>
              </div>
              <Link to="/products?filter=sale" className="text-[12px] font-medium text-white/50 hover:text-gold flex items-center gap-1.5 transition-colors mb-1 tracking-wider">
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
              {saleProducts.map((product, i) => (
                <div key={product.id} className="animate-fade-in-up opacity-0" style={{ animationDelay: `${i * 0.06}s` }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
          {/* Gold accent lines */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        </section>
      )}

      {/* ===== NEW ARRIVALS ===== */}
      {newProducts.length > 0 && (
        <section className="container-premium section-padding">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold mb-3">Just In</p>
              <h2 className="text-headline text-foreground">New Arrivals</h2>
            </div>
            <Link to="/products?filter=new" className="nav-link flex items-center gap-1.5 mb-1">
              See All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {newProducts.map((product, i) => (
              <div key={product.id} className="animate-fade-in-up opacity-0" style={{ animationDelay: `${i * 0.06}s` }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== CUSTOMER REVIEWS ===== */}
      <section className="bg-secondary/15 section-padding">
        <div className="container-premium">
          <div className="text-center mb-14">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold mb-3">Testimonials</p>
            <h2 className="text-headline text-foreground">What Our Customers Say</h2>
            <div className="gold-divider mt-5" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Priya S.", text: "The quality is unmatched. Veloura has become my go-to for premium products.", rating: 5 },
              { name: "Arjun M.", text: "Incredible shopping experience. Fast delivery and beautiful packaging.", rating: 5 },
              { name: "Sneha R.", text: "Found brands I love all in one place. The curation is spot on.", rating: 4 },
            ].map((review, i) => (
              <div key={i} className="glass-card p-7 hover-lift animate-fade-in-up opacity-0" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="flex items-center gap-0.5 mb-5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className={`h-4 w-4 ${j < review.rating ? "fill-gold text-gold" : "fill-muted text-muted"}`} />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-5">"{review.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-gold">{review.name[0]}</span>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground tracking-wide">{review.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== NEWSLETTER ===== */}
      <section className="container-premium section-padding">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-gold/20 bg-gold/5 px-5 py-2 mb-8">
            <Mail className="h-3.5 w-3.5 text-gold" />
            <span className="text-[11px] font-semibold text-gold tracking-[0.1em] uppercase">Stay Updated</span>
          </div>
          <h2 className="text-headline text-foreground mb-4">
            Join the <span className="text-gold">Veloura</span> Experience
          </h2>
          <p className="text-body-large mb-10">
            Get early access to new arrivals, exclusive deals, and curated recommendations.
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="input-premium flex-1"
              required
            />
            <button type="submit" className="btn-gold whitespace-nowrap">
              Subscribe
            </button>
          </form>
          <p className="text-[11px] text-muted-foreground mt-5 tracking-wide">No spam. Unsubscribe anytime.</p>
        </div>
      </section>
    </Layout>
  );
}
