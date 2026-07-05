import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import VendorLayout from "@/components/vendor/VendorLayout";
import { useVendor } from "@/hooks/useVendor";
import { cn } from "@/lib/utils";

export default function VendorOrders() {
  const { vendor } = useVendor();

  const { data: orderItems = [] } = useQuery({
    queryKey: ["vendor-orders", vendor?.id],
    queryFn: async () => {
      // Get vendor's product ids
      const { data: products } = await supabase
        .from("products")
        .select("id")
        .eq("vendor_id", vendor!.id);

      const productIds = (products || []).map((p: any) => p.id);
      if (productIds.length === 0) return [];

      const { data } = await supabase
        .from("order_items")
        .select("*, orders(order_number, status, created_at, shipping_address)")
        .in("product_id", productIds)
        .order("created_at", { ascending: false });

      return data || [];
    },
    enabled: !!vendor?.id,
  });

  const statusColor = (s: string) => {
    if (s === "delivered") return "bg-success/10 text-success";
    if (s === "pending") return "bg-warning/10 text-warning";
    if (s === "cancelled") return "bg-destructive/10 text-destructive";
    return "bg-accent/10 text-accent";
  };

  return (
    <VendorLayout>
      <div className="space-y-6">
        <h2 className="text-title text-foreground">My Orders</h2>
        <p className="text-sm text-muted-foreground">Orders containing your products.</p>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Order</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Product</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Qty</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orderItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-3 font-mono text-xs text-foreground">{item.orders?.order_number || "—"}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {item.product_image && (
                          <img src={item.product_image} alt="" className="w-8 h-8 rounded object-cover" />
                        )}
                        <span className="text-foreground line-clamp-1">{item.product_name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{item.quantity}</td>
                    <td className="p-3 font-medium text-foreground">₹{(Number(item.price) * item.quantity).toLocaleString()}</td>
                    <td className="p-3">
                      <span className={cn("text-[10px] font-bold uppercase px-2 py-1 rounded-full", statusColor(item.orders?.status || ""))}>
                        {item.orders?.status || "—"}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {item.orders?.created_at ? new Date(item.orders.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
                {orderItems.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}
