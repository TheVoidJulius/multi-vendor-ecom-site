import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useVendor } from "@/hooks/useVendor";
import { toast } from "sonner";
import { Store, Clock, XCircle, Upload, Loader2, AlertCircle } from "lucide-react";
import { isValidPhone } from "@/lib/utils";

export default function VendorRegister() {
  const { user } = useAuth();
  const { vendor, isPendingVendor, isRejectedVendor, isVendor } = useVendor();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    storeName: "",
    ownerName: "",
    storeDescription: "",
    phone: "",
    email: "",
    address: "",
    upiId: "",
    logoUrl: "",
    qrCodeUrl: "",
  });

  if (!user) { navigate("/auth"); return null; }
  if (isVendor) { navigate("/vendor"); return null; }

  if (isPendingVendor) {
    return (
      <Layout>
        <div className="container-premium py-20 text-center max-w-lg mx-auto">
          <Clock className="h-16 w-16 text-warning mx-auto mb-6" />
          <h1 className="text-headline text-foreground mb-3">Application Pending</h1>
          <p className="text-body-large">
            Your vendor application is under review. We'll notify you once it's approved.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Store: <strong>{vendor?.store_name}</strong>
          </p>
        </div>
      </Layout>
    );
  }

  if (isRejectedVendor) {
    return (
      <Layout>
        <div className="container-premium py-20 text-center max-w-lg mx-auto">
          <XCircle className="h-16 w-16 text-destructive mx-auto mb-6" />
          <h1 className="text-headline text-foreground mb-3">Application Rejected</h1>
          <p className="text-body-large">
            Unfortunately, your vendor application was not approved. Please contact support for more details.
          </p>
        </div>
      </Layout>
    );
  }

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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo must be under 2MB"); return; }
    const url = await uploadFile(file, "logos", setUploadingLogo);
    if (url) setForm({ ...form, logoUrl: url });
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("QR image must be under 2MB"); return; }
    const url = await uploadFile(file, "qr-codes", setUploadingQr);
    if (url) setForm({ ...form, qrCodeUrl: url });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.storeName.trim() || form.storeName.trim().length < 3) e.storeName = "Store name required (min 3 chars)";
    if (!form.ownerName.trim() || form.ownerName.trim().length < 3) e.ownerName = "Owner name required (min 3 chars)";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
    if (!isValidPhone(form.phone.replace(/\D/g, ""))) e.phone = "Valid 10-digit mobile required";
    if (!form.address.trim() || form.address.trim().length < 10) e.address = "Complete business address required";
    if (!form.upiId.trim() || !form.upiId.includes("@")) e.upiId = "Valid UPI ID required (e.g. name@upi)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const slug = form.storeName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 50);

    const { error } = await supabase.from("vendors" as any).insert({
      user_id: user!.id,
      store_name: form.storeName.trim(),
      store_slug: slug + "-" + Date.now().toString(36),
      store_description: form.storeDescription || null,
      owner_name: form.ownerName.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || user!.email || null,
      address: form.address.trim() || null,
      upi_id: form.upiId.trim(),
      qr_code_url: form.qrCodeUrl || null,
      logo_url: form.logoUrl || null,
    } as any);

    if (error) {
      toast.error(error.message);
    } else {
      await supabase.from("user_roles").insert({ user_id: user!.id, role: "vendor" as any });
      toast.success("Application submitted! We'll review it shortly.");
      navigate("/vendor/register");
      window.location.reload();
    }
    setLoading(false);
  };

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? (
      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
        <AlertCircle className="h-3 w-3" /> {errors[field]}
      </p>
    ) : null;

  return (
    <Layout>
      <div className="container-premium py-16 max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-6">
            <Store className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-headline text-foreground mb-3">Become a Seller</h1>
          <p className="text-body-large max-w-md mx-auto">
            Start selling your products on Veloura Marketplace. Reach thousands of customers.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-card border border-border p-8">
          {/* Store Info */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Store Name *</label>
            <input value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} className="input-premium" placeholder="My Awesome Store" />
            <FieldError field="storeName" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Owner Name *</label>
            <input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} className="input-premium" placeholder="Your full name" />
            <FieldError field="ownerName" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Store Description</label>
            <textarea value={form.storeDescription} onChange={(e) => setForm({ ...form, storeDescription: e.target.value })} className="input-premium min-h-[100px] resize-none" placeholder="Tell customers about your store..." />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Contact Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-premium" placeholder="store@example.com" />
              <FieldError field="email" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Phone *</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-border bg-muted text-sm text-muted-foreground">+91</span>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} className="input-premium rounded-l-none" placeholder="9876543210" maxLength={10} />
              </div>
              <FieldError field="phone" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Business Address *</label>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-premium min-h-[60px] resize-none" placeholder="Full business address" />
            <FieldError field="address" />
          </div>

          {/* Payment Info */}
          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Payment Information</h3>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">UPI ID *</label>
              <input value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} className="input-premium" placeholder="yourname@upi" />
              <p className="text-xs text-muted-foreground mt-1">Customers will pay to this UPI ID. Example: yourname@paytm, yourname@ybl</p>
              <FieldError field="upiId" />
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-foreground mb-1.5 block">QR Code Image (Optional)</label>
              <div className="flex items-center gap-4">
                {form.qrCodeUrl ? (
                  <img src={form.qrCodeUrl} alt="QR Code" className="w-24 h-24 rounded-xl border border-border object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <label className="btn-secondary text-xs py-2 px-4 cursor-pointer inline-flex items-center gap-1.5">
                    {uploadingQr ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {uploadingQr ? "Uploading..." : "Upload QR Code"}
                    <input type="file" accept="image/*" onChange={handleQrUpload} className="hidden" disabled={uploadingQr} />
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">Upload your UPI QR code image (max 2MB)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Store Logo */}
          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Store Branding</h3>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Store Logo (Optional)</label>
              <div className="flex items-center gap-4">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Store Logo" className="w-16 h-16 rounded-xl border border-border object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                    <Store className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <label className="btn-secondary text-xs py-2 px-4 cursor-pointer inline-flex items-center gap-1.5">
                  {uploadingLogo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {uploadingLogo ? "Uploading..." : "Upload Logo"}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploadingLogo} />
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">How it works:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Submit your application — we'll review it within 24-48 hours</li>
              <li>Once approved, you can start adding products</li>
              <li>Customers pay via your UPI QR code</li>
              <li>Admin verifies payments and confirms orders</li>
              <li>Earn on every sale with transparent commission</li>
            </ul>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full text-center">
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </Layout>
  );
}
