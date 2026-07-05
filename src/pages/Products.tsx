import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { SlidersHorizontal, ChevronRight, X, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import type { Product, Brand, Category } from "@/lib/types";
import { ai } from "@/hooks/useAI";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const filterType = searchParams.get("filter") || "";
  const brandSlug = searchParams.get("brand") || "";
  const categorySlug = searchParams.get("category") || "";
  const minParam = Number(searchParams.get("min") || 0);
  const maxParam = Number(searchParams.get("max") || 0);

  const [priceRange, setPriceRange] = useState<[number, number]>([
    minParam || 0,
    maxParam || 500000,
  ]);
  const [sortBy, setSortBy] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);
  const [aiChips, setAiChips] = useState<string[]>([]);

  useEffect(() => {
    setPriceRange([minParam || 0, maxParam || 500000]);
  }, [minParam, maxParam]);

  // Fetch AI smart filter chips when there's a search query
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 3) {
      setAiChips([]);
      return;
    }
    let cancelled = false;
    ai.smartFilters(searchQuery)
      .then((res) => {
        if (!cancelled) setAiChips(res.chips || []);
      })
      .catch(() => setAiChips([]));
    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

  const { data: brands = [] } = useQuery({
    queryKey: ["brands-all"],
    queryFn: async () => {
      const { data } = await supabase.from("brands").select("*");
      return (data || []) as Brand[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*");
      return (data || []) as Category[];
    },
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", searchQuery, filterType, brandSlug, categorySlug, sortBy, priceRange],
    queryFn: async () => {
      let query = supabase.from("products").select("*, brands(*), categories(*)");

      if (searchQuery) query = query.ilike("name", `%${searchQuery}%`);
      if (filterType === "new") query = query.eq("is_new", true);
      if (filterType === "sale") query = query.eq("is_on_sale", true);
      if (brandSlug) {
        const brand = brands.find((b) => b.slug === brandSlug);
        if (brand) query = query.eq("brand_id", brand.id);
      }
      if (categorySlug) {
        const cat = categories.find((c) => c.slug === categorySlug);
        if (cat) query = query.eq("category_id", cat.id);
      }
      query = query.gte("price", priceRange[0]).lte("price", priceRange[1]);

      if (sortBy === "price-asc") query = query.order("price", { ascending: true });
      else if (sortBy === "price-desc") query = query.order("price", { ascending: false });
      else if (sortBy === "rating") query = query.order("rating", { ascending: false });
      else if (sortBy === "newest") query = query.order("created_at", { ascending: false });
      else query = query.order("is_featured", { ascending: false });

      const { data } = await query;
      return (data || []) as Product[];
    },
    enabled: brands.length > 0 || !brandSlug,
  });

  const title = searchQuery
    ? `Results for "${searchQuery}"`
    : filterType === "new"
      ? "New Arrivals"
      : filterType === "sale"
        ? "On Sale"
        : "All Products";
  const applyChip = (chip: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("search", chip);
    setSearchParams(next);
  };

  return (
    <Layout>
      <div className="container-premium py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">{title}</span>
        </nav>

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="text-headline text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground mt-2">{products.length} products</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-premium text-xs py-2.5 w-auto pr-8"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="rating">Top Rated</option>
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-1.5 btn-secondary py-2.5 px-4 text-xs"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </button>
          </div>
        </div>

        {/* AI Smart Filter Chips */}
        {aiChips.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-8 p-4 rounded-2xl border border-gold/20 bg-gold/5">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-gold">
              <Sparkles className="h-3 w-3" /> AI Refine
            </span>
            {aiChips.map((c) => (
              <button
                key={c}
                onClick={() => applyChip(c)}
                className="text-xs px-3 py-1.5 rounded-full bg-card border border-border hover:border-gold/40 hover:text-gold transition-colors"
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-10">
          {/* Sidebar */}
          <aside className={`${showFilters ? "block" : "hidden"} md:block w-full md:w-52 shrink-0`}>
            <div className="sticky top-24 space-y-8">
              {/* Close on mobile */}
              <div className="md:hidden flex justify-end">
                <button onClick={() => setShowFilters(false)} className="p-1 text-muted-foreground"><X className="h-4 w-4" /></button>
              </div>

              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground mb-4">Brands</h3>
                <div className="space-y-2.5">
                  {brands.map((brand) => (
                    <label key={brand.id} className="flex items-center gap-2.5 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors group">
                      <input type="checkbox" className="rounded border-border accent-accent" />
                      <span className="group-hover:translate-x-0.5 transition-transform">{brand.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground mb-4">Categories</h3>
                <div className="space-y-2.5">
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2.5 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors group">
                      <input type="checkbox" className="rounded border-border accent-accent" />
                      <span className="group-hover:translate-x-0.5 transition-transform">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground mb-4">Price Range</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])}
                    className="input-premium text-xs py-2 w-20"
                    placeholder="Min"
                  />
                  <span className="text-muted-foreground text-xs">—</span>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
                    className="input-premium text-xs py-2 w-20"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-fade-in opacity-0" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="aspect-[3/4] rounded-2xl skeleton" />
                    <div className="mt-3 h-3 w-2/3 skeleton rounded" />
                    <div className="mt-2 h-3 w-1/3 skeleton rounded" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-muted-foreground text-sm">No products found.</p>
                <Link to="/products" className="text-accent text-sm font-medium mt-2 inline-block hover:underline">
                  Browse all products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {products.map((product, i) => (
                  <div key={product.id} className="animate-fade-in-up opacity-0" style={{ animationDelay: `${i * 0.03}s` }}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
