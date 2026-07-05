import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import VendorLayout from "@/components/vendor/VendorLayout";
import { useVendor } from "@/hooks/useVendor";
import { DollarSign, TrendingUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VendorEarnings() {
  const { vendor } = useVendor();

  const { data: earnings = [] } = useQuery({
    queryKey: ["vendor-earnings", vendor?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_earnings" as any)
        .select("*, orders(order_number)")
        .eq("vendor_id", vendor!.id)
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
    enabled: !!vendor?.id,
  });

  const totalEarnings = earnings.reduce((s, e) => s + Number(e.net_amount), 0);
  const pendingEarnings = earnings.filter((e) => e.status === "pending").reduce((s, e) => s + Number(e.net_amount), 0);
  const paidEarnings = earnings.filter((e) => e.status === "paid").reduce((s, e) => s + Number(e.net_amount), 0);

  return (
    <VendorLayout>
      <div className="space-y-6">
        <h2 className="text-title text-foreground">Earnings</h2>

        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card">
            <DollarSign className="h-5 w-5 text-success mb-2" />
            <p className="text-xl font-bold text-foreground">₹{totalEarnings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Total Earned</p>
          </div>
          <div className="stat-card">
            <Clock className="h-5 w-5 text-warning mb-2" />
            <p className="text-xl font-bold text-foreground">₹{pendingEarnings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Pending</p>
          </div>
          <div className="stat-card">
            <TrendingUp className="h-5 w-5 text-accent mb-2" />
            <p className="text-xl font-bold text-foreground">₹{paidEarnings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Paid Out</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Order</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Sale Amount</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Commission</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Net Earned</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {earnings.map((e: any) => (
                  <tr key={e.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-3 font-mono text-xs text-foreground">{e.orders?.order_number || "—"}</td>
                    <td className="p-3 text-foreground">₹{Number(e.amount).toLocaleString()}</td>
                    <td className="p-3 text-destructive">-₹{Number(e.commission).toLocaleString()}</td>
                    <td className="p-3 font-medium text-success">₹{Number(e.net_amount).toLocaleString()}</td>
                    <td className="p-3">
                      <span className={cn(
                        "text-[10px] font-bold uppercase px-2 py-1 rounded-full",
                        e.status === "paid" ? "bg-success/10 text-success" : e.status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                      )}>{e.status}</span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {earnings.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No earnings yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}
