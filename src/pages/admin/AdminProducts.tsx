import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Plus, Pencil, Trash2, X, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface ProductForm {
  name: string; slug: string; description: string; price: string;
  compare_at_price: string; brand_id: string; category_id: string;
  images: string; stock_quantity: string; is_featured: boolean;
  is_new: boolean; is_on_sale: boolean;
}

const emptyForm: ProductForm = {
  name: "", slug: "", description: "", price: "", compare_at_price: "",
  brand_id: "", category_id: "", images: "", stock_quantity: "0",
  is_featured: false, is_new: false, is_on_sale: false,
};

export default function AdminProducts() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*, brands(name), categories(name)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors-all"],
    queryFn: async () => {
      const { data } = await supabase.from("vendors" as any).select("id, store_name");
      return (data || []) as any[];
    },
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["brands-all"],
    queryFn: async () => { const { data } = await supabase.from("brands").select("*"); return data || []; },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => { const { data } = await supabase.from("categories").select("*"); return data || []; },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        description: form.description || null,
        price: parseFloat(form.price),
        compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
        brand_id: form.brand_id || null,
        category_id: form.category_id || null,
        images: form.images ? form.images.split(",").map((s) => s.trim()) : [],
        stock_quantity: parseInt(form.stock_quantity) || 0,
        is_featured: form.is_featured,
        is_new: form.is_new,
        is_on_sale: form.is_on_sale,
      };

      if (editing) {
        const { error } = await supabase.from("products").update(payload).eq("id", editing);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(editing ? "Product updated" : "Product created");
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); toast.success("Product deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => { setForm(emptyForm); setEditing(null); setShowForm(false); };

  const startEdit = (product: any) => {
    setForm({
      name: product.name, slug: product.slug, description: product.description || "",
      price: String(product.price), compare_at_price: product.compare_at_price ? String(product.compare_at_price) : "",
      brand_id: product.brand_id || "", category_id: product.category_id || "",
      images: (product.images || []).join(", "), stock_quantity: String(product.stock_quantity || 0),
      is_featured: product.is_featured || false, is_new: product.is_new || false, is_on_sale: product.is_on_sale || false,
    });
    setEditing(product.id);
    setShowForm(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-title text-foreground">Products</h2>
            <p className="text-sm text-muted-foreground">{products.length} products</p>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-sm py-2 px-5">
            <Plus className="h-4 w-4 mr-1" /> Add Product
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">{editing ? "Edit Product" : "New Product"}</h3>
              <button onClick={resetForm}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-premium" placeholder="Product Name *" required />
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input-premium" placeholder="Slug (auto-generated)" />
              <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-premium" placeholder="Price *" type="number" step="0.01" required />
              <input value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })} className="input-premium" placeholder="Compare Price" type="number" step="0.01" />
              <select value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })} className="input-premium">
                <option value="">Select Brand</option>
                {brands.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input-premium">
                <option value="">Select Category</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className="input-premium" placeholder="Stock Quantity" type="number" />
              <input value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} className="input-premium" placeholder="Image URLs (comma separated)" />
            </div>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-premium min-h-[80px] resize-none" placeholder="Description" />
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Featured
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={form.is_new} onChange={(e) => setForm({ ...form, is_new: e.target.checked })} /> New
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={form.is_on_sale} onChange={(e) => setForm({ ...form, is_on_sale: e.target.checked })} /> On Sale
              </label>
            </div>
            <div className="flex gap-3">
              <button onClick={() => saveMutation.mutate()} disabled={!form.name || !form.price} className="btn-primary text-sm py-2 px-6">
                {saveMutation.isPending ? "Saving..." : editing ? "Update" : "Create"}
              </button>
              <button onClick={resetForm} className="btn-secondary text-sm py-2 px-6">Cancel</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Product</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Brand</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Vendor</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Price</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Stock</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Approval</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p: any) => (
                  <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary overflow-hidden shrink-0">
                          {p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div>
                          <p className="font-medium text-foreground line-clamp-1">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{p.brands?.name || "—"}</td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {vendors.find((v: any) => v.id === p.vendor_id)?.store_name || "—"}
                    </td>
                    <td className="p-3 text-foreground font-medium">₹{Number(p.price).toLocaleString()}</td>
                    <td className="p-3 text-muted-foreground">{p.stock_quantity}</td>
                    <td className="p-3">
                      {p.is_approved === false ? (
                        <button
                          onClick={async () => {
                            await supabase.from("products").update({ is_approved: true }).eq("id", p.id);
                            qc.invalidateQueries({ queryKey: ["admin-products"] });
                            toast.success("Product approved");
                          }}
                          className="text-[10px] px-2 py-1 rounded-full bg-warning/10 text-warning font-medium hover:bg-success/10 hover:text-success transition-colors inline-flex items-center gap-1"
                        >
                          <Clock className="h-3 w-3" /> Approve
                        </button>
                      ) : (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-success/10 text-success font-medium inline-flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Approved
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {p.is_featured && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent">Featured</span>}
                        {p.is_new && <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success">New</span>}
                        {p.is_on_sale && <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">Sale</span>}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => { if (confirm("Delete this product?")) deleteMutation.mutate(p.id); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
