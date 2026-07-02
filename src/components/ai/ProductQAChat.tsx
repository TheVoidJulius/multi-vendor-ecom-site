import { useState } from "react";
import { Sparkles, Send } from "lucide-react";
import { ai } from "@/hooks/useAI";
import { toast } from "sonner";

interface Props {
  productId: string;
}

type Msg = { role: "user" | "ai"; text: string };

const SUGGESTIONS = [
  "Is this authentic?",
  "What's the return policy?",
  "Does it come with a warranty?",
];

export default function ProductQAChat({ productId }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async (question: string) => {
    if (!question.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const { answer } = await ai.productQA(productId, question);
      setMessages((m) => [...m, { role: "ai", text: answer }]);
    } catch (e: any) {
      toast.error(e.message || "AI request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-16 rounded-3xl border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent p-6 md:p-8">
      <div className="flex items-center gap-2 mb-5">
        <div className="h-9 w-9 rounded-full bg-gold/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-gold" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">Ask AI about this product</h3>
          <p className="text-xs text-muted-foreground">Powered by Veloura AI · answers based on product details & reviews</p>
        </div>
      </div>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:border-gold/40 hover:text-gold transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`text-sm leading-relaxed p-3 rounded-2xl ${
                m.role === "user"
                  ? "bg-foreground text-background ml-8"
                  : "bg-secondary/60 text-foreground mr-8 border border-border/50"
              }`}
            >
              {m.text}
            </div>
          ))}
          {loading && <div className="text-sm text-muted-foreground mr-8 p-3 italic">Thinking…</div>}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about this product..."
          className="input-premium flex-1 text-sm"
          maxLength={500}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} className="btn-gold px-4 py-2 text-sm flex items-center gap-1.5">
          <Send className="h-3.5 w-3.5" />
          Ask
        </button>
      </form>
    </section>
  );
}