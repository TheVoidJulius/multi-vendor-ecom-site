import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import VendorLayout from "@/components/vendor/VendorLayout";
import { useVendor } from "@/hooks/useVendor";
import { DollarSign, Package, ShoppingCart, TrendingUp, MessageSquare, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VendorDashboard() {
  const { vendor } = useVendor();

  const { data: stats } = useQuery({
    queryKey: ["vendor-stats", vendor?.id],
    queryFn: async () => {
      // Get vendor product IDs
      const { data: vendorProducts } = await supabase
        .from("products")
        .select("id, name, images")
        .eq("vendor_id", vendor!.id);
      const productIds = (vendorProducts || []).map((p: any) => p.id);

      const [earnings, orderItems, messages] = await Promise.all([
        supabase.from("vendor_earnings" as any).select("*").eq("vendor_id", vendor!.id),
        productIds.length > 0
          ? supabase.from("order_items").select("product_id, product_name, quantity, price, orders!inner(status, created_at, order_number)")
              .in("product_id", productIds)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] }),
        supabase.from("vendor_messages" as any).select("id", { count: "exact", head: true }).eq("vendor_id", vendor!.id).eq("is_read", false).eq("is_from_vendor", false),
      ]);

      const earningsData = (earnings.data || []) as any[];
      const totalEarnings = earningsData.reduce((s: number, e: any) => s + Number(e.net_amount), 0);
      const pendingEarnings = earningsData.filter((e: any) => e.status === "pending").reduce((s: number, e: any) => s + Number(e.net_amount), 0);

      const items = (orderItems.data || []) as any[];
      const totalRevenue = items.reduce((s: number, i: any) => s + Number(i.price) * i.quantity, 0);

      // Top selling products
      const productSales: Record<string, { name: string; qty: number; revenue: number; image?: string }> = {};
      items.forEach((item: any) => {
        const pid = item.product_id;
        if (!productSales[pid]) {
          const prod = (vendorProducts || []).find((p: any) => p.id === pid);
          productSales[pid] = { name: item.product_name, qty: 0, revenue: 0, image: prod?.images?.[0] };
        }
        productSales[pid].qty += item.quantity;
        productSales[pid].revenue += Number(item.price) * item.quantity;
      });
      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Monthly revenue (last 6 months)
      const monthlyRevenue: { month: string; revenue: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const monthLabel = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        const rev = items
          .filter((it: any) => it.orders?.created_at?.startsWith(monthKey))
          .reduce((s: number, it: any) => s + Number(it.price) * it.quantity, 0);
        monthlyRevenue.push({ month: monthLabel, revenue: rev });
      }

      return {
        productCount: (vendorProducts || []).length,
        orderCount: items.length,
        totalRevenue,
        totalEarnings,
        pendingEarnings,
        unreadMessages: messages.count || 0,
        topProducts,
        monthlyRevenue,
        recentOrders: items.slice(0, 5),
      };
    },
    enabled: !!vendor?.id,
  });

  const statCards = [
    { label: "Total Revenue", value: `₹${(stats?.totalRevenue ?? 0).toLocaleString("en-IN")}`, icon: BarChart3, color: "bg-accent/10 text-accent" },
    { label: "Net Earnings", value: `₹${(stats?.totalEarnings ?? 0).toLocaleString("en-IN")}`, icon: DollarSign, color: "bg-success/10 text-success" },
    { label: "Pending Payout", value: `₹${(stats?.pendingEarnings ?? 0).toLocaleString("en-IN")}`, icon: TrendingUp, color: "bg-warning/10 text-warning" },
    { label: "Total Orders", value: stats?.orderCount ?? 0, icon: ShoppingCart, color: "bg-primary/10 text-primary" },
    { label: "Products", value: stats?.productCount ?? 0, icon: Package, color: "bg-secondary text-foreground" },
    { label: "Unread Messages", value: stats?.unreadMessages ?? 0, icon: MessageSquare, color: "bg-destructive/10 text-destructive" },
  ];

  const maxRevenue = Math.max(...(stats?.monthlyRevenue?.map((m) => m.revenue) || [1]));

  return (
    <VendorLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-title text-foreground">Welcome, {vendor?.store_name}</h2>
          <p className="text-sm text-muted-foreground mt-1">Here's your store performance overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((card, i) => (
            <div key={card.label} className="stat-card animate-fade-in-up opacity-0" style={{ animationDelay: `${i * 0.04}s` }}>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color} mb-4`}>
                <card.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-foreground tracking-tight">{card.value}</p>
              <p className="text-[11px] font-medium text-muted-foreground mt-1 uppercase tracking-wider">{card.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-sm font-bold text-foreground mb-6">Monthly Revenue</h3>
            <div className="flex items-end gap-2 h-40">
              {stats?.monthlyRevenue?.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-accent/20 rounded-t-lg transition-all duration-500 min-h-[4px]"
                    style={{ height: `${maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 4}%` }}
                  >
                    <div
                      className="w-full h-full bg-accent rounded-t-lg"
                      style={{ opacity: m.revenue > 0 ? 1 : 0.2 }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{m.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-sm font-bold text-foreground mb-4">Top Selling Products</h3>
            {(stats?.topProducts ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No sales data yet.</p>
            ) : (
              <div className="space-y-3">
                {stats?.topProducts?.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                    <div className="w-10 h-10 rounded-lg bg-secondary overflow-hidden shrink-0">
                      {p.image && <img src={p.image} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.qty} sold</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">₹{p.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Commission info */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-sm font-bold text-foreground mb-1">Commission Rate</h3>
          <p className="text-sm text-muted-foreground">
            Platform commission: <strong className="text-foreground">{vendor?.commission_rate || 10}%</strong> · 
            You earn: <strong className="text-success">{100 - (vendor?.commission_rate || 10)}%</strong> of each sale.
          </p>
        </div>

        {/* Recent Orders */}
        {(stats?.recentOrders ?? []).length > 0 && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="p-5 border-b border-border/50">
              <h3 className="text-sm font-bold text-foreground">Recent Orders</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Order</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Product</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Qty</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats?.recentOrders?.map((item: any, i: number) => (
                  <tr key={i} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-3 font-mono text-xs">{item.orders?.order_number || "—"}</td>
                    <td className="p-3 text-foreground">{item.product_name}</td>
                    <td className="p-3 text-muted-foreground">{item.quantity}</td>
                    <td className="p-3 font-medium">₹{(Number(item.price) * item.quantity).toLocaleString()}</td>
                    <td className="p-3">
                      <span className={cn(
                        "text-[10px] font-bold uppercase px-2 py-1 rounded-full",
                        item.orders?.status === "delivered" ? "bg-success/10 text-success" :
                        item.orders?.status === "pending" ? "bg-warning/10 text-warning" :
                        item.orders?.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                        "bg-accent/10 text-accent"
                      )}>{item.orders?.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </VendorLayout>
  );
}
