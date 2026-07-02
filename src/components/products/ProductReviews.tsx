import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Star, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  productId: string;
}

export default function ProductReviews({ productId }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Check if user already reviewed
  const { data: userReview } = useQuery({
    queryKey: ["user-review", productId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("reviews").insert({
        product_id: productId,
        user_id: user!.id,
        rating,
        title: title.trim() || null,
        content: content.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
      qc.invalidateQueries({ queryKey: ["user-review", productId] });
      toast.success("Review submitted! It will appear after approval.");
      setShowForm(false);
      setTitle("");
      setContent("");
      setRating(5);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const approvedReviews = reviews.filter((r: any) => r.is_approved);

  return (
    <section className="mt-20">
      <div className="flex items-end justify-between mb-8">
        <h2 className="text-title text-foreground">Reviews ({approvedReviews.length})</h2>
        {user && !userReview && (
          <button onClick={() => setShowForm(!showForm)} className="btn-secondary text-sm">
            Write a Review
          </button>
        )}
      </div>

      {/* Review form */}
      {showForm && (
        <div className="rounded-2xl border border-border bg-card p-6 mb-8 animate-fade-in">
          <h3 className="text-sm font-semibold text-foreground mb-4">Your Review</h3>

          {/* Star rating */}
          <div className="flex items-center gap-1 mb-4">
            <span className="text-xs text-muted-foreground mr-2">Rating:</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "h-6 w-6",
                    star <= (hoverRating || rating)
                      ? "fill-warning text-warning"
                      : "fill-muted text-muted"
                  )}
                />
              </button>
            ))}
            <span className="text-sm text-foreground ml-2 font-medium">{rating}/5</span>
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-premium mb-3"
            placeholder="Review title (optional)"
            maxLength={100}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="input-premium min-h-[100px] resize-none mb-4"
            placeholder="Share your experience with this product..."
            maxLength={1000}
          />
          <div className="flex gap-2">
            <button
              onClick={() => submitReview.mutate()}
              disabled={submitReview.isPending}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              {submitReview.isPending ? "Submitting..." : "Submit Review"}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {userReview && !userReview.is_approved && (
        <div className="rounded-xl bg-warning/5 border border-warning/20 p-4 mb-6">
          <p className="text-sm text-warning font-medium">Your review is pending approval</p>
        </div>
      )}

      {/* Reviews list */}
      {approvedReviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvedReviews.map((review: any) => (
            <div key={review.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-3.5 w-3.5",
                        star <= review.rating ? "fill-warning text-warning" : "fill-muted text-muted"
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                </span>
                {review.is_verified_purchase && (
                  <span className="text-[10px] font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">Verified Purchase</span>
                )}
              </div>
              {review.title && <p className="text-sm font-semibold text-foreground mb-1">{review.title}</p>}
              {review.content && <p className="text-sm text-muted-foreground leading-relaxed">{review.content}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
