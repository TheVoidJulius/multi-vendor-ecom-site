import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import velouraLogo from "@/assets/veloura-logo.png";

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-secondary/20">
      <div className="container-premium section-padding">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-4">
            <Link to="/" className="inline-block mb-5">
              <img src={velouraLogo} alt="Veloura" className="h-9 w-auto" />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Your destination for premium brands and curated collections from trusted vendors. Discover the extraordinary.
            </p>
            <div className="mt-6">
              <Link to="/products" className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-gold-dark transition-colors tracking-wide">
                Shop Now <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground mb-6">Shop</h4>
            <ul className="space-y-3.5">
              <li><Link to="/products?filter=new" className="text-sm text-muted-foreground hover:text-foreground transition-colors">New Arrivals</Link></li>
              <li><Link to="/brands" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Brands</Link></li>
              <li><Link to="/categories" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Categories</Link></li>
              <li><Link to="/products?filter=sale" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sale</Link></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground mb-6">Support</h4>
            <ul className="space-y-3.5">
              <li><Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact Us</Link></li>
              <li><Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
              <li><Link to="/orders" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Track Order</Link></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground mb-6">Sellers</h4>
            <ul className="space-y-3.5">
              <li><Link to="/vendor/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sell on Veloura</Link></li>
              <li><span className="text-sm text-muted-foreground">Vendor Portal</span></li>
            </ul>
          </div>

          <div className="md:col-span-2" />
        </div>

        <div className="mt-20 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-muted-foreground tracking-wide">
            © {new Date().getFullYear()} Veloura. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[11px] text-muted-foreground tracking-wide">Premium Multi-Vendor Marketplace</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
