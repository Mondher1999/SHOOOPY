"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare, BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { useActiveTheme } from "@/hooks/useActiveTheme";
import { cn } from "@/lib/utils";
import logger from "@/lib/logger";
import type { Review, ReviewsResponse, ReviewEligibility, RatingDistributionItem } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

interface ReviewSectionProps {
  productId: string;
  averageRating: number;
  reviewCount: number;
}

// ─── Rating Distribution Bar ─────────────────────────────────────────────────

function RatingDistribution({
  distribution,
  total,
  textMuted,
}: {
  distribution: RatingDistributionItem[];
  total: number;
  textMuted: string;
}) {
  return (
    <div className="space-y-1.5">
      {distribution.map((item) => (
        <div key={item.rating} className="flex items-center gap-2 text-sm">
          <span className={cn("w-6 text-right", textMuted)}>{item.rating}</span>
          <RatingStars rating={item.rating} size="sm" />
          <Progress
            value={total > 0 ? (item.count / total) * 100 : 0}
            className="flex-1 h-2"
          />
          <span className={cn("w-8 text-right text-xs", textMuted)}>{item.count}</span>
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
  text,
  textMuted,
  surface,
}: {
  review: Review;
  currentUserId: string | null;
  onDelete: (id: string) => void;
  onEdit: () => void;
  text: string;
  textMuted: string;
  surface: string;
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
        <div className={cn("flex-shrink-0 h-10 w-10 rounded-full overflow-hidden flex items-center justify-center", surface)}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className={cn("text-sm font-medium", textMuted)}>
              {review.user.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("font-medium text-sm", text)}>{review.user.name}</span>
            {review.isVerified && (
              <Badge variant="secondary" className="text-xs gap-1">
                <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                {t("verifiedPurchase")}
              </Badge>
            )}
            <span className={cn("text-xs", textMuted)}>
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </div>

          <RatingStars rating={review.rating} size="sm" className="mt-1" />

          <h4 className={cn("font-medium text-sm mt-2", text)}>{review.title}</h4>
          <p className={cn("text-sm mt-1 whitespace-pre-line", textMuted)}>
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
  const theme = useActiveTheme();

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
      <h2 id="reviews-heading" className={cn("text-xl font-bold mb-6", theme.text, theme.headingClass)}>
        {t("title")} ({pagination.total})
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rating Summary */}
        <Card className={cn(theme.surface, theme.border)}>
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <div className={cn("text-4xl font-bold", theme.text)}>{averageRating.toFixed(1)}</div>
              <RatingStars rating={averageRating} size="md" className="justify-center mt-1" />
              <p className={cn("text-sm mt-1", theme.textMuted)}>
                {t("basedOn", { count: reviewCount })}
              </p>
            </div>
            <RatingDistribution distribution={distribution} total={pagination.total} textMuted={theme.textMuted} />

            {/* Write Review CTA */}
            {eligibility?.canReview && (
              <div className="mt-4">
                <ReviewForm productId={productId} onSuccess={handleReviewSuccess} />
              </div>
            )}
            {eligibility?.existingReview && (
              <p className={cn("text-xs mt-3", theme.textMuted)}>{t("alreadyReviewed")}</p>
            )}
            {user && eligibility && !eligibility.hasDeliveredOrder && (
              <p className={cn("text-xs mt-3", theme.textMuted)}>{t("mustPurchase")}</p>
            )}
            {!user && (
              <p className={cn("text-xs mt-3", theme.textMuted)}>{t("loginToReview")}</p>
            )}
          </CardContent>
        </Card>

        {/* Reviews List */}
        <div className="md:col-span-2">
          {/* Sort */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSort("-createdAt"); setPage(1); }}
                className={cn(sort === "-createdAt" ? cn(theme.badgeBg, theme.badgeText, "hover:opacity-90") : theme.btnOutline)}
              >
                {t("sortNewest")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSort("-rating"); setPage(1); }}
                className={cn(sort === "-rating" ? cn(theme.badgeBg, theme.badgeText, "hover:opacity-90") : theme.btnOutline)}
              >
                {t("sortHighest")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSort("rating"); setPage(1); }}
                className={cn(sort === "rating" ? cn(theme.badgeBg, theme.badgeText, "hover:opacity-90") : theme.btnOutline)}
              >
                {t("sortLowest")}
              </Button>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className={cn("h-12 w-12 mx-auto mb-3", theme.textMuted)} aria-hidden="true" />
              <p className={theme.textMuted}>{t("noReviews")}</p>
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
                    text={theme.text}
                    textMuted={theme.textMuted}
                    surface={theme.surface}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    aria-label={t("prevPage")}
                    className={theme.btnOutline}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className={cn("text-sm", theme.textMuted)}>
                    {t("pageOf", { page: pagination.page, pages: pagination.pages })}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page >= pagination.pages}
                    onClick={() => setPage((p) => p + 1)}
                    aria-label={t("nextPage")}
                    className={theme.btnOutline}
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
