import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { formatPrice } from "@/lib/utils";

interface Props {
  query: string;
  onSelect: () => void;
}

export default function SearchSuggestions({ query, onSelect }: Props) {
  const { data: suggestions = [] } = useQuery({
    queryKey: ["search-suggestions", query],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, images")
        .ilike("name", `%${query}%`)
        .limit(6);
      return data || [];
    },
    enabled: query.length >= 2,
  });

  if (query.length < 2 || suggestions.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden z-10 animate-fade-in">
      {suggestions.map((p: any) => (
        <Link
          key={p.id}
          to={`/products/${p.slug}`}
          onClick={onSelect}
          className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/50 transition-colors"
        >
          {p.images?.[0] && (
            <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground line-clamp-1">{p.name}</p>
            <p className="text-xs text-accent font-medium">{formatPrice(p.price)}</p>
          </div>
        </Link>
      ))}
      <Link
        to={`/products?search=${encodeURIComponent(query)}`}
        onClick={onSelect}
        className="block px-5 py-3 text-center text-xs font-medium text-gold hover:bg-secondary/30 transition-colors border-t border-border"
      >
        View all results for "{query}"
      </Link>
    </div>
  );
}
