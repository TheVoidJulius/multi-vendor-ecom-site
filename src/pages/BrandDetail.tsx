import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import type { Brand, Product } from "@/lib/types";

export default function BrandDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: brand } = useQuery({
    queryKey: ["brand", slug],
    queryFn: async () => {
      const { data } = await supabase.from("brands").select("*").eq("slug", slug!).single();
      return data as Brand;
    },
    enabled: !!slug,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["brand-products", brand?.id],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*, brands(*)").eq("brand_id", brand!.id);
      return (data || []) as Product[];
    },
    enabled: !!brand?.id,
  });

  if (!brand) return <Layout><div className="container-premium py-20 text-center text-muted-foreground">Loading...</div></Layout>;

  return (
    <Layout>
      {/* Banner */}
      <div className="relative h-64 md:h-80 overflow-hidden bg-secondary">
        <img src={brand.banner_url || "/placeholder.svg"} alt={brand.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        <div className="absolute bottom-8 left-0 right-0 container-premium">
          <h1 className="text-4xl md:text-5xl font-semibold text-primary-foreground">{brand.name}</h1>
          <p className="text-primary-foreground/70 mt-2 max-w-lg">{brand.description}</p>
        </div>
      </div>

      <div className="container-premium py-12">
        <p className="text-sm text-muted-foreground mb-8">{products.length} products</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
