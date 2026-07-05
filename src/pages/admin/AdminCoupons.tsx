import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export default function AdminCoupons() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", description: "", discount_type: "percentage", discount_value: "", min_order_amount: "", max_uses: "", is_active: true });

  const { data: coupons = [] } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => { const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false }); return data || []; },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code: form.code.toUpperCase(),
        description: form.description || null,
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : null,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        is_active: form.is_active,
      };
      if (editing) {
        const { error } = await supabase.from("coupons").update(payload).eq("id", editing);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("coupons").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-coupons"] }); toast.success(editing ? "Updated" : "Created"); resetForm(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("coupons").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-coupons"] }); toast.success("Deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => { setForm({ code: "", description: "", discount_type: "percentage", discount_value: "", min_order_amount: "", max_uses: "", is_active: true }); setEditing(null); setShowForm(false); };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-title text-foreground">Coupons</h2>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-sm py-2 px-5"><Plus className="h-4 w-4 mr-1" /> Add Coupon</button>
        </div>

        {showForm && (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">{editing ? "Edit" : "New"} Coupon</h3>
              <button onClick={resetForm}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="input-premium uppercase" placeholder="Code *" />
              <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className="input-premium">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
              <input value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} className="input-premium" placeholder="Discount Value *" type="number" />
              <input value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} className="input-premium" placeholder="Min Order Amount" type="number" />
              <input value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} className="input-premium" placeholder="Max Uses" type="number" />
            </div>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-premium min-h-[60px] resize-none" placeholder="Description" />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active
            </label>
            <div className="flex gap-3">
              <button onClick={() => saveMutation.mutate()} disabled={!form.code || !form.discount_value} className="btn-primary text-sm py-2 px-6">{editing ? "Update" : "Create"}</button>
              <button onClick={resetForm} className="btn-secondary text-sm py-2 px-6">Cancel</button>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-secondary/30">
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Code</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Discount</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Used</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Active</th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {coupons.map((c: any) => (
                <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="p-3 font-mono font-medium text-foreground">{c.code}</td>
                  <td className="p-3 text-muted-foreground">{c.discount_type === "percentage" ? `${c.discount_value}%` : `$${c.discount_value}`}</td>
                  <td className="p-3 text-muted-foreground">{c.used_count || 0}{c.max_uses ? `/${c.max_uses}` : ""}</td>
                  <td className="p-3">{c.is_active ? <span className="text-xs text-success">Active</span> : <span className="text-xs text-muted-foreground">Inactive</span>}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => { setForm({ code: c.code, description: c.description || "", discount_type: c.discount_type, discount_value: String(c.discount_value), min_order_amount: c.min_order_amount ? String(c.min_order_amount) : "", max_uses: c.max_uses ? String(c.max_uses) : "", is_active: c.is_active }); setEditing(c.id); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(c.id); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive ml-1"><Trash2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No coupons yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
