import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import VendorLayout from "@/components/vendor/VendorLayout";
import { useVendor } from "@/hooks/useVendor";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Save, Upload, Loader2, CreditCard } from "lucide-react";

export default function VendorSettings() {
  const { vendor, refetch } = useVendor();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [form, setForm] = useState({
    store_name: "",
    store_description: "",
    logo_url: "",
    banner_url: "",
    phone: "",
    email: "",
    address: "",
    upi_id: "",
    qr_code_url: "",
  });

  useEffect(() => {
    if (vendor) {
      setForm({
        store_name: vendor.store_name || "",
        store_description: vendor.store_description || "",
        logo_url: vendor.logo_url || "",
        banner_url: vendor.banner_url || "",
        phone: vendor.phone || "",
        email: vendor.email || "",
        address: vendor.address || "",
        upi_id: vendor.upi_id || "",
        qr_code_url: vendor.qr_code_url || "",
      });
    }
  }, [vendor]);

  const uploadFile = async (file: File, folder: string, setUploading: (v: boolean) => void): Promise<string | null> => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${folder}/${user!.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("vendor-assets").upload(path, file);
    setUploading(false);
    if (error) { toast.error("Upload failed: " + error.message); return null; }
    const { data: { publicUrl } } = supabase.storage.from("vendor-assets").getPublicUrl(path);
    return publicUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "logo_url" | "banner_url" | "qr_code_url", folder: string, setUploading: (v: boolean) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB"); return; }
    const url = await uploadFile(file, folder, setUploading);
    if (url) setForm({ ...form, [field]: url });
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("vendors" as any)
      .update({
        store_name: form.store_name,
        store_description: form.store_description || null,
        logo_url: form.logo_url || null,
        banner_url: form.banner_url || null,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        upi_id: form.upi_id || null,
        qr_code_url: form.qr_code_url || null,
      } as any)
      .eq("id", vendor!.id);

    if (error) toast.error(error.message);
    else {
      toast.success("Store settings saved!");
      refetch();
    }
    setLoading(false);
  };

  const ImageUploadField = ({ label, value, field, folder, uploading, setUploading, size = "w-20 h-20" }: {
    label: string; value: string; field: "logo_url" | "banner_url" | "qr_code_url"; folder: string; uploading: boolean; setUploading: (v: boolean) => void; size?: string;
  }) => (
    <div>
      <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
      <div className="flex items-center gap-4">
        {value ? (
          <img src={value} alt="" className={`${size} rounded-xl border border-border object-cover`} />
        ) : (
          <div className={`${size} rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30`}>
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <label className="btn-secondary text-xs py-2 px-4 cursor-pointer inline-flex items-center gap-1.5">
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {uploading ? "Uploading..." : "Upload"}
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, field, folder, setUploading)} className="hidden" disabled={uploading} />
          </label>
          {value && (
            <button onClick={() => setForm({ ...form, [field]: "" })} className="text-xs text-destructive hover:underline">Remove</button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <VendorLayout>
      <div className="space-y-6 max-w-2xl">
        <h2 className="text-title text-foreground">Store Settings</h2>

        {/* Store Info */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Store Information</h3>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Store Name</label>
            <input value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} className="input-premium" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
            <textarea value={form.store_description} onChange={(e) => setForm({ ...form, store_description: e.target.value })} className="input-premium min-h-[100px] resize-none" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-premium" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-premium" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Address</label>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-premium min-h-[60px] resize-none" />
          </div>
        </div>

        {/* Branding */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Branding</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <ImageUploadField label="Store Logo" value={form.logo_url} field="logo_url" folder="logos" uploading={uploadingLogo} setUploading={setUploadingLogo} size="w-20 h-20" />
            <ImageUploadField label="Store Banner" value={form.banner_url} field="banner_url" folder="banners" uploading={uploadingBanner} setUploading={setUploadingBanner} size="w-32 h-20" />
          </div>
        </div>

        {/* Payment */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Payment Settings</h3>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">UPI ID</label>
            <input value={form.upi_id} onChange={(e) => setForm({ ...form, upi_id: e.target.value })} className="input-premium" placeholder="yourname@upi" />
            <p className="text-xs text-muted-foreground mt-1">Customers will pay to this UPI ID during checkout.</p>
          </div>
          <ImageUploadField label="QR Code Image" value={form.qr_code_url} field="qr_code_url" folder="qr-codes" uploading={uploadingQr} setUploading={setUploadingQr} size="w-24 h-24" />
          
          {form.upi_id && !form.qr_code_url && (
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground mb-2">Auto-generated QR preview:</p>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=upi://pay?pa=${encodeURIComponent(form.upi_id)}`}
                alt="QR Preview"
                className="w-24 h-24 rounded-lg border border-border"
              />
            </div>
          )}
        </div>

        <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2">
          <Save className="h-4 w-4" />
          {loading ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </VendorLayout>
  );
}
