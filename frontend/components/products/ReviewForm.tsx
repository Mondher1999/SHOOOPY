"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RatingStars } from "@/components/products/RatingStars";
import { useToast } from "@/hooks/use-toast";
import { createReviewAPI, updateReviewAPI } from "@/services/review-service";
import logger from "@/lib/logger";
import type { Review } from "@/types";

interface ReviewFormProps {
  productId: string;
  existingReview?: Review | null;
  onSuccess: () => void;
}

export function ReviewForm({ productId, existingReview, onSuccess }: ReviewFormProps) {
  const { t } = useTranslation("reviews");
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [title, setTitle] = useState(existingReview?.title ?? "");
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!existingReview;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (rating < 1 || rating > 5) errs.rating = t("form.errorRating");
    if (title.trim().length < 3 || title.trim().length > 100) errs.title = t("form.errorTitle");
    if (comment.trim().length < 10 || comment.trim().length > 1000) errs.comment = t("form.errorComment");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isEditing && existingReview) {
        await updateReviewAPI(existingReview.id, {
          rating,
          title: title.trim(),
          comment: comment.trim(),
        });
        toast({ description: t("form.successUpdated") });
      } else {
        await createReviewAPI({
          product: productId,
          rating,
          title: title.trim(),
          comment: comment.trim(),
        });
        toast({ description: t("form.successCreated") });
      }
      setOpen(false);
      onSuccess();
    } catch (err) {
      logger.error("ReviewForm submit error:", err);
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast({
        title: t("form.errorSubmit"),
        description: msg ?? undefined,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setRating(existingReview?.rating ?? 0);
    setTitle(existingReview?.title ?? "");
    setComment(existingReview?.comment ?? "");
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (val) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant={isEditing ? "outline" : "default"} size="sm">
          {isEditing ? t("form.editReview") : t("form.writeReview")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("form.editReviewTitle") : t("form.writeReviewTitle")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEditing ? t("form.editReviewTitle") : t("form.writeReviewTitle")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div role="group" aria-labelledby="review-rating-label">
            <Label id="review-rating-label">{t("form.ratingLabel")}</Label>
            <RatingStars
              rating={rating}
              size="lg"
              interactive
              onChange={setRating}
              className="mt-1"
            />
            {errors.rating && (
              <p className="text-sm text-destructive mt-1" role="alert">
                {errors.rating}
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="review-title">{t("form.titleLabel")}</Label>
            <Input
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("form.titlePlaceholder")}
              maxLength={100}
              aria-describedby={errors.title ? "title-error" : undefined}
            />
            {errors.title && (
              <p id="title-error" className="text-sm text-destructive mt-1" role="alert">
                {errors.title}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <Label htmlFor="review-comment">{t("form.commentLabel")}</Label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("form.commentPlaceholder")}
              rows={4}
              maxLength={1000}
              aria-describedby={errors.comment ? "comment-error" : undefined}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length}/1000
            </p>
            {errors.comment && (
              <p id="comment-error" className="text-sm text-destructive mt-1" role="alert">
                {errors.comment}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              {t("form.cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? t("form.submitting")
                : isEditing
                  ? t("form.update")
                  : t("form.submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
