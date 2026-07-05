import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export default function AdminBrands() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", logo_url: "", banner_url: "", is_featured: false });

  const { data: brands = [] } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: async () => { const { data } = await supabase.from("brands").select("*").order("name"); return data || []; },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        description: form.description || null,
        logo_url: form.logo_url || null,
        banner_url: form.banner_url || null,
        is_featured: form.is_featured,
      };
      if (editing) {
        const { error } = await supabase.from("brands").update(payload).eq("id", editing);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("brands").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-brands"] }); toast.success(editing ? "Brand updated" : "Brand created"); resetForm(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("brands").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-brands"] }); toast.success("Brand deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => { setForm({ name: "", slug: "", description: "", logo_url: "", banner_url: "", is_featured: false }); setEditing(null); setShowForm(false); };

  const startEdit = (b: any) => {
    setForm({ name: b.name, slug: b.slug, description: b.description || "", logo_url: b.logo_url || "", banner_url: b.banner_url || "", is_featured: b.is_featured || false });
    setEditing(b.id); setShowForm(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-title text-foreground">Brands</h2>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-sm py-2 px-5"><Plus className="h-4 w-4 mr-1" /> Add Brand</button>
        </div>

        {showForm && (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">{editing ? "Edit Brand" : "New Brand"}</h3>
              <button onClick={resetForm}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-premium" placeholder="Brand Name *" />
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input-premium" placeholder="Slug" />
              <input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} className="input-premium" placeholder="Logo URL" />
              <input value={form.banner_url} onChange={(e) => setForm({ ...form, banner_url: e.target.value })} className="input-premium" placeholder="Banner URL" />
            </div>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-premium min-h-[80px] resize-none" placeholder="Description" />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Featured
            </label>
            <div className="flex gap-3">
              <button onClick={() => saveMutation.mutate()} disabled={!form.name} className="btn-primary text-sm py-2 px-6">{editing ? "Update" : "Create"}</button>
              <button onClick={resetForm} className="btn-secondary text-sm py-2 px-6">Cancel</button>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-secondary/30">
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Brand</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Featured</th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {brands.map((b: any) => (
                <tr key={b.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="p-3">
                    <p className="font-medium text-foreground">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.slug}</p>
                  </td>
                  <td className="p-3">{b.is_featured ? <span className="text-xs text-accent">Yes</span> : <span className="text-xs text-muted-foreground">No</span>}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => startEdit(b)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(b.id); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive ml-1"><Trash2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
