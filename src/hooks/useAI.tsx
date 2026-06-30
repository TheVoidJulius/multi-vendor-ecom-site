import { supabase } from "@/integrations/supabase/client";

export type SmartSearchFilters = {
  keywords: string;
  brand_slug?: string;
  category_slug?: string;
  min_price?: number;
  max_price?: number;
  intent?: string;
};

async function call<T = any>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke("ai-assist", {
    body: { action, ...payload },
  });
  if (error) {
    const msg = (error as any)?.context?.status === 429
      ? "Too many AI requests. Try again in a moment."
      : (error as any)?.context?.status === 402
        ? "AI credits exhausted. Please add credits in workspace settings."
        : error.message || "AI request failed";
    throw new Error(msg);
  }
  return data as T;
}

export const ai = {
  smartSearch: (query: string) => call<SmartSearchFilters>("smart-search", { query }),
  smartFilters: (query: string) => call<{ chips: string[] }>("smart-filters", { query }),
  recommend: (opts: { userId?: string | null; productId?: string | null; limit?: number }) =>
    call<{ products: any[] }>("recommend", opts),
  productQA: (productId: string, question: string) =>
    call<{ answer: string }>("product-qa", { productId, question }),
};