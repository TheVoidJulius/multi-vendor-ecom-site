import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export default function AdminBanners() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", subtitle: "", image_url: "", link_url: "", position: "0", is_active: true });

  const { data: banners = [] } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => { const { data } = await supabase.from("banners").select("*").order("position"); return data || []; },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title, subtitle: form.subtitle || null, image_url: form.image_url,
        link_url: form.link_url || null, position: parseInt(form.position) || 0, is_active: form.is_active,
      };
      if (editing) {
        const { error } = await supabase.from("banners").update(payload).eq("id", editing);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("banners").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-banners"] }); toast.success(editing ? "Updated" : "Created"); resetForm(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("banners").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-banners"] }); toast.success("Deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => { setForm({ title: "", subtitle: "", image_url: "", link_url: "", position: "0", is_active: true }); setEditing(null); setShowForm(false); };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-title text-foreground">Banners</h2>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-sm py-2 px-5"><Plus className="h-4 w-4 mr-1" /> Add Banner</button>
        </div>

        {showForm && (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">{editing ? "Edit" : "New"} Banner</h3>
              <button onClick={resetForm}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-premium" placeholder="Title *" />
              <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="input-premium" placeholder="Subtitle" />
              <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="input-premium" placeholder="Image URL *" />
              <input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} className="input-premium" placeholder="Link URL" />
              <input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="input-premium" placeholder="Position" type="number" />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active
            </label>
            <div className="flex gap-3">
              <button onClick={() => saveMutation.mutate()} disabled={!form.title || !form.image_url} className="btn-primary text-sm py-2 px-6">{editing ? "Update" : "Create"}</button>
              <button onClick={resetForm} className="btn-secondary text-sm py-2 px-6">Cancel</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((b: any) => (
            <div key={b.id} className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="aspect-[16/9] bg-secondary overflow-hidden">
                <img src={b.image_url} alt={b.title} className="h-full w-full object-cover" />
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{b.title}</p>
                  <p className="text-xs text-muted-foreground">{b.subtitle}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setForm({ title: b.title, subtitle: b.subtitle || "", image_url: b.image_url, link_url: b.link_url || "", position: String(b.position || 0), is_active: b.is_active }); setEditing(b.id); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(b.id); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
          {banners.length === 0 && <p className="text-muted-foreground col-span-2 text-center py-8">No banners yet.</p>}
        </div>
      </div>
    </AdminLayout>
  );
}
