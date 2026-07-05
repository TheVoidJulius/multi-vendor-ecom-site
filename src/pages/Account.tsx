import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { User, Package, Heart, MapPin, LogOut, ChevronRight, Shield, Edit3, Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Account() {
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated!");
      setEditing(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const startEditing = () => {
    setFullName(profile?.full_name || "");
    setPhone(profile?.phone || "");
    setEditing(true);
  };

  if (!user) {
    return (
      <Layout>
        <div className="container-premium py-24 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary mb-6">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-title text-foreground mb-2">My Account</h1>
          <p className="text-muted-foreground mb-8 text-sm">Sign in to manage your account.</p>
          <Link to="/auth" className="btn-primary">Sign In</Link>
        </div>
      </Layout>
    );
  }

  const menuItems = [
    { icon: Package, label: "Order History", href: "/orders", desc: "Track and view past orders" },
    { icon: Heart, label: "Wishlist", href: "/wishlist", desc: "Your saved items" },
  ];

  return (
    <Layout>
      <div className="container-premium py-10 md:py-16 max-w-2xl">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">Account</span>
        </nav>

        {/* Profile header */}
        <div className="rounded-2xl border border-border bg-card p-6 mb-6 animate-fade-in">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold/80 to-gold/40 flex items-center justify-center text-gold-foreground text-xl font-bold">
                {(profile?.full_name || user.email || "?")[0].toUpperCase()}
              </div>
              <div>
                {!editing ? (
                  <>
                    <h1 className="text-title text-foreground">{profile?.full_name || "Your Name"}</h1>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {profile?.phone && <p className="text-xs text-muted-foreground mt-0.5">{profile.phone}</p>}
                  </>
                ) : (
                  <div className="space-y-2">
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input-premium text-sm py-2"
                      placeholder="Full Name"
                    />
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-premium text-sm py-2"
                      placeholder="Phone number"
                    />
                  </div>
                )}
              </div>
            </div>
            {!editing ? (
              <button onClick={startEditing} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                <Edit3 className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex gap-1">
                <button onClick={() => updateProfile.mutate()} className="p-2 rounded-lg hover:bg-success/10 text-success transition-colors">
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={() => setEditing(false)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Member since {new Date(user.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Menu */}
        <div className="space-y-2">
          {menuItems.map((item, i) => (
            <Link
              key={item.label}
              to={item.href}
              className="flex items-center gap-4 p-5 rounded-2xl border border-border/50 bg-card hover:bg-secondary/30 hover:border-border transition-all duration-300 group animate-fade-in-up opacity-0"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/80 group-hover:bg-accent/10 transition-colors">
                <item.icon className="h-4.5 w-4.5 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-all group-hover:translate-x-0.5" />
            </Link>
          ))}
          <button
            onClick={() => signOut()}
            className="flex items-center gap-4 p-5 rounded-2xl border border-border/50 bg-card hover:bg-destructive/5 hover:border-destructive/20 transition-all duration-300 w-full text-left group animate-fade-in-up opacity-0"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/80 group-hover:bg-destructive/10 transition-colors">
              <LogOut className="h-4.5 w-4.5 text-muted-foreground group-hover:text-destructive transition-colors" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground group-hover:text-destructive transition-colors">Sign Out</p>
              <p className="text-xs text-muted-foreground">Log out of your account</p>
            </div>
          </button>
        </div>
      </div>
    </Layout>
  );
}
