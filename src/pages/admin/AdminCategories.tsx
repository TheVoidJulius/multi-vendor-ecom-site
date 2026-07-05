import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export default function AdminCategories() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", image_url: "" });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => { const { data } = await supabase.from("categories").select("*").order("name"); return data || []; },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        description: form.description || null,
        image_url: form.image_url || null,
      };
      if (editing) {
        const { error } = await supabase.from("categories").update(payload).eq("id", editing);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-categories"] }); toast.success(editing ? "Updated" : "Created"); resetForm(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("categories").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-categories"] }); toast.success("Deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => { setForm({ name: "", slug: "", description: "", image_url: "" }); setEditing(null); setShowForm(false); };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-title text-foreground">Categories</h2>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-sm py-2 px-5"><Plus className="h-4 w-4 mr-1" /> Add Category</button>
        </div>

        {showForm && (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">{editing ? "Edit" : "New"} Category</h3>
              <button onClick={resetForm}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-premium" placeholder="Name *" />
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input-premium" placeholder="Slug" />
              <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="input-premium" placeholder="Image URL" />
            </div>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-premium min-h-[60px] resize-none" placeholder="Description" />
            <div className="flex gap-3">
              <button onClick={() => saveMutation.mutate()} disabled={!form.name} className="btn-primary text-sm py-2 px-6">{editing ? "Update" : "Create"}</button>
              <button onClick={resetForm} className="btn-secondary text-sm py-2 px-6">Cancel</button>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-secondary/30">
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Category</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">Description</th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {categories.map((c: any) => (
                <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="p-3 font-medium text-foreground">{c.name}</td>
                  <td className="p-3 text-muted-foreground text-xs line-clamp-1">{c.description || "—"}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => { setForm({ name: c.name, slug: c.slug, description: c.description || "", image_url: c.image_url || "" }); setEditing(c.id); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(c.id); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive ml-1"><Trash2 className="h-3.5 w-3.5" /></button>
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
