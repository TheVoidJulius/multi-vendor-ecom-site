import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import type { Brand } from "@/lib/types";

export default function Brands() {
  const { data: brands = [] } = useQuery({
    queryKey: ["brands-all"],
    queryFn: async () => {
      const { data } = await supabase.from("brands").select("*").order("name");
      return (data || []) as Brand[];
    },
  });

  return (
    <Layout>
      <div className="container-premium py-10">
        <h1 className="text-headline text-foreground mb-2">Our Brands</h1>
        <p className="text-body-large mb-10">Explore curated collections from the world's finest.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              to={`/brands/${brand.slug}`}
              className="group relative aspect-[16/10] overflow-hidden rounded-3xl bg-secondary"
            >
              <img
                src={brand.banner_url || "/placeholder.svg"}
                alt={brand.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6">
                <h2 className="text-2xl font-semibold text-primary-foreground">{brand.name}</h2>
                <p className="text-sm text-primary-foreground/70 mt-1 max-w-xs">{brand.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
