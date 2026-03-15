"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useVariantFilteredImages } from "@/hooks/useVariantFilteredImages";
import type { ProductImage } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

interface ImageGalleryProps {
  images: ProductImage[];
  productName: string;
  className?: string;
  /** Currently selected variant options — used to filter/prioritize images by variantMap */
  selectedOptions?: Record<string, string | string[]>;
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

export function ImageGallery({ images, productName, className, selectedOptions }: ImageGalleryProps) {
  const { t } = useTranslation("products");
  const [activeIdx, setActiveIdx] = useState(0);
  const [imgError, setImgError] = useState(false);

  // Filter/prioritize images based on selected variant options
  const displayImages = useVariantFilteredImages(images, selectedOptions);

  // Reset to first image when displayImages changes
  const prevDisplayRef = useRef(displayImages);
  useEffect(() => {
    if (prevDisplayRef.current !== displayImages) {
      prevDisplayRef.current = displayImages;
      setActiveIdx(0);
      setImgError(false);
    }
  }, [displayImages]);

  const hasImages = displayImages.length > 0;
  const activeImage = hasImages ? displayImages[activeIdx] : null;

  const goNext = () => setActiveIdx((i) => (i + 1) % displayImages.length);
  const goPrev = () => setActiveIdx((i) => (i - 1 + displayImages.length) % displayImages.length);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main Image — use large variant for quality */}
      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
        {activeImage && !imgError ? (
          <Image
            src={`${BASE_URL}${activeImage.large}`}
            alt={t("catalog.imageAlt", { name: productName, idx: activeIdx + 1 })}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority={activeIdx === 0}
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <ImageOff className="h-16 w-16 text-muted-foreground" aria-hidden="true" />
          </div>
        )}

        {displayImages.length > 1 && (
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

      {/* Thumbnail Strip — use thumbnail variant */}
      {displayImages.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label={t("catalog.thumbnailsLabel")}
        >
          {displayImages.map((img, idx) => (
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
                "flex-shrink-0 h-16 w-16 rounded-md overflow-hidden border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring relative",
                idx === activeIdx ? "border-primary" : "border-transparent hover:border-muted-foreground"
              )}
            >
              <Image
                src={`${BASE_URL}${img.thumbnail}`}
                alt=""
                aria-hidden="true"
                fill
                className="object-cover"
                sizes="64px"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
