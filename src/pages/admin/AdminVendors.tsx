import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Clock, Ban, Store, ChevronDown, ChevronRight, CreditCard, MapPin, Mail, Phone, User } from "lucide-react";
import { useState } from "react";

function VendorRow({ v }: { v: any }) {
  const [expanded, setExpanded] = useState(false);
  const qc = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("vendors" as any)
        .update({ status } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-vendors"] });
      toast.success("Vendor status updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const statusIcon = (s: string) => {
    if (s === "approved") return <CheckCircle className="h-3.5 w-3.5 text-success" />;
    if (s === "rejected") return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    if (s === "suspended") return <Ban className="h-3.5 w-3.5 text-destructive" />;
    return <Clock className="h-3.5 w-3.5 text-warning" />;
  };

  const statusColor = (s: string) => {
    if (s === "approved") return "bg-success/10 text-success";
    if (s === "rejected" || s === "suspended") return "bg-destructive/10 text-destructive";
    return "bg-warning/10 text-warning";
  };

  return (
    <>
      <tr className="hover:bg-secondary/20 transition-colors cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <td className="p-3">
          <div className="flex items-center gap-3">
            {expanded ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              {v.logo_url ? (
                <img src={v.logo_url} alt="" className="h-full w-full object-cover rounded-xl" />
              ) : (
                <Store className="h-5 w-5 text-accent" />
              )}
            </div>
            <div>
              <p className="font-medium text-foreground">{v.store_name}</p>
              <p className="text-[11px] text-muted-foreground">{v.owner_name || v.store_slug}</p>
            </div>
          </div>
        </td>
        <td className="p-3">
          <p className="text-xs text-foreground">{v.email || "—"}</p>
          <p className="text-[11px] text-muted-foreground">{v.phone || ""}</p>
        </td>
        <td className="p-3 text-foreground font-medium">{v.commission_rate}%</td>
        <td className="p-3">
          <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 rounded-full", statusColor(v.status))}>
            {statusIcon(v.status)} {v.status}
          </span>
        </td>
        <td className="p-3 text-xs text-muted-foreground">
          {new Date(v.created_at).toLocaleDateString()}
        </td>
        <td className="p-3" onClick={(e) => e.stopPropagation()}>
          <select
            value={v.status}
            onChange={(e) => updateStatus.mutate({ id: v.id, status: e.target.value })}
            className="input-premium text-xs py-1 w-auto"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} className="bg-secondary/10 px-6 py-4 border-b border-border">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Store Details</h4>
                {v.owner_name && (
                  <p className="text-sm text-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" /> {v.owner_name}
                  </p>
                )}
                {v.store_description && <p className="text-sm text-muted-foreground">{v.store_description}</p>}
                {v.address && (
                  <p className="text-sm text-muted-foreground flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {v.address}
                  </p>
                )}
                {v.email && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> {v.email}
                  </p>
                )}
                {v.phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> {v.phone}
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <CreditCard className="h-3 w-3" /> Payment Info
                </h4>
                {v.upi_id ? (
                  <p className="text-sm text-foreground font-mono">{v.upi_id}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No UPI ID provided</p>
                )}
                {v.qr_code_url && (
                  <img src={v.qr_code_url} alt="QR Code" className="w-24 h-24 rounded-xl border border-border object-contain bg-white p-1" />
                )}
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Earnings</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Earnings</span>
                    <span className="text-foreground font-medium">₹{Number(v.total_earnings || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Paid</span>
                    <span className="text-foreground font-medium">₹{Number(v.total_paid || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Commission Rate</span>
                    <span className="text-foreground font-medium">{v.commission_rate}%</span>
                  </div>
                </div>
                {v.logo_url && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Logo</p>
                    <img src={v.logo_url} alt="Store Logo" className="w-16 h-16 rounded-xl border border-border object-cover" />
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminVendors() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: vendors = [] } = useQuery({
    queryKey: ["admin-vendors"],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendors" as any)
        .select("*")
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  const filteredVendors = statusFilter === "all" ? vendors : vendors.filter((v: any) => v.status === statusFilter);
  const pendingCount = vendors.filter((v: any) => v.status === "pending").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-title text-foreground">Vendors</h2>
            <p className="text-sm text-muted-foreground">
              {vendors.length} vendor applications
              {pendingCount > 0 && (
                <span className="ml-2 text-warning font-medium">· {pendingCount} pending review</span>
              )}
            </p>
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-premium text-xs py-1.5 w-auto">
            <option value="all">All Vendors</option>
            <option value="pending">⏳ Pending</option>
            <option value="approved">✅ Approved</option>
            <option value="rejected">❌ Rejected</option>
            <option value="suspended">🚫 Suspended</option>
          </select>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Store</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Contact</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Commission</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Applied</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredVendors.map((v: any) => <VendorRow key={v.id} v={v} />)}
                {filteredVendors.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No vendors found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
