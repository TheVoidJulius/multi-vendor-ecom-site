import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/products/ProductCard";
import type { Category, Product } from "@/lib/types";

export default function CategoryDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: category } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").eq("slug", slug!).single();
      return data as Category;
    },
    enabled: !!slug,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["category-products", category?.id],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*, brands(*)").eq("category_id", category!.id);
      return (data || []) as Product[];
    },
    enabled: !!category?.id,
  });

  if (!category) return <Layout><div className="container-premium py-20 text-center text-muted-foreground">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="container-premium py-10">
        <h1 className="text-headline text-foreground mb-2">{category.name}</h1>
        <p className="text-body-large mb-10">{category.description}</p>
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
