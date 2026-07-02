import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Heart, User, Menu, X, ChevronRight, Shield, Store } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import velouraLogo from "@/assets/veloura-logo.png";
import SearchSuggestions from "@/components/search/SearchSuggestions";

export default function Header() {
  const { user, signOut } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: userRoles } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      return data?.map((r) => r.role) || [];
    },
    enabled: !!user,
  });

  const isAdmin = userRoles?.includes("admin");
  const isVendor = userRoles?.includes("vendor");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const navLinks = [
    { label: "New", href: "/products?filter=new" },
    { label: "Brands", href: "/brands" },
    { label: "Categories", href: "/categories" },
    { label: "Sale", href: "/products?filter=sale" },
    ...(user && !isAdmin && !isVendor
  ? [{ label: "Sell on Veloura", href: "/vendor/register" }]
  : []),

  ];

  return (
    <>
      <header className="sticky top-0 z-50 glass">
        <div className="container-premium">
          <div className="flex h-18 items-center justify-between py-3">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <img src={velouraLogo} alt="Veloura" className="h-9 w-auto transition-transform duration-300 group-hover:scale-105" />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-9">
              {navLinks.map((link) => (
                <Link key={link.href} to={link.href} className="nav-link uppercase text-[11px] tracking-[0.12em]">
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-300"
              >
                <Search className="h-[18px] w-[18px]" />
              </button>
              <Link to="/wishlist" className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-300">
                <Heart className="h-[18px] w-[18px]" />
              </Link>
              <Link to="/cart" className="relative p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-300">
                <ShoppingBag className="h-[18px] w-[18px]" />
                {itemCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[9px] font-bold text-gold-foreground">
                    {itemCount}
                  </span>
                )}
              </Link>
              {user ? (
                <div className="hidden md:flex items-center gap-1 ml-2">
                  {isAdmin && (
                    <Link to="/admin" className="flex items-center gap-1 text-[11px] font-medium text-gold hover:text-gold/80 transition-colors px-3 py-1.5 rounded-full hover:bg-gold/10 tracking-wide">
                      <Shield className="h-3.5 w-3.5" />
                      Admin
                    </Link>
                  )}
                  {isVendor && (
                    <Link to="/vendor" className="flex items-center gap-1 text-[11px] font-medium text-accent hover:text-accent/80 transition-colors px-3 py-1.5 rounded-full hover:bg-accent/10 tracking-wide">
                      <Store className="h-3.5 w-3.5" />
                      Vendor
                    </Link>
                  )}
                  <Link to="/account" className="p-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-300">
                    <User className="h-[18px] w-[18px]" />
                  </Link>
                  <button onClick={() => signOut()} className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-secondary/60 tracking-wide">
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link to="/auth" className="hidden md:inline-flex ml-3 btn-gold text-[11px] px-5 py-2">
                  Sign In
                </Link>
              )}
              <button onClick={() => setMobileOpen(true)} className="p-2.5 rounded-full md:hidden text-muted-foreground hover:bg-secondary/60 transition-all">
                <Menu className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-3xl animate-fade-in" onClick={() => setSearchOpen(false)}>
          <div className="container-premium pt-28" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands, categories..."
                className="w-full rounded-2xl border border-border/60 bg-card py-5 pl-16 pr-14 text-lg text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold/30 shadow-xl transition-all duration-300"
              />
              <button type="button" onClick={() => setSearchOpen(false)} className="absolute right-5 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-all">
                <X className="h-5 w-5" />
              </button>
              <SearchSuggestions query={searchQuery} onSelect={() => { setSearchOpen(false); setSearchQuery(""); }} />
            </form>
            <p className="text-center text-sm text-muted-foreground mt-8 tracking-wide">Press Enter to search</p>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] bg-background animate-fade-in md:hidden">
          <div className="container-premium pt-5">
            <div className="flex items-center justify-between mb-14">
              <Link to="/" onClick={() => setMobileOpen(false)}>
                <img src={velouraLogo} alt="Veloura" className="h-8 w-auto" />
              </Link>
              <button onClick={() => setMobileOpen(false)} className="p-2.5 rounded-full text-muted-foreground hover:bg-secondary/60">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {navLinks.map((link, i) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="flex items-center justify-between py-5 text-2xl font-light text-foreground border-b border-border/40 animate-fade-in-up opacity-0 font-serif"
                  style={{ animationDelay: `${i * 0.06}s` }}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                  <ChevronRight className="h-5 w-5 text-gold" />
                </Link>
              ))}
              <div className="mt-10 space-y-3 animate-fade-in-up opacity-0" style={{ animationDelay: "0.3s" }}>
                {user ? (
                  <>
                    {isAdmin && (
                      <Link to="/admin" className="flex items-center gap-2 text-base text-gold hover:text-gold/80 py-2 tracking-wide" onClick={() => setMobileOpen(false)}>
                        <Shield className="h-4 w-4" /> Admin Panel
                      </Link>
                    )}
                    {isVendor && (
                      <Link to="/vendor" className="flex items-center gap-2 text-base text-accent hover:text-accent/80 py-2 tracking-wide" onClick={() => setMobileOpen(false)}>
                        <Store className="h-4 w-4" /> Vendor Dashboard
                      </Link>
                    )}
                    <Link to="/account" className="block text-base text-muted-foreground hover:text-foreground py-2 tracking-wide" onClick={() => setMobileOpen(false)}>Account</Link>
                    <Link to="/orders" className="block text-base text-muted-foreground hover:text-foreground py-2 tracking-wide" onClick={() => setMobileOpen(false)}>Orders</Link>
                    <Link to="/wishlist" className="block text-base text-muted-foreground hover:text-foreground py-2 tracking-wide" onClick={() => setMobileOpen(false)}>Wishlist</Link>
                    <button onClick={() => { signOut(); setMobileOpen(false); }} className="block text-base text-muted-foreground hover:text-foreground py-2 text-left tracking-wide">Sign Out</button>
                  </>
                ) : (
                  <Link to="/auth" className="btn-gold w-full text-center" onClick={() => setMobileOpen(false)}>Sign In</Link>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
