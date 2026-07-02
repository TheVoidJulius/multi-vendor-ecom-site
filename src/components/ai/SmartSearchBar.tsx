import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ai } from "@/hooks/useAI";
import { toast } from "sonner";

export default function SmartSearchBar() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    try {
      const f = await ai.smartSearch(query.trim());
      const params = new URLSearchParams();
      if (f.keywords) params.set("search", f.keywords);
      if (f.brand_slug) params.set("brand", f.brand_slug);
      if (f.category_slug) params.set("category", f.category_slug);
      if (f.min_price) params.set("min", String(f.min_price));
      if (f.max_price) params.set("max", String(f.max_price));
      navigate(`/products?${params.toString()}`);
    } catch (e: any) {
      toast.error(e.message || "AI search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handle} className="relative max-w-2xl">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gold">
        <Sparkles className="h-4 w-4" />
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder='Try AI search: "gold earrings under 5000 for wedding"'
        className="w-full rounded-full border border-gold/30 bg-card py-4 pl-12 pr-32 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-gold/30 shadow-md transition-all"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !query.trim()}
        className="absolute right-2 top-1/2 -translate-y-1/2 btn-gold text-xs px-4 py-2 disabled:opacity-50 flex items-center gap-1.5"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        AI Search
      </button>
    </form>
  );
}