import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { DollarSign, Package, ShoppingCart, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [products, orders, brands, categories] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, total, status, created_at").order("created_at", { ascending: false }),
        supabase.from("brands").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
      ]);

      const allOrders = orders.data || [];
      const totalRevenue = allOrders.reduce((sum, o) => sum + Number(o.total), 0);
      const pendingOrders = allOrders.filter((o) => o.status === "pending").length;

      return {
        productCount: products.count || 0,
        orderCount: allOrders.length,
        brandCount: brands.count || 0,
        categoryCount: categories.count || 0,
        totalRevenue,
        pendingOrders,
        recentOrders: allOrders.slice(0, 8),
      };
    },
  });

  const statCards = [
    { label: "Total Revenue", value: `₹${(stats?.totalRevenue ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "bg-success/10 text-success", trend: "+12.5%" },
    { label: "Total Orders", value: stats?.orderCount ?? 0, icon: ShoppingCart, color: "bg-accent/10 text-accent", trend: "+8.2%" },
    { label: "Products", value: stats?.productCount ?? 0, icon: Package, color: "bg-warning/10 text-warning", trend: null },
    { label: "Pending", value: stats?.pendingOrders ?? 0, icon: TrendingUp, color: "bg-destructive/10 text-destructive", trend: null },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="animate-fade-in">
          <h2 className="text-title text-foreground">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Overview of your store performance.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, i) => (
            <div
              key={card.label}
              className="stat-card animate-fade-in-up opacity-0"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                {card.trend && (
                  <span className="flex items-center gap-0.5 text-[11px] font-semibold text-success">
                    <ArrowUpRight className="h-3 w-3" />
                    {card.trend}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground tracking-tight">{card.value}</p>
              <p className="text-[11px] font-medium text-muted-foreground mt-1 uppercase tracking-wider">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs animate-fade-in-up opacity-0" style={{ animationDelay: "0.2s" }}>
          <div className="p-5 border-b border-border/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Recent Orders</h3>
            <span className="text-[11px] text-muted-foreground">{stats?.recentOrders?.length ?? 0} latest</span>
          </div>
          {(stats?.recentOrders ?? []).length === 0 ? (
            <div className="p-8 text-sm text-muted-foreground text-center">No orders yet.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentOrders.map((order: any) => (
                  <tr key={order.id}>
                    <td className="font-mono text-xs font-semibold">{order.order_number || order.id.slice(0, 8)}</td>
                    <td className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        order.status === "delivered" ? "bg-success/10 text-success" :
                        order.status === "pending" ? "bg-warning/10 text-warning" :
                        order.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                        "bg-accent/10 text-accent"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="text-right font-semibold">₹{Number(order.total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
