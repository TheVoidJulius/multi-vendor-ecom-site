import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Package, Clock, CheckCircle, Truck, XCircle, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import type { Order } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";
import { useState } from "react";

const statusConfig: Record<string, { icon: any; label: string; className: string }> = {
  pending: { icon: Clock, label: "Pending", className: "text-warning" },
  processing: { icon: Package, label: "Processing", className: "text-accent" },
  shipped: { icon: Truck, label: "Shipped", className: "text-accent" },
  delivered: { icon: CheckCircle, label: "Delivered", className: "text-success" },
  cancelled: { icon: XCircle, label: "Cancelled", className: "text-destructive" },
};

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["order-items", order.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);
      return data || [];
    },
    enabled: expanded,
  });

  const config = statusConfig[order.status] || statusConfig.pending;
  const Icon = config.icon;
  const isPending = order.status === "pending";

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-secondary/20 transition-colors"
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <p className="font-mono text-sm text-foreground font-medium">{order.order_number}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(order.created_at).toLocaleDateString("en-IN", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          </div>
          <div className={cn("flex items-center gap-1.5 text-sm font-medium", config.className)}>
            <Icon className="h-4 w-4" />
            {isPending ? "Awaiting Payment Verification" : config.label}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-lg font-semibold text-foreground">{formatPrice(Number(order.total))}</p>
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-6 py-4 bg-secondary/10 animate-fade-in">
          {isPending && (
            <div className="rounded-xl bg-warning/5 border border-warning/20 p-4 mb-4">
              <p className="text-sm font-medium text-foreground">⏳ Payment Verification Pending</p>
              <p className="text-xs text-muted-foreground mt-1">Our team is verifying your UPI payment. Once confirmed, your order will be processed.</p>
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No items found.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item: any) => (
                <div key={item.id} className="flex items-center gap-4">
                  {item.product_image && (
                    <img src={item.product_image} alt="" className="w-12 h-12 rounded-lg object-cover border border-border" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-1">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity} × {formatPrice(Number(item.price))}</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{formatPrice(Number(item.price) * item.quantity)}</p>
                </div>
              ))}
              <hr className="border-border" />
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>Subtotal</span><span className="text-right text-foreground">{formatPrice(Number(order.subtotal))}</span>
                <span>Shipping</span><span className="text-right text-foreground">{Number(order.shipping_cost) === 0 ? "Free" : formatPrice(Number(order.shipping_cost))}</span>
                <span>Tax (GST)</span><span className="text-right text-foreground">{formatPrice(Number(order.tax))}</span>
              </div>
              {order.notes && (
                <p className="text-xs text-muted-foreground mt-2">
                  <span className="font-medium text-foreground">Note:</span> {order.notes}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Orders() {
  const { user } = useAuth();

  const { data: orders = [] } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return (data || []) as Order[];
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <Layout>
        <div className="container-premium py-20 text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-title text-foreground mb-2">Order History</h1>
          <p className="text-muted-foreground mb-6">Sign in to view your orders.</p>
          <Link to="/auth" className="btn-primary">Sign In</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-premium py-10">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">Orders</span>
        </nav>
        <h1 className="text-headline text-foreground mb-2">Your Orders</h1>
        <p className="text-sm text-muted-foreground mb-8">{orders.length} order{orders.length !== 1 ? "s" : ""}</p>
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No orders yet.</p>
            <Link to="/products" className="btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
