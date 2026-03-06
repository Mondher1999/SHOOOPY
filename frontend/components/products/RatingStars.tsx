"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  count?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

const sizeMap = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function RatingStars({
  rating,
  size = "md",
  showValue = false,
  count,
  interactive = false,
  onChange,
  className,
}: RatingStarsProps) {
  const iconSize = sizeMap[size];

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role={interactive ? "radiogroup" : undefined}
      aria-label={interactive ? "Rating" : `Rating: ${rating} out of 5`}
    >
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= Math.round(rating);

          if (interactive) {
            return (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={star === Math.round(rating)}
                aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                className="p-0.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                onClick={() => onChange?.(star)}
              >
                <Star
                  className={cn(
                    iconSize,
                    "transition-colors",
                    star <= Math.round(rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground hover:text-amber-300"
                  )}
                />
              </button>
            );
          }

          return (
            <Star
              key={star}
              className={cn(
                iconSize,
                isFilled
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground"
              )}
              aria-hidden="true"
            />
          );
        })}
      </div>

      {showValue && (
        <span className="text-sm text-muted-foreground ml-1">
          {rating.toFixed(1)}
        </span>
      )}

      {count !== undefined && (
        <span className="text-sm text-muted-foreground">
          ({count})
        </span>
      )}
    </div>
  );
}
