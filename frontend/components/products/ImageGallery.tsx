"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface ImageGalleryProps {
  images: string[];
  productName: string;
  className?: string;
}

export function ImageGallerySkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-16 flex-shrink-0 rounded-md" />
        ))}
      </div>
    </div>
  );
}

export function ImageGallery({ images, productName, className }: ImageGalleryProps) {
  const { t } = useTranslation("products");
  const [activeIdx, setActiveIdx] = useState(0);
  const [imgError, setImgError] = useState(false);

  const hasImages = images.length > 0;
  const activeImage = hasImages ? images[activeIdx] : null;

  const goNext = () => setActiveIdx((i) => (i + 1) % images.length);
  const goPrev = () => setActiveIdx((i) => (i - 1 + images.length) % images.length);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main Image */}
      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
        {activeImage && !imgError ? (
          <img
            src={activeImage}
            alt={t("catalog.imageAlt", { name: productName, idx: activeIdx + 1 })}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <ImageOff className="h-16 w-16 text-muted-foreground" aria-hidden="true" />
          </div>
        )}

        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
              onClick={goPrev}
              aria-label={t("catalog.imagePrev")}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
              onClick={goNext}
              aria-label={t("catalog.imageNext")}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label={t("catalog.thumbnailsLabel")}
        >
          {images.map((src, idx) => (
            <button
              key={idx}
              role="tab"
              aria-selected={idx === activeIdx}
              aria-label={t("catalog.imageAlt", { name: productName, idx: idx + 1 })}
              onClick={() => {
                setActiveIdx(idx);
                setImgError(false);
              }}
              className={cn(
                "flex-shrink-0 h-16 w-16 rounded-md overflow-hidden border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                idx === activeIdx ? "border-primary" : "border-transparent hover:border-muted-foreground"
              )}
            >
              <img
                src={src}
                alt=""
                aria-hidden="true"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
