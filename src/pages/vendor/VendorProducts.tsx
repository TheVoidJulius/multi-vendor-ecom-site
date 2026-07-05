import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import VendorLayout from "@/components/vendor/VendorLayout";
import { useVendor } from "@/hooks/useVendor";
import { Plus, Pencil, Trash2, X, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface ProductForm {
  name: string; slug: string; description: string; price: string;
  compare_at_price: string; category_id: string; images: string;
  stock_quantity: string; is_new: boolean; is_on_sale: boolean;
}

const emptyForm: ProductForm = {
  name: "", slug: "", description: "", price: "", compare_at_price: "",
  category_id: "", images: "", stock_quantity: "0", is_new: false, is_on_sale: false,
};

export default function VendorProducts() {
  const { vendor } = useVendor();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const { data: products = [] } = useQuery({
    queryKey: ["vendor-products", vendor?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("vendor_id", vendor!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!vendor?.id,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*");
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        description: form.description || null,
        price: parseFloat(form.price),
        compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
        category_id: form.category_id || null,
        images: form.images ? form.images.split(",").map((s) => s.trim()) : [],
        stock_quantity: parseInt(form.stock_quantity) || 0,
        is_new: form.is_new,
        is_on_sale: form.is_on_sale,
        vendor_id: vendor!.id,
        is_approved: false, // Needs admin approval
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
      qc.invalidateQueries({ queryKey: ["vendor-products"] });
      toast.success(editing ? "Product updated" : "Product submitted for approval");
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-products"] });
      toast.success("Product deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => { setForm(emptyForm); setEditing(null); setShowForm(false); };

  const startEdit = (product: any) => {
    setForm({
      name: product.name, slug: product.slug, description: product.description || "",
      price: String(product.price), compare_at_price: product.compare_at_price ? String(product.compare_at_price) : "",
      category_id: product.category_id || "", images: (product.images || []).join(", "),
      stock_quantity: String(product.stock_quantity || 0),
      is_new: product.is_new || false, is_on_sale: product.is_on_sale || false,
    });
    setEditing(product.id);
    setShowForm(true);
  };

  return (
    <VendorLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-title text-foreground">My Products</h2>
            <p className="text-sm text-muted-foreground">{products.length} products</p>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-sm py-2 px-5">
            <Plus className="h-4 w-4 mr-1" /> Add Product
          </button>
        </div>

        {showForm && (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">{editing ? "Edit Product" : "New Product"}</h3>
              <button onClick={resetForm}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="rounded-xl bg-warning/10 border border-warning/20 p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              <p className="text-xs text-warning">New products require admin approval before they appear in the store.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-premium" placeholder="Product Name *" />
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input-premium" placeholder="Slug (auto-generated)" />
              <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-premium" placeholder="Price *" type="number" step="0.01" />
              <input value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })} className="input-premium" placeholder="Compare Price" type="number" step="0.01" />
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input-premium">
                <option value="">Select Category</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className="input-premium" placeholder="Stock Quantity" type="number" />
            </div>
            <input value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} className="input-premium" placeholder="Image URLs (comma separated)" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-premium min-h-[80px] resize-none" placeholder="Description" />
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={form.is_new} onChange={(e) => setForm({ ...form, is_new: e.target.checked })} /> New
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={form.is_on_sale} onChange={(e) => setForm({ ...form, is_on_sale: e.target.checked })} /> On Sale
              </label>
            </div>
            <div className="flex gap-3">
              <button onClick={() => saveMutation.mutate()} disabled={!form.name || !form.price} className="btn-primary text-sm py-2 px-6">
                {saveMutation.isPending ? "Saving..." : editing ? "Update" : "Submit for Approval"}
              </button>
              <button onClick={resetForm} className="btn-secondary text-sm py-2 px-6">Cancel</button>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Product</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Price</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Stock</th>
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
                        <p className="font-medium text-foreground line-clamp-1">{p.name}</p>
                      </div>
                    </td>
                    <td className="p-3 text-foreground font-medium">₹{Number(p.price).toLocaleString()}</td>
                    <td className="p-3 text-muted-foreground">{p.stock_quantity}</td>
                    <td className="p-3">
                      {p.is_approved ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-success/10 text-success font-medium">
                          <CheckCircle className="h-3 w-3" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-warning/10 text-warning font-medium">
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(p.id); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No products yet. Add your first product!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}
