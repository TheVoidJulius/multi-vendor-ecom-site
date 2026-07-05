import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { cn, formatPrice } from "@/lib/utils";
import { useState } from "react";
import { ChevronDown, ChevronRight, MapPin, StickyNote, ShieldCheck, ShieldX, CreditCard, Store, User, Filter } from "lucide-react";

const statusOptions = ["pending", "processing", "shipped", "delivered", "cancelled"];

function extractUpiRef(notes: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/UPI Ref:\s*(\S+)/);
  return match ? match[1] : null;
}

function extractVendorInfo(notes: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/Paid to:\s*(.+?)(?:\s*\||$)/);
  return match ? match[1].trim() : null;
}

function AdminOrderRow({ order, customers }: { order: any; customers: Record<string, string> }) {
  const [expanded, setExpanded] = useState(false);
  const qc = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ["admin-order-items", order.id],
    queryFn: async () => {
      const { data } = await supabase.from("order_items").select("*").eq("order_id", order.id);
      return data || [];
    },
    enabled: expanded,
  });

  const updateStatus = useMutation({
    mutationFn: async (status: "pending" | "processing" | "shipped" | "delivered" | "cancelled") => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", order.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-orders"] }); toast.success("Order updated"); },
    onError: (e) => toast.error(e.message),
  });

  const verifyPayment = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("orders").update({ status: "processing" as any }).eq("id", order.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-orders"] }); toast.success("Payment verified — order confirmed!"); },
    onError: (e) => toast.error(e.message),
  });

  const rejectPayment = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("orders").update({ status: "cancelled" as any }).eq("id", order.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-orders"] }); toast.success("Order cancelled — payment rejected"); },
    onError: (e) => toast.error(e.message),
  });

  const statusColor = (s: string) => {
    if (s === "delivered") return "bg-success/10 text-success";
    if (s === "pending") return "bg-warning/10 text-warning";
    if (s === "cancelled") return "bg-destructive/10 text-destructive";
    if (s === "processing") return "bg-accent/10 text-accent";
    return "bg-accent/10 text-accent";
  };

  const addr = order.shipping_address as any;
  const upiRef = extractUpiRef(order.notes);
  const vendorInfo = extractVendorInfo(order.notes);
  const isPending = order.status === "pending";
  const customerName = addr?.full_name || customers[order.user_id] || "—";

  return (
    <>
      <tr className="hover:bg-secondary/20 transition-colors cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <td className="p-3">
          <div className="flex items-center gap-1">
            {expanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            <span className="font-mono text-foreground text-xs">{order.order_number}</span>
          </div>
        </td>
        <td className="p-3">
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-foreground">{customerName}</span>
          </div>
        </td>
        <td className="p-3 text-muted-foreground text-xs">{new Date(order.created_at).toLocaleDateString()}</td>
        <td className="p-3"><span className={cn("text-xs font-medium px-2 py-1 rounded-full", statusColor(order.status))}>{order.status}</span></td>
        <td className="p-3 font-medium text-foreground">{formatPrice(Number(order.total))}</td>
        <td className="p-3" onClick={(e) => e.stopPropagation()}>
          {isPending ? (
            <span className="text-xs text-warning font-medium">Awaiting verification</span>
          ) : (
            <select
              value={order.status}
              onChange={(e) => updateStatus.mutate(e.target.value as any)}
              className="input-premium text-xs py-1 w-auto"
            >
              {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="bg-secondary/10 px-6 py-4 border-b border-border">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                {/* Payment Verification Section */}
                {upiRef && (
                  <div className={cn(
                    "rounded-xl p-4 mb-4 border",
                    isPending ? "bg-warning/5 border-warning/20" : "bg-success/5 border-success/20"
                  )}>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5" />
                      {isPending ? "Payment Verification Required" : "Payment Info"}
                    </h4>
                    <p className="text-sm text-foreground mb-1">
                      UPI Transaction Reference: <span className="font-mono font-bold text-accent">{upiRef}</span>
                    </p>
                    {vendorInfo && (
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Store className="h-3 w-3" /> {vendorInfo}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mb-3">
                      Verify this transaction ID in your UPI app/bank statement before confirming.
                    </p>
                    {isPending && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => verifyPayment.mutate()}
                          disabled={verifyPayment.isPending}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-success text-success-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {verifyPayment.isPending ? "Verifying..." : "Verify & Confirm Order"}
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("Reject this payment and cancel the order?")) {
                              rejectPayment.mutate();
                            }
                          }}
                          disabled={rejectPayment.isPending}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          <ShieldX className="h-3.5 w-3.5" />
                          {rejectPayment.isPending ? "Rejecting..." : "Reject Payment"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Order Items</h4>
                <div className="space-y-2">
                  {items.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3">
                      {item.product_image && <img src={item.product_image} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground line-clamp-1">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity} × {formatPrice(Number(item.price))}</p>
                      </div>
                      <p className="text-sm font-medium text-foreground">{formatPrice(Number(item.price) * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                {addr && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Shipping Address
                    </h4>
                    <div className="text-sm text-foreground space-y-0.5">
                      <p className="font-medium">{addr.full_name}</p>
                      <p className="text-muted-foreground">{addr.address_line_1}</p>
                      {addr.address_line_2 && <p className="text-muted-foreground">{addr.address_line_2}</p>}
                      <p className="text-muted-foreground">{addr.city}, {addr.state} {addr.postal_code}</p>
                      {addr.phone && <p className="text-muted-foreground">📞 +91 {addr.phone}</p>}
                      {addr.email && <p className="text-muted-foreground">✉️ {addr.email}</p>}
                    </div>
                  </div>
                )}
                {order.notes && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                      <StickyNote className="h-3 w-3" /> Notes
                    </h4>
                    <p className="text-sm text-foreground bg-warning/5 border border-warning/10 rounded-lg p-3">{order.notes}</p>
                  </div>
                )}
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between"><span>Subtotal</span><span className="text-foreground">{formatPrice(Number(order.subtotal))}</span></div>
                  <div className="flex justify-between"><span>Shipping</span><span className="text-foreground">{formatPrice(Number(order.shipping_cost || 0))}</span></div>
                  <div className="flex justify-between"><span>Tax</span><span className="text-foreground">{formatPrice(Number(order.tax || 0))}</span></div>
                  <div className="flex justify-between font-bold text-foreground border-t border-border pt-1"><span>Total</span><span>{formatPrice(Number(order.total))}</span></div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Fetch customer names from profiles
  const userIds = [...new Set(orders.map((o: any) => o.user_id).filter(Boolean))];
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-order-profiles", userIds.join(",")],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      return data || [];
    },
    enabled: userIds.length > 0,
  });

  const customers: Record<string, string> = {};
  profiles.forEach((p: any) => { customers[p.user_id] = p.full_name || ""; });

  const filteredOrders = statusFilter === "all" ? orders : orders.filter((o: any) => o.status === statusFilter);
  const pendingCount = orders.filter((o: any) => o.status === "pending").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-title text-foreground">Orders</h2>
            <p className="text-sm text-muted-foreground">
              {orders.length} total
              {pendingCount > 0 && (
                <span className="ml-2 text-warning font-medium">· {pendingCount} awaiting verification</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-premium text-xs py-1.5 w-auto">
              <option value="all">All Orders</option>
              <option value="pending">⏳ Pending Verification</option>
              <option value="processing">🔄 Processing</option>
              <option value="shipped">📦 Shipped</option>
              <option value="delivered">✅ Delivered</option>
              <option value="cancelled">❌ Cancelled</option>
            </select>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-secondary/30">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Order</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Customer</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Date</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Total</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map((o: any) => <AdminOrderRow key={o.id} order={o} customers={customers} />)}
                {filteredOrders.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No orders found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
