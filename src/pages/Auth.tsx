import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isValidPhone } from "@/lib/utils";
import { Mail, CheckCircle } from "lucide-react";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
        toast.success("Welcome back!");
        navigate("/");
      } else if (mode === "signup") {
        if (!fullName.trim() || fullName.trim().length < 2) {
          toast.error("Enter your full name"); setLoading(false); return;
        }
        if (phone && !isValidPhone(phone)) {
          toast.error("Enter a valid 10-digit mobile number"); setLoading(false); return;
        }
        if (password.length < 6) {
          toast.error("Password must be at least 6 characters"); setLoading(false); return;
        }
        await signUp(email, password, fullName);
        // Update profile with phone if provided
        if (phone) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from("profiles").update({ phone }).eq("user_id", user.id);
          }
        }
        toast.success("Account created! Welcome to Veloura.");         navigate("/");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset link sent! Check your email.");
        setMode("login");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (signupSuccess) {
    return (
      <Layout>
        <div className="container-premium py-20 flex items-center justify-center">
          <div className="w-full max-w-md text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-6">
              <Mail className="h-10 w-10 text-success" />
            </div>
            <h1 className="text-headline text-foreground mb-3">Verify Your Email</h1>
            <p className="text-body-large mb-2">We've sent a verification link to:</p>
            <p className="text-lg font-semibold text-accent mb-6">{email}</p>
            <div className="rounded-2xl bg-card border border-border p-6 text-left space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">Open the email and click the verification link</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">After verifying, come back and sign in</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-muted mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">Check your spam folder if you don't see it</p>
              </div>
            </div>
            <button
              onClick={() => { setSignupSuccess(false); setMode("login"); }}
              className="btn-primary mt-8"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-premium py-20 flex items-center justify-center">
        <div className="w-full max-w-md">
          <h1 className="text-headline text-foreground text-center mb-2">
            {mode === "login" ? "Welcome Back" : mode === "signup" ? "Create Account" : "Reset Password"}
          </h1>
          <p className="text-body-large text-center mb-10">
            {mode === "login"
              ? "Sign in to your Veloura account."
              : mode === "signup"
              ? "Join Veloura for a premium shopping experience."
              : "Enter your email and we'll send a reset link."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-premium"
                    placeholder="Rahul Sharma"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Mobile Number</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-border bg-muted text-sm text-muted-foreground">+91</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="input-premium rounded-l-none"
                      placeholder="9876543210"
                      maxLength={10}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Optional — for order updates</p>
                </div>
              </>
            )}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-premium"
                placeholder="you@example.com"
                required
              />
            </div>
            {mode !== "forgot" && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Password *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-premium"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                {mode === "signup" && <p className="text-xs text-muted-foreground mt-1">Minimum 6 characters</p>}
              </div>
            )}
            {mode === "login" && (
              <div className="text-right">
                <button type="button" onClick={() => setMode("forgot")} className="text-xs text-gold hover:underline">
                  Forgot password?
                </button>
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-gold w-full text-center">
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Sign In"
                : mode === "signup"
                ? "Create Account"
                : "Send Reset Link"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button onClick={() => setMode("signup")} className="text-gold font-medium hover:underline">Sign Up</button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button onClick={() => setMode("login")} className="text-gold font-medium hover:underline">Sign In</button>
              </>
            )}
          </p>
        </div>
      </div>
    </Layout>
  );
}
