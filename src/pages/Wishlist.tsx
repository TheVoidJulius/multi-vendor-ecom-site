import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import ProductCard from "@/components/products/ProductCard";

export default function Wishlist() {
  const { user } = useAuth();
  const { items, isLoading } = useWishlist();

  if (!user) {
    return (
      <Layout>
        <div className="container-premium py-20 text-center">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-title text-foreground mb-2">Your Wishlist</h1>
          <p className="text-muted-foreground mb-6">Sign in to save your favorites.</p>
          <Link to="/auth" className="btn-primary">Sign In</Link>
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container-premium py-20 text-center">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-title text-foreground mb-2">Your Wishlist is Empty</h1>
          <p className="text-muted-foreground mb-6">Save items you love for later.</p>
          <Link to="/products" className="btn-primary">Browse Products</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-premium py-10">
        <h1 className="text-headline text-foreground mb-2">Wishlist</h1>
        <p className="text-muted-foreground mb-8">{items.length} saved items</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {items.map((item) => item.products && (
            <ProductCard key={item.id} product={item.products} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
