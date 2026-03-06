"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare, BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RatingStars } from "@/components/products/RatingStars";
import { ReviewForm } from "@/components/products/ReviewForm";
import {
  getProductReviewsAPI,
  checkReviewEligibilityAPI,
  deleteReviewAPI,
} from "@/services/review-service";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import logger from "@/lib/logger";
import type { Review, ReviewsResponse, ReviewEligibility, RatingDistributionItem } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ReviewSectionProps {
  productId: string;
  averageRating: number;
  reviewCount: number;
}

// ─── Rating Distribution Bar ─────────────────────────────────────────────────

function RatingDistribution({
  distribution,
  total,
}: {
  distribution: RatingDistributionItem[];
  total: number;
}) {
  return (
    <div className="space-y-1.5">
      {distribution.map((item) => (
        <div key={item.rating} className="flex items-center gap-2 text-sm">
          <span className="w-6 text-right text-muted-foreground">{item.rating}</span>
          <RatingStars rating={item.rating} size="sm" />
          <Progress
            value={total > 0 ? (item.count / total) * 100 : 0}
            className="flex-1 h-2"
          />
          <span className="w-8 text-right text-muted-foreground text-xs">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Single Review Card ──────────────────────────────────────────────────────

function ReviewCard({
  review,
  currentUserId,
  onDelete,
  onEdit,
}: {
  review: Review;
  currentUserId: string | null;
  onDelete: (id: string) => void;
  onEdit: () => void;
}) {
  const { t } = useTranslation("reviews");
  const isOwner = currentUserId && review.user.id === currentUserId;
  const avatarUrl = review.user.avatar
    ? `${BASE_URL}${review.user.avatar}`
    : null;

  return (
    <article className="py-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted overflow-hidden flex items-center justify-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-muted-foreground">
              {review.user.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{review.user.name}</span>
            {review.isVerified && (
              <Badge variant="secondary" className="text-xs gap-1">
                <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                {t("verifiedPurchase")}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </div>

          <RatingStars rating={review.rating} size="sm" className="mt-1" />

          <h4 className="font-medium text-sm mt-2">{review.title}</h4>
          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
            {review.comment}
          </p>

          {isOwner && (
            <div className="flex gap-2 mt-2">
              <ReviewForm
                productId={review.product}
                existingReview={review}
                onSuccess={onEdit}
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(review.id)}
              >
                {t("deleteReview")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function ReviewSectionSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-40" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-4 w-32" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-3 w-full" />
          ))}
        </div>
        <div className="md:col-span-2 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Section ────────────────────────────────────────────────────────────

export function ReviewSection({ productId, averageRating, reviewCount }: ReviewSectionProps) {
  const { t } = useTranslation("reviews");
  const { user } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("-createdAt");

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getProductReviewsAPI(productId, { page, limit: 10, sort });
      setData(res.data);
    } catch (err) {
      logger.error("ReviewSection fetch error:", err);
      setError(t("errorLoading"));
    } finally {
      setLoading(false);
    }
  }, [productId, page, sort, t]);

  const fetchEligibility = useCallback(async () => {
    if (!user) {
      setEligibility(null);
      return;
    }
    try {
      const res = await checkReviewEligibilityAPI(productId);
      setEligibility(res.data);
    } catch (err) {
      logger.error("ReviewSection eligibility error:", err);
    }
  }, [productId, user]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    fetchEligibility();
  }, [fetchEligibility]);

  const handleDelete = async (reviewId: string) => {
    try {
      await deleteReviewAPI(reviewId);
      toast({ description: t("deleteSuccess") });
      fetchReviews();
      fetchEligibility();
    } catch (err) {
      logger.error("ReviewSection delete error:", err);
      toast({ title: t("deleteError"), variant: "destructive" });
    }
  };

  const handleReviewSuccess = () => {
    fetchReviews();
    fetchEligibility();
  };

  if (loading && !data) return <ReviewSectionSkeleton />;

  if (error && !data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
        <Button variant="outline" size="sm" className="mt-2" onClick={fetchReviews}>
          {t("retry")}
        </Button>
      </Alert>
    );
  }

  const reviews = data?.reviews ?? [];
  const distribution = data?.ratingDistribution ?? [];
  const pagination = data?.pagination ?? { page: 1, pages: 1, total: 0, limit: 10 };

  return (
    <section className="mt-12" aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className="text-xl font-bold mb-6">
        {t("title")} ({pagination.total})
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rating Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
              <RatingStars rating={averageRating} size="md" className="justify-center mt-1" />
              <p className="text-sm text-muted-foreground mt-1">
                {t("basedOn", { count: reviewCount })}
              </p>
            </div>
            <RatingDistribution distribution={distribution} total={pagination.total} />

            {/* Write Review CTA */}
            {eligibility?.canReview && (
              <div className="mt-4">
                <ReviewForm productId={productId} onSuccess={handleReviewSuccess} />
              </div>
            )}
            {eligibility?.existingReview && (
              <p className="text-xs text-muted-foreground mt-3">{t("alreadyReviewed")}</p>
            )}
            {user && eligibility && !eligibility.hasDeliveredOrder && (
              <p className="text-xs text-muted-foreground mt-3">{t("mustPurchase")}</p>
            )}
            {!user && (
              <p className="text-xs text-muted-foreground mt-3">{t("loginToReview")}</p>
            )}
          </CardContent>
        </Card>

        {/* Reviews List */}
        <div className="md:col-span-2">
          {/* Sort */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <Button
                variant={sort === "-createdAt" ? "default" : "outline"}
                size="sm"
                onClick={() => { setSort("-createdAt"); setPage(1); }}
              >
                {t("sortNewest")}
              </Button>
              <Button
                variant={sort === "-rating" ? "default" : "outline"}
                size="sm"
                onClick={() => { setSort("-rating"); setPage(1); }}
              >
                {t("sortHighest")}
              </Button>
              <Button
                variant={sort === "rating" ? "default" : "outline"}
                size="sm"
                onClick={() => { setSort("rating"); setPage(1); }}
              >
                {t("sortLowest")}
              </Button>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" aria-hidden="true" />
              <p className="text-muted-foreground">{t("noReviews")}</p>
              {eligibility?.canReview && (
                <div className="mt-3">
                  <ReviewForm productId={productId} onSuccess={handleReviewSuccess} />
                </div>
              )}
            </div>
          ) : (
            <div aria-live="polite">
              <div className="divide-y">
                {reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    currentUserId={user?.id ?? null}
                    onDelete={handleDelete}
                    onEdit={handleReviewSuccess}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    aria-label={t("prevPage")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {t("pageOf", { page: pagination.page, pages: pagination.pages })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.pages}
                    onClick={() => setPage((p) => p + 1)}
                    aria-label={t("nextPage")}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
