import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import type { Category } from "@/lib/types";

export default function Categories() {
  const { data: categories = [] } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return (data || []) as Category[];
    },
  });

  return (
    <Layout>
      <div className="container-premium py-10">
        <h1 className="text-headline text-foreground mb-2">Categories</h1>
        <p className="text-body-large mb-10">Browse products by category.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/categories/${cat.slug}`}
              className="group relative aspect-[4/3] overflow-hidden rounded-3xl bg-secondary"
            >
              <img src={cat.image_url || "/placeholder.svg"} alt={cat.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 to-transparent" />
              <div className="absolute bottom-5 left-5">
                <h2 className="text-xl font-semibold text-primary-foreground">{cat.name}</h2>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
