import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { formatPrice, isValidPhone, isValidPincode } from "@/lib/utils";
import { CheckCircle, ArrowRight, ArrowLeft, Copy, Tag, X, AlertCircle } from "lucide-react";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Lakshadweep", "Puducherry",
];

export default function Checkout() {
  const { user } = useAuth();
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [step, setStep] = useState<"address" | "payment" | "confirm">("address");
  const [upiRef, setUpiRef] = useState("");
  const [paymentDone, setPaymentDone] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Vendor payment info
  const [vendorPaymentInfo, setVendorPaymentInfo] = useState<{
    upiId: string;
    qrCodeUrl: string | null;
    storeName: string;
  } | null>(null);
  const [storeUpiId, setStoreUpiId] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "IN",
    phone: "",
    email: user?.email || "",
  });

  useEffect(() => {
    if (user?.email) setForm(f => ({ ...f, email: user.email! }));
  }, [user]);

  // Fetch vendor payment info or store-level UPI
  useEffect(() => {
    const fetchPaymentInfo = async () => {
      // Check if any cart item has a vendor
      const vendorIds = [...new Set(items.map(i => (i.products as any)?.vendor_id).filter(Boolean))];
      
      if (vendorIds.length === 1) {
        // Single vendor order — use vendor's UPI
        const { data: vendor } = await supabase
          .from("vendors" as any)
          .select("upi_id, qr_code_url, store_name")
          .eq("id", vendorIds[0])
          .single();
        
        if (vendor && (vendor as any).upi_id) {
          setVendorPaymentInfo({
            upiId: (vendor as any).upi_id,
            qrCodeUrl: (vendor as any).qr_code_url,
            storeName: (vendor as any).store_name,
          });
          return;
        }
      }
      
      // Fallback to store-level UPI
      const { data } = await supabase.from("store_settings").select("value").eq("key", "upi_id").single();
      if (data) setStoreUpiId(data.value);
    };
    if (items.length > 0) fetchPaymentInfo();
  }, [items]);

  const activeUpiId = vendorPaymentInfo?.upiId || storeUpiId;
  const activeQrUrl = vendorPaymentInfo?.qrCodeUrl || null;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.trim().toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !data) { toast.error("Invalid coupon code"); return; }
      if (data.expires_at && new Date(data.expires_at) < new Date()) { toast.error("This coupon has expired"); return; }
      if (data.max_uses && (data.used_count ?? 0) >= data.max_uses) { toast.error("Coupon usage limit reached"); return; }
      if (data.min_order_amount && total < Number(data.min_order_amount)) {
        toast.error(`Minimum order amount is ${formatPrice(Number(data.min_order_amount))}`);
        return;
      }
      setAppliedCoupon(data);
      toast.success(`Coupon "${data.code}" applied!`);
    } catch { toast.error("Failed to apply coupon"); }
    finally { setCouponLoading(false); }
  };

  const removeCoupon = () => { setAppliedCoupon(null); setCouponCode(""); };

  const discount = appliedCoupon
    ? appliedCoupon.discount_type === "percentage"
      ? total * (Number(appliedCoupon.discount_value) / 100)
      : Number(appliedCoupon.discount_value)
    : 0;

  const discountedTotal = Math.max(0, total - discount);
  const shipping = discountedTotal >= 999 ? 0 : 99;
  const tax = Math.round(discountedTotal * 0.18 * 100) / 100;
  const grandTotal = Math.round((discountedTotal + shipping + tax) * 100) / 100;

  const validateAddress = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 3) e.fullName = "Enter full name (min 3 chars)";
    if (!form.addressLine1.trim() || form.addressLine1.trim().length < 10) e.addressLine1 = "Enter complete address (min 10 chars)";
    if (!form.city.trim() || form.city.trim().length < 2) e.city = "Enter a valid city";
    if (!form.state) e.state = "Select your state";
    if (!isValidPincode(form.postalCode)) e.postalCode = "Enter valid 6-digit pincode";
    if (!isValidPhone(form.phone)) e.phone = "Enter valid 10-digit mobile number";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter valid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAddress()) setStep("payment");
  };

  const handlePaymentConfirm = () => {
    if (!upiRef.trim() || upiRef.trim().length < 6) {
      toast.error("Enter a valid UPI transaction reference (min 6 characters)");
      return;
    }
    setPaymentDone(true);
    setStep("confirm");
    toast.success("Payment reference recorded! Review and place your order.");
  };

  const handlePlaceOrder = async () => {
    if (!user || items.length === 0 || !paymentDone) return;
    setLoading(true);

    try {
      const orderNum = `VLR-${Date.now().toString(36).toUpperCase()}`;
      const shippingAddress = {
        full_name: form.fullName.trim(),
        address_line_1: form.addressLine1.trim(),
        address_line_2: form.addressLine2.trim(),
        city: form.city.trim(),
        state: form.state,
        postal_code: form.postalCode.trim(),
        country: form.country,
        phone: form.phone.trim(),
        email: form.email.trim(),
      };

      const noteParts = [`UPI Ref: ${upiRef.trim()}`];
      if (vendorPaymentInfo) noteParts.push(`Paid to: ${vendorPaymentInfo.storeName} (${vendorPaymentInfo.upiId})`);
      if (appliedCoupon) noteParts.push(`Coupon: ${appliedCoupon.code} (-${formatPrice(discount)})`);

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          order_number: orderNum,
          subtotal: total,
          shipping_cost: shipping,
          tax,
          total: grandTotal,
          shipping_address: shippingAddress,
          notes: noteParts.join(" | "),
        })
        .select()
        .single();

      if (orderError) throw orderError;

      if (appliedCoupon) {
        await supabase.from("coupons").update({ used_count: (appliedCoupon.used_count ?? 0) + 1 }).eq("id", appliedCoupon.id);
      }

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.products?.name || "",
        product_image: item.products?.images?.[0] || null,
        price: item.products?.price || 0,
        quantity: item.quantity,
      }));

      const { data: insertedItems, error: itemsError } = await supabase.from("order_items").insert(orderItems).select();
      if (itemsError) throw itemsError;

      for (const item of items) {
        if (!(item.products as any)?.vendor_id) continue;
        const vendorId = (item.products as any).vendor_id;
        const { data: vendorData } = await supabase.from("vendors" as any).select("commission_rate").eq("id", vendorId).single();
        const commissionRate = (vendorData as any)?.commission_rate ?? 10;
        const itemTotal = (item.products?.price || 0) * item.quantity;
        const commission = itemTotal * (commissionRate / 100);
        const netAmount = itemTotal - commission;
        const orderItemId = insertedItems?.find((oi: any) => oi.product_id === item.product_id)?.id;
        await supabase.from("vendor_earnings" as any).insert({
          vendor_id: vendorId, order_id: order.id, order_item_id: orderItemId || null,
          amount: itemTotal, commission, net_amount: netAmount, status: "pending",
        } as any);
      }

      // Decrease stock
      for (const item of items) {
        const currentStock = (item.products as any)?.stock_quantity ?? 0;
        if (currentStock > 0) {
          await supabase.from("products").update({ stock_quantity: Math.max(0, currentStock - item.quantity) }).eq("id", item.product_id);
        }
      }

      await clearCart();
      setOrderNumber(orderNum);
      setOrderPlaced(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  const copyUpi = () => { navigator.clipboard.writeText(activeUpiId); toast.success("UPI ID copied!"); };

  if (orderPlaced) {
    return (
      <Layout>
        <div className="container-premium py-20 text-center">
          <CheckCircle className="h-20 w-20 text-warning mx-auto mb-6" />
          <h1 className="text-headline text-foreground mb-2">Order Submitted!</h1>
          <p className="text-body-large mb-2">Your order is pending payment verification.</p>
          <p className="text-sm text-muted-foreground mb-4">Order number: <span className="font-mono text-foreground">{orderNumber}</span></p>
          <div className="rounded-2xl bg-warning/5 border border-warning/20 p-5 max-w-md mx-auto mb-8">
            <p className="text-sm text-foreground font-medium mb-1">⏳ What happens next?</p>
            <p className="text-sm text-muted-foreground">Our team will verify your UPI payment. Once confirmed, your order status will be updated to <strong className="text-success">confirmed</strong> and processing will begin.</p>
          </div>
          <button onClick={() => navigate("/orders")} className="btn-primary">View Orders</button>
        </div>
      </Layout>
    );
  }

  if (!user) { navigate("/auth"); return null; }

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? (
      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
        <AlertCircle className="h-3 w-3" /> {errors[field]}
      </p>
    ) : null;

  return (
    <Layout>
      <div className="container-premium py-10">
        <h1 className="text-headline text-foreground mb-2">Checkout</h1>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          {["address", "payment", "confirm"].map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              {i > 0 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
              <span className={`text-sm font-medium px-3 py-1 rounded-full capitalize ${
                step === s ? "bg-accent text-accent-foreground" :
                (s === "address" && step !== "address") || (s === "payment" && step === "confirm")
                  ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
              }`}>
                {i + 1}. {s === "confirm" ? "Review & Place" : s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {/* STEP 1: Address */}
            {step === "address" && (
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <h2 className="text-title text-foreground mb-4">Shipping Address</h2>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name *</label>
                  <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="input-premium" placeholder="e.g. Rahul Sharma" />
                  <FieldError field="fullName" />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-premium" placeholder="you@example.com" />
                  <FieldError field="email" />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Mobile Number *</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-border bg-muted text-sm text-muted-foreground">+91</span>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} className="input-premium rounded-l-none" placeholder="9876543210" maxLength={10} />
                  </div>
                  <FieldError field="phone" />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Address Line 1 *</label>
                  <input value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} className="input-premium" placeholder="House/Flat No., Street, Area" />
                  <FieldError field="addressLine1" />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Address Line 2</label>
                  <input value={form.addressLine2} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} className="input-premium" placeholder="Landmark (optional)" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">City *</label>
                    <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-premium" placeholder="e.g. Mumbai" />
                    <FieldError field="city" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">State *</label>
                    <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="input-premium">
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <FieldError field="state" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Pincode *</label>
                    <input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value.replace(/\D/g, "").slice(0, 6) })} className="input-premium" placeholder="400001" maxLength={6} />
                    <FieldError field="postalCode" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Country</label>
                    <input value="India" disabled className="input-premium opacity-60" />
                  </div>
                </div>

                <button type="submit" className="btn-primary flex items-center gap-2 mt-4">
                  Continue to Payment <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}

            {/* STEP 2: Payment */}
            {step === "payment" && (
              <div className="space-y-6">
                <button onClick={() => setStep("address")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-4 w-4" /> Back to address
                </button>

                <h2 className="text-title text-foreground">Pay via UPI</h2>
                
                {vendorPaymentInfo && (
                  <div className="rounded-xl bg-accent/5 border border-accent/20 p-3">
                    <p className="text-sm text-foreground">
                      💳 Paying to vendor: <strong>{vendorPaymentInfo.storeName}</strong>
                    </p>
                  </div>
                )}

                <p className="text-sm text-muted-foreground">Complete your payment first, then enter the transaction reference to proceed.</p>

                {activeUpiId ? (
                  <div className="rounded-2xl bg-card border border-border p-6 space-y-5">
                    <p className="text-sm text-muted-foreground">
                      Scan the QR code or use the UPI ID below to pay <strong className="text-foreground">{formatPrice(grandTotal)}</strong>
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      {activeQrUrl ? (
                        <img
                          src={activeQrUrl}
                          alt="Vendor UPI QR Code"
                          className="w-48 h-48 rounded-xl border border-border object-contain bg-white p-2"
                        />
                      ) : (
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${encodeURIComponent(activeUpiId)}&am=${grandTotal.toFixed(2)}&cu=INR`}
                          alt="UPI QR Code"
                          className="w-48 h-48 rounded-xl border border-border"
                        />
                      )}
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">UPI ID</p>
                          <div className="flex items-center gap-2">
                            <code className="text-lg font-mono text-accent bg-muted px-3 py-1.5 rounded-lg">{activeUpiId}</code>
                            <button onClick={copyUpi} className="p-2 hover:bg-muted rounded-lg transition-colors" title="Copy UPI ID">
                              <Copy className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Amount</p>
                          <p className="text-2xl font-bold text-foreground">{formatPrice(grandTotal)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 space-y-3">
                      <p className="text-sm font-medium text-foreground">After completing payment:</p>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                          UPI Transaction Reference / UTR Number *
                        </label>
                        <input
                          value={upiRef}
                          onChange={(e) => setUpiRef(e.target.value)}
                          className="input-premium"
                          placeholder="Enter your UPI transaction reference"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Find this in your UPI app under transaction details (usually 12 digits).
                        </p>
                      </div>
                      <button
                        onClick={handlePaymentConfirm}
                        disabled={!upiRef.trim()}
                        className="btn-primary w-full text-center"
                      >
                        I've Completed Payment
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-6 text-center">
                    <p className="text-sm text-destructive font-medium">Payment not configured. Please contact support.</p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Confirm */}
            {step === "confirm" && (
              <div className="space-y-6">
                <button onClick={() => { setStep("payment"); setPaymentDone(false); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-4 w-4" /> Back to payment
                </button>

                <h2 className="text-title text-foreground">Review & Place Order</h2>

                <div className="rounded-2xl bg-card border border-border divide-y divide-border">
                  <div className="p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Shipping To</h3>
                    <p className="text-sm text-foreground font-medium">{form.fullName}</p>
                    <p className="text-sm text-muted-foreground">{form.addressLine1}</p>
                    {form.addressLine2 && <p className="text-sm text-muted-foreground">{form.addressLine2}</p>}
                    <p className="text-sm text-muted-foreground">{form.city}, {form.state} {form.postalCode}</p>
                    <p className="text-sm text-muted-foreground">📞 +91 {form.phone}</p>
                  </div>
                  <div className="p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Payment</h3>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm text-foreground">UPI Reference: <span className="font-mono font-bold">{upiRef}</span></span>
                    </div>
                    {vendorPaymentInfo && (
                      <p className="text-xs text-muted-foreground mt-1">Paid to: {vendorPaymentInfo.storeName}</p>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Items ({items.length})</h3>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          {item.products?.images?.[0] && (
                            <img src={item.products.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground line-clamp-1">{item.products?.name}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            {formatPrice((item.products?.price || 0) * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="btn-gold w-full text-center text-lg py-4"
                >
                  {loading ? "Placing Order..." : `Place Order — ${formatPrice(grandTotal)}`}
                </button>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 space-y-5">
              <h3 className="text-sm font-bold text-foreground">Order Summary</h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden shrink-0">
                      {item.products?.images?.[0] && (
                        <img src={item.products.images[0]} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground line-clamp-1">{item.products?.name}</p>
                      <p className="text-xs text-muted-foreground">× {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {formatPrice((item.products?.price || 0) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              {step !== "confirm" && (
                <div className="pt-4 border-t border-border">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-success/5 border border-success/20 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium text-success">{appliedCoupon.code}</span>
                        <span className="text-xs text-success">-{formatPrice(discount)}</span>
                      </div>
                      <button onClick={removeCoupon} className="p-1 text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="input-premium text-xs py-2 flex-1" placeholder="Coupon code" />
                      <button onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()} className="btn-secondary text-xs py-2 px-4 whitespace-nowrap">
                        {couponLoading ? "..." : "Apply"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="text-sm space-y-2.5 pt-4 border-t border-border">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="text-foreground">{formatPrice(total)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="text-foreground">{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (GST 18%)</span>
                  <span className="text-foreground">{formatPrice(tax)}</span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between text-foreground font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {shipping > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Free shipping on orders above ₹999
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
