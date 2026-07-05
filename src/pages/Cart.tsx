import { Link } from "react-router-dom";
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag, ChevronRight } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/utils";

export default function Cart() {
  const { user } = useAuth();
  const { items, total, removeItem, updateQuantity, isLoading } = useCart();

  if (!user) {
    return (
      <Layout>
        <div className="container-premium py-24 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary mb-6">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-title text-foreground mb-2">Your Cart</h1>
          <p className="text-muted-foreground mb-8 text-sm">Sign in to view your cart.</p>
          <Link to="/auth" className="btn-primary">Sign In</Link>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container-premium py-16">
          <div className="h-10 w-48 skeleton mb-8" />
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="flex gap-4 p-5 rounded-2xl">
                <div className="w-24 h-24 skeleton rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 skeleton" />
                  <div className="h-3 w-1/4 skeleton" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container-premium py-24 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary mb-6">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-title text-foreground mb-2">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-8 text-sm">Discover something you love.</p>
          <Link to="/products" className="btn-primary">Continue Shopping</Link>
        </div>
      </Layout>
    );
  }

  const shipping = total >= 999 ? 0 : 99;
  const tax = total * 0.18;
  const grandTotal = total + shipping + tax;

  return (
    <Layout>
      <div className="container-premium py-10 md:py-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">Cart</span>
        </nav>

        <h1 className="text-headline text-foreground mb-2">Shopping Cart</h1>
        <p className="text-sm text-muted-foreground mb-10">{items.length} item{items.length !== 1 ? 's' : ''}</p>

        <div className="grid lg:grid-cols-3 gap-10 lg:gap-12">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item, i) => (
              <div
                key={item.id}
                className="flex gap-5 p-4 rounded-2xl bg-card border border-border/50 transition-all duration-300 hover:shadow-md animate-fade-in-up opacity-0"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <Link to={`/products/${item.products?.slug}`} className="w-24 h-24 rounded-xl overflow-hidden bg-secondary/50 shrink-0">
                  <img src={item.products?.images?.[0] || "/placeholder.svg"} alt="" className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.products?.slug}`} className="text-sm font-semibold text-foreground line-clamp-1 hover:text-accent transition-colors">
                    {item.products?.name}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatPrice(item.products?.price ?? 0)}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-2 border border-border rounded-full px-2.5 py-1.5">
                      <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="hover:text-foreground text-muted-foreground transition-colors">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-semibold w-5 text-center text-foreground">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="hover:text-foreground text-muted-foreground transition-colors">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.product_id)} className="text-muted-foreground hover:text-destructive transition-all duration-200 hover:scale-110">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="text-sm font-bold text-foreground whitespace-nowrap">
                  {formatPrice((item.products?.price ?? 0) * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl bg-card border border-border/50 p-6 sticky top-20 shadow-sm">
              <h2 className="text-lg font-bold text-foreground mb-5">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="text-foreground font-medium">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="text-foreground font-medium">{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (GST 18%)</span>
                  <span className="text-foreground font-medium">{formatPrice(tax)}</span>
                </div>
                <hr className="border-border/50" />
                <div className="flex justify-between font-bold text-foreground text-base">
                  <span>Total</span>
                  <span>{formatPrice(grandTotal)}</span>
                </div>
              </div>
              {total < 999 && (
                <div className="mt-4 rounded-xl bg-accent/5 border border-accent/10 p-3">
                  <p className="text-xs text-accent font-medium">
                    Add {formatPrice(999 - total)} more for free shipping
                  </p>
                </div>
              )}
              <Link to="/checkout" className="btn-primary w-full mt-6 text-center group">
                Proceed to Checkout
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/products" className="block text-center text-xs text-muted-foreground hover:text-foreground mt-4 transition-colors">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
