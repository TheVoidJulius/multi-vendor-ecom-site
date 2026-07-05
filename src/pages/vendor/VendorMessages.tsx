import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import VendorLayout from "@/components/vendor/VendorLayout";
import { useVendor } from "@/hooks/useVendor";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Send, User, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Conversation {
  sender_id: string;
  product_id: string | null;
  product_name: string | null;
  last_message: string;
  last_at: string;
  unread: number;
}

export default function VendorMessages() {
  const { vendor } = useVendor();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  // Fetch all messages grouped by sender
  const { data: messages = [] } = useQuery({
    queryKey: ["vendor-messages", vendor?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_messages" as any)
        .select("*")
        .eq("vendor_id", vendor!.id)
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!vendor?.id,
    refetchInterval: 5000,
  });

  // Group by sender_id
  const conversations: Conversation[] = [];
  const seen = new Set<string>();
  messages.forEach((m: any) => {
    const key = m.sender_id;
    if (!seen.has(key)) {
      seen.add(key);
      const senderMessages = messages.filter((msg: any) => msg.sender_id === key);
      conversations.push({
        sender_id: key,
        product_id: m.product_id,
        product_name: senderMessages.find((msg: any) => msg.product_id)?.product_name || null,
        last_message: senderMessages[0]?.message || "",
        last_at: senderMessages[0]?.created_at || "",
        unread: senderMessages.filter((msg: any) => !msg.is_read && !msg.is_from_vendor).length,
      });
    }
  });

  const activeMessages = selectedConvo
    ? messages.filter((m: any) => m.sender_id === selectedConvo).reverse()
    : [];

  const sendReply = useMutation({
    mutationFn: async () => {
      if (!reply.trim() || !selectedConvo || !vendor) return;
      const { error } = await supabase.from("vendor_messages" as any).insert({
        vendor_id: vendor.id,
        sender_id: selectedConvo,
        message: reply.trim(),
        is_from_vendor: true,
        is_read: false,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      setReply("");
      qc.invalidateQueries({ queryKey: ["vendor-messages"] });
    },
  });

  // Mark as read
  const markRead = async (senderId: string) => {
    await supabase
      .from("vendor_messages" as any)
      .update({ is_read: true } as any)
      .eq("vendor_id", vendor!.id)
      .eq("sender_id", senderId)
      .eq("is_from_vendor", false);
    qc.invalidateQueries({ queryKey: ["vendor-messages"] });
  };

  return (
    <VendorLayout>
      <div className="space-y-6">
        <h2 className="text-title text-foreground">Messages</h2>

        <div className="rounded-2xl border border-border bg-card overflow-hidden flex" style={{ minHeight: 500 }}>
          {/* Conversation list */}
          <div className="w-80 border-r border-border overflow-y-auto shrink-0">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <MessageSquare className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
                No messages yet.
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.sender_id}
                  onClick={() => { setSelectedConvo(c.sender_id); markRead(c.sender_id); }}
                  className={cn(
                    "w-full text-left p-4 border-b border-border hover:bg-secondary/30 transition-colors",
                    selectedConvo === c.sender_id && "bg-secondary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground truncate">
                          Customer
                        </p>
                        {c.unread > 0 && (
                          <span className="text-[10px] font-bold bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full">
                            {c.unread}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{c.last_message}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col">
            {!selectedConvo ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                Select a conversation
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {activeMessages.map((m: any) => (
                    <div key={m.id} className={cn("flex", m.is_from_vendor ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
                        m.is_from_vendor
                          ? "bg-accent text-accent-foreground rounded-br-md"
                          : "bg-secondary text-foreground rounded-bl-md"
                      )}>
                        <p>{m.message}</p>
                        <p className={cn(
                          "text-[10px] mt-1",
                          m.is_from_vendor ? "text-accent-foreground/60" : "text-muted-foreground"
                        )}>
                          {new Date(m.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border p-4">
                  <form
                    onSubmit={(e) => { e.preventDefault(); sendReply.mutate(); }}
                    className="flex gap-2"
                  >
                    <input
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      className="input-premium flex-1"
                      placeholder="Type your reply..."
                    />
                    <button
                      type="submit"
                      disabled={!reply.trim() || sendReply.isPending}
                      className="btn-primary px-4"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}
