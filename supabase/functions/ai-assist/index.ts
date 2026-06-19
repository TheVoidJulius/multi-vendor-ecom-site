import { serve } from "https://deno.land/std@0.205.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const MODEL = "google/gemini-3-flash-preview";

async function callAI(body: any) {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (resp.status === 429) throw new Error("RATE_LIMIT");
  if (resp.status === 402) throw new Error("PAYMENT_REQUIRED");
  if (!resp.ok) throw new Error(`AI error ${resp.status}: ${await resp.text()}`);
  return await resp.json();
}

/* ---------- SMART SEARCH ---------- */
async function smartSearch(query: string) {
  const [{ data: brands }, { data: categories }] = await Promise.all([
    supabase.from("brands").select("name, slug"),
    supabase.from("categories").select("name, slug"),
  ]);

  const ai = await callAI({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You convert shopping search queries into structured filters for Veloura, an Indian luxury marketplace. Return ONLY via the tool. Prices are in INR.",
      },
      {
        role: "user",
        content: `Available brands: ${(brands || []).map((b: any) => b.slug).join(", ")}
Available categories: ${(categories || []).map((c: any) => c.slug).join(", ")}
Query: "${query}"`,
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "build_filters",
          description: "Build search filters from a natural language query.",
          parameters: {
            type: "object",
            properties: {
              keywords: { type: "string", description: "Cleaned product keywords for name search" },
              brand_slug: { type: "string", description: "Slug from available brands, or empty" },
              category_slug: { type: "string", description: "Slug from available categories, or empty" },
              min_price: { type: "number" },
              max_price: { type: "number" },
              intent: { type: "string", description: "One-line shopper intent" },
            },
            required: ["keywords", "intent"],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "build_filters" } },
  });

  const args = ai.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  const parsed = args ? JSON.parse(args) : { keywords: query, intent: query };
  return parsed;
}

/* ---------- SMART FILTERS (suggestions) ---------- */
async function smartFilters(query: string) {
  const ai = await callAI({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: "Suggest 3 short refinement chips (1-3 words each) for an INR shopping query. Return via tool.",
      },
      { role: "user", content: query },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "suggest_chips",
          parameters: {
            type: "object",
            properties: {
              chips: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
            },
            required: ["chips"],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "suggest_chips" } },
  });
  const args = ai.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  return args ? JSON.parse(args) : { chips: [] };
}

/* ---------- RECOMMENDATIONS ---------- */
async function recommend(userId: string | null, productId: string | null, limit = 6) {
  // Build signal: recent wishlist + cart + (optionally) viewed product
  let signalProducts: any[] = [];

  if (productId) {
    const { data } = await supabase
      .from("products")
      .select("id, name, category_id, brand_id, price")
      .eq("id", productId)
      .single();
    if (data) signalProducts.push(data);
  }

  if (userId) {
    const { data: wl } = await supabase
      .from("wishlist_items")
      .select("products(id, name, category_id, brand_id, price)")
      .eq("user_id", userId)
      .limit(5);
    const { data: ct } = await supabase
      .from("cart_items")
      .select("products(id, name, category_id, brand_id, price)")
      .eq("user_id", userId)
      .limit(5);
    for (const r of [...(wl || []), ...(ct || [])]) {
      if ((r as any).products) signalProducts.push((r as any).products);
    }
  }

  // Candidate pool
  const excludeIds = signalProducts.map((p) => p.id);
  const categoryIds = [...new Set(signalProducts.map((p) => p.category_id).filter(Boolean))];

  let q = supabase
    .from("products")
    .select("id, name, slug, price, images, brands(name), categories(name), rating")
    .limit(30);

  if (categoryIds.length > 0) q = q.in("category_id", categoryIds);
  if (excludeIds.length > 0) q = q.not("id", "in", `(${excludeIds.join(",")})`);

  let { data: candidates } = await q;
  if (!candidates || candidates.length < limit) {
    // Fallback to featured / top-rated if not enough candidates
    const { data: more } = await supabase
      .from("products")
      .select("id, name, slug, price, images, brands(name), categories(name), rating")
      .order("rating", { ascending: false })
      .limit(limit * 2);
    const seen = new Set((candidates || []).map((c: any) => c.id));
    candidates = [
      ...(candidates || []),
      ...((more || []).filter((m: any) => !seen.has(m.id) && !excludeIds.includes(m.id))),
    ];
  }

  if (!candidates || candidates.length === 0) return { products: [] };

  // If no signal, return top candidates
  if (signalProducts.length === 0) {
    return { products: candidates.slice(0, limit) };
  }

  // Ask AI to rank candidates by relevance to signal
  const ai = await callAI({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a luxury shopping recommendation engine for Veloura. Pick the most relevant product IDs based on the user's interest signal. Return via tool.",
      },
      {
        role: "user",
        content: `User interests:\n${signalProducts
          .map((p) => `- ${p.name} (₹${p.price})`)
          .join("\n")}\n\nCandidates:\n${candidates
          .map(
            (c: any) =>
              `${c.id} | ${c.name} | ${c.brands?.name || ""} | ${c.categories?.name || ""} | ₹${c.price} | ★${c.rating}`,
          )
          .join("\n")}\n\nReturn top ${limit} product IDs, ordered.`,
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "rank_products",
          parameters: {
            type: "object",
            properties: {
              product_ids: { type: "array", items: { type: "string" } },
            },
            required: ["product_ids"],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "rank_products" } },
  });

  const args = ai.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  const ranked = args ? JSON.parse(args).product_ids as string[] : [];
  const byId = new Map(candidates.map((c: any) => [c.id, c]));
  const ordered = ranked.map((id) => byId.get(id)).filter(Boolean);
  // Pad if AI returned fewer
  for (const c of candidates) {
    if (ordered.length >= limit) break;
    if (!ordered.find((o: any) => o.id === c.id)) ordered.push(c);
  }
  return { products: ordered.slice(0, limit) };
}

/* ---------- PRODUCT Q&A ---------- */
async function productQA(productId: string, question: string) {
  const { data: product } = await supabase
    .from("products")
    .select("name, description, price, stock_quantity, brands(name), categories(name)")
    .eq("id", productId)
    .single();
  if (!product) throw new Error("Product not found");

  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating, title, content")
    .eq("product_id", productId)
    .eq("is_approved", true)
    .limit(10);

  const ctx = `Product: ${product.name}
Brand: ${(product as any).brands?.name || "—"}
Category: ${(product as any).categories?.name || "—"}
Price: ₹${product.price}
In stock: ${product.stock_quantity}
Description: ${product.description || "—"}

Customer reviews:
${(reviews || []).map((r: any) => `- ★${r.rating} ${r.title || ""}: ${r.content || ""}`).join("\n") || "No reviews yet."}`;

  const ai = await callAI({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a helpful Veloura shopping assistant. Answer ONLY using the provided product context. If unknown, say you don't have that info and suggest contacting the vendor. Keep answers under 80 words. Use INR (₹).",
      },
      { role: "user", content: `${ctx}\n\nQuestion: ${question}` },
    ],
  });

  const answer = ai.choices?.[0]?.message?.content || "Sorry, I couldn't generate an answer.";
  return { answer };
}

/* ---------- ROUTER ---------- */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    const { action, ...payload } = await req.json();

    let result: any;
    switch (action) {
      case "smart-search":
        if (!payload.query) throw new Error("query required");
        result = await smartSearch(String(payload.query).slice(0, 200));
        break;
      case "smart-filters":
        if (!payload.query) throw new Error("query required");
        result = await smartFilters(String(payload.query).slice(0, 200));
        break;
      case "recommend":
        result = await recommend(payload.userId || null, payload.productId || null, Math.min(payload.limit || 6, 12));
        break;
      case "product-qa":
        if (!payload.productId || !payload.question) throw new Error("productId and question required");
        result = await productQA(payload.productId, String(payload.question).slice(0, 500));
        break;
      default:
        throw new Error("Unknown action");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    const msg = e?.message || "Unknown error";
    let status = 500;
    if (msg === "RATE_LIMIT") status = 429;
    if (msg === "PAYMENT_REQUIRED") status = 402;
    console.error("ai-assist error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});