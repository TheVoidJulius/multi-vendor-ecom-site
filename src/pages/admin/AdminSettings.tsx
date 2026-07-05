import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, CreditCard, ShieldCheck, Plus, Trash2, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AdminSettings() {
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Admin management state
  const [admins, setAdmins] = useState<{ user_id: string; email: string }[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState(true);

  useEffect(() => {
    fetchSettings();
    fetchAdmins();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", "upi_id")
      .single();
    if (data) setUpiId(data.value);
    setFetching(false);
  };

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (roles && roles.length > 0) {
      const userIds = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      setAdmins(
        roles.map((r) => {
          const profile = profiles?.find((p) => p.user_id === r.user_id);
          return {
            user_id: r.user_id,
            email: profile?.full_name || r.user_id.slice(0, 8) + "...",
          };
        })
      );
    }
    setLoadingAdmins(false);
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("store_settings")
      .update({ value: upiId, updated_at: new Date().toISOString() })
      .eq("key", "upi_id");
    if (error) {
      toast.error("Failed to save UPI ID");
    } else {
      toast.success("UPI ID saved successfully!");
    }
    setLoading(false);
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) return;
    setAddingAdmin(true);

    // Look up user by email in profiles (full_name or phone) — we need an edge function or lookup
    // For simplicity, we store the email in store_settings as a comma-separated list
    // and use an edge function approach. But the simplest: lookup profiles by matching.
    // Since we can't query auth.users, we'll store admin emails in store_settings.

    // Save to store_settings as admin_emails
    const { data: existing } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", "admin_emails")
      .single();

    const currentEmails = existing?.value ? existing.value.split(",").map((e: string) => e.trim()).filter(Boolean) : [];

    if (currentEmails.includes(newAdminEmail.trim().toLowerCase())) {
      toast.error("Email already added");
      setAddingAdmin(false);
      return;
    }

    currentEmails.push(newAdminEmail.trim().toLowerCase());
    const newValue = currentEmails.join(",");

    if (existing) {
      await supabase
        .from("store_settings")
        .update({ value: newValue, updated_at: new Date().toISOString() })
        .eq("key", "admin_emails");
    } else {
      await supabase
        .from("store_settings")
        .insert({ key: "admin_emails", value: newValue });
    }

    toast.success(`Admin email "${newAdminEmail}" added. They will get admin access when they sign up or next login.`);
    setNewAdminEmail("");
    setAddingAdmin(false);
    fetchAdminEmails();
  };

  const [adminEmails, setAdminEmails] = useState<string[]>([]);

  useEffect(() => {
    fetchAdminEmails();
  }, []);

  const fetchAdminEmails = async () => {
    const { data } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", "admin_emails")
      .single();
    if (data?.value) {
      setAdminEmails(data.value.split(",").map((e: string) => e.trim()).filter(Boolean));
    } else {
      setAdminEmails([]);
    }
  };

  const handleRemoveAdminEmail = async (email: string) => {
    const updated = adminEmails.filter((e) => e !== email);
    await supabase
      .from("store_settings")
      .update({ value: updated.join(","), updated_at: new Date().toISOString() })
      .eq("key", "admin_emails");
    toast.success(`Removed ${email}`);
    fetchAdminEmails();
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      toast.error(error.message || "Failed to change password");
    } else {
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-foreground">Store Settings</h1>

        {/* Password Change Section */}
        <div className="rounded-2xl bg-card border border-border p-6 max-w-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Lock className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
              <p className="text-sm text-muted-foreground">Update your admin account password</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <label className="text-sm font-medium text-foreground mb-1.5 block">New Password</label>
              <Input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-8 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm New Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <button
              onClick={handleChangePassword}
              disabled={changingPassword || !newPassword || !confirmPassword}
              className="btn-primary flex items-center gap-2"
            >
              {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {changingPassword ? "Changing..." : "Change Password"}
            </button>
          </div>
        </div>

        {/* UPI Payment Section */}
        <div className="rounded-2xl bg-card border border-border p-6 max-w-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-accent/10">
              <CreditCard className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">UPI Payment</h2>
              <p className="text-sm text-muted-foreground">Your UPI ID will be shown to customers at checkout</p>
            </div>
          </div>

          {fetching ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">UPI ID</label>
                <Input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@upi"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Example: yourname@paytm, yourname@ybl, yourname@oksbi
                </p>
              </div>

              {upiId && (
                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-2">Preview</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=upi://pay?pa=${encodeURIComponent(upiId)}`}
                      alt="UPI QR Code"
                      className="w-20 h-20 rounded-lg border border-border"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">Pay via UPI</p>
                      <p className="text-sm font-mono text-accent">{upiId}</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {loading ? "Saving..." : "Save UPI ID"}
              </button>
            </div>
          )}
        </div>

        {/* Admin Management Section */}
        <div className="rounded-2xl bg-card border border-border p-6 max-w-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Admin Access</h2>
              <p className="text-sm text-muted-foreground">
                Add email addresses that should have admin access. Users must sign up with these emails.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="admin@example.com"
                onKeyDown={(e) => e.key === "Enter" && handleAddAdmin()}
              />
              <button
                onClick={handleAddAdmin}
                disabled={addingAdmin || !newAdminEmail.trim()}
                className="btn-primary flex items-center gap-2 whitespace-nowrap"
              >
                {addingAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add
              </button>
            </div>

            {adminEmails.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Admin Emails</p>
                {adminEmails.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border"
                  >
                    <span className="text-sm text-foreground">{email}</span>
                    <button
                      onClick={() => handleRemoveAdminEmail(email)}
                      className="text-destructive hover:text-destructive/80 transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {adminEmails.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No additional admin emails added yet.
              </p>
            )}

            {/* Existing admins from user_roles */}
            {!loadingAdmins && admins.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Admins (from database)</p>
                {admins.map((a) => (
                  <div
                    key={a.user_id}
                    className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10"
                  >
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">{a.email}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}