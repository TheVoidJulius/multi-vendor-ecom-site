import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { ai } from "@/hooks/useAI";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/utils";

interface Props {
  productId?: string | null;
  title?: string;
  limit?: number;
}

export default function AIRecommendations({ productId = null, title = "Picked for You", limit = 6 }: Props) {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["ai-recommend", user?.id || "guest", productId, limit],
    queryFn: () => ai.recommend({ userId: user?.id || null, productId, limit }),
    staleTime: 5 * 60 * 1000,
  });

  const products = data?.products || [];

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="container-premium section-padding">
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 mb-3">
            <Sparkles className="h-3 w-3 text-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">AI Curated</span>
          </div>
          <h2 className="text-headline text-foreground">{title}</h2>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl skeleton" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          {products.slice(0, limit).map((p: any) => (
            <Link key={p.id} to={`/products/${p.slug}`} className="group block hover-lift">
              <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-secondary">
                <img
                  src={p.images?.[0] || "/placeholder.svg"}
                  alt={p.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="mt-3">
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{p.brands?.name || ""}</p>
                <h3 className="text-sm font-medium text-foreground mt-1 line-clamp-1">{p.name}</h3>
                <p className="text-sm font-semibold text-gold mt-1">{formatPrice(p.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}