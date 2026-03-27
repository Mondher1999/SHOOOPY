"use client";

import { useState, useRef, useMemo, type DragEvent } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Trash2, GripVertical, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { COLOR_MAP, isColorAttr } from "@/lib/colorMap";
import logger from "@/lib/logger";
import { deleteProductImageAPI, reorderProductImagesAPI } from "@/services/upload-service";
import type { ProductImage } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export interface TaggableAttribute {
  key: string;
  label: string;
  options: string[];
}

interface ImageSortableProps {
  productId: string;
  images: ProductImage[];
  /** Called when the images array changes (reorder, delete, or tag) */
  onChange: (images: ProductImage[]) => void;
  /** Attributes available for tagging images (derived from product type) */
  taggableAttributes?: TaggableAttribute[];
  className?: string;
}

export default function ImageSortable({
  productId,
  images,
  onChange,
  taggableAttributes,
  className,
}: ImageSortableProps) {
  const { t } = useTranslation("products");
  const [deleteTarget, setDeleteTarget] = useState<ProductImage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const hasTaggable = taggableAttributes && taggableAttributes.length > 0;

  // Split taggable attributes into color (one-click dots) vs others (popover)
  const colorAttrs = useMemo(
    () => taggableAttributes?.filter((a) => isColorAttr(a.key)) ?? [],
    [taggableAttributes]
  );
  const nonColorAttrs = useMemo(
    () => taggableAttributes?.filter((a) => !isColorAttr(a.key)) ?? [],
    [taggableAttributes]
  );
  const hasColorAttrs = colorAttrs.length > 0;
  const hasNonColorAttrs = nonColorAttrs.length > 0;

  // ─── Drag-to-reorder ────────────────────────────────────────────────────────
  const dragIdx = useRef<number | null>(null);
  const dragOverIdx = useRef<number | null>(null);

  const handleDragStart = (idx: number) => {
    dragIdx.current = idx;
  };

  const handleDragEnter = (idx: number) => {
    dragOverIdx.current = idx;
  };

  const handleDragOver = (e: DragEvent<HTMLLIElement>) => {
    e.preventDefault(); // required to allow drop
  };

  const handleDrop = async () => {
    const from = dragIdx.current;
    const to = dragOverIdx.current;
    if (from === null || to === null || from === to) return;

    const reordered = [...images];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);

    onChange(reordered);
    dragIdx.current = null;
    dragOverIdx.current = null;

    try {
      await reorderProductImagesAPI(productId, reordered);
    } catch (err) {
      logger.error("reorderProductImages failed:", err);
      onChange(images);
    }
  };

  const handleDragEnd = () => {
    dragIdx.current = null;
    dragOverIdx.current = null;
  };

  // ─── Delete ─────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const originalFilename = deleteTarget.original.split("/").pop() ?? "";
      const fileId = `${productId}:${originalFilename}`;
      await deleteProductImageAPI(fileId);
      onChange(images.filter((img) => img.original !== deleteTarget.original));
      setDeleteTarget(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("upload.errorGeneric");
      setDeleteError(msg);
      logger.error("deleteProductImage failed:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Variant Tag ──────────────────────────────────────────────────────────
  const handleTagChange = async (imgIdx: number, attrKey: string, value: string) => {
    const updated = images.map((img, i) => {
      if (i !== imgIdx) return img;
      const currentMap = img.variantMap ? { ...img.variantMap } : {};
      if (value === "") {
        delete currentMap[attrKey];
      } else {
        currentMap[attrKey] = value;
      }
      return {
        ...img,
        variantMap: Object.keys(currentMap).length > 0 ? currentMap : undefined,
      };
    });

    onChange(updated);

    try {
      await reorderProductImagesAPI(productId, updated);
    } catch (err) {
      logger.error("saveVariantTags failed:", err);
      onChange(images);
    }
  };

  if (!images.length) {
    return (
      <p className="text-sm text-polaris-text-subdued py-2">
        {t("upload.sortableEmpty")}
      </p>
    );
  }

  return (
    <>
      <ul
        className={cn(
          "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3",
          className
        )}
        aria-label={t("upload.sortableAriaLabel")}
      >
        {images.map((img, idx) => {
          const tagCount = img.variantMap ? Object.keys(img.variantMap).length : 0;

          return (
            <li
              key={img.original}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              className={cn(
                "group rounded-md border bg-muted overflow-hidden cursor-grab active:cursor-grabbing",
                dragIdx.current === idx && "opacity-40 ring-2 ring-primary"
              )}
              aria-label={t("upload.imageAriaLabel", { idx: idx + 1 })}
            >
              {/* Image container */}
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src={`${BASE_URL}${img.thumbnail}`}
                  alt={t("upload.imageAriaLabel", { idx: idx + 1 })}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  unoptimized
                />

                {/* Drag handle + tag popover (non-color attrs only) + delete — on hover */}
                <div className="absolute inset-0 flex items-start justify-between p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1">
                    <div className="rounded bg-background/70 p-0.5">
                      <GripVertical className="h-4 w-4 text-polaris-text-subdued" aria-hidden="true" />
                    </div>
                    {/* Tag popover — only for non-color attributes (size, material, etc.) */}
                    {hasNonColorAttrs && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              "rounded p-0.5 transition-colors cursor-pointer",
                              tagCount > 0
                                ? "bg-primary/90 text-primary-foreground"
                                : "bg-background/70 text-polaris-text-subdued hover:bg-background"
                            )}
                            aria-label={t("upload.tagImageAriaLabel", { idx: idx + 1 })}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Tag className="h-4 w-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-56 p-3 space-y-3"
                          side="bottom"
                          align="start"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <p className="text-xs font-semibold text-foreground">
                            {t("upload.tagTitle")}
                          </p>
                          {nonColorAttrs.map((attr) => {
                            const currentVal = img.variantMap?.[attr.key] ?? "";
                            return (
                              <div key={attr.key} className="space-y-1">
                                <label className="text-[11px] font-medium text-polaris-text-subdued uppercase tracking-wider">
                                  {attr.label}
                                </label>
                                <select
                                  className="w-full h-8 px-2 text-xs rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                  value={currentVal}
                                  onChange={(e) => handleTagChange(idx, attr.key, e.target.value)}
                                >
                                  <option value="">—</option>
                                  {attr.options.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => { setDeleteTarget(img); setDeleteError(null); }}
                    aria-label={t("upload.deleteImageAriaLabel", { idx: idx + 1 })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Position badge */}
                {idx === 0 && (
                  <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    {t("upload.primaryBadge")}
                  </span>
                )}

                {/* Tag indicator badge */}
                {tagCount > 0 && (
                  <span className="absolute bottom-1 right-1 rounded bg-primary/90 text-primary-foreground px-1 py-0.5 text-[9px] font-bold flex items-center gap-0.5">
                    <Tag className="h-2.5 w-2.5" aria-hidden="true" />
                    {tagCount}
                  </span>
                )}
              </div>

              {/* ─── One-click color tag strip (always visible) ───────────────── */}
              {hasColorAttrs && (
                <div className="flex gap-1.5 p-1.5 border-t border-border justify-center flex-wrap">
                  {colorAttrs.flatMap((attr) =>
                    attr.options.map((colorVal) => {
                      const isTagged = img.variantMap?.[attr.key] === colorVal;
                      const cssColor = COLOR_MAP[colorVal];
                      const isGradient = cssColor?.includes("gradient") || cssColor?.includes("conic");
                      const isLight = colorVal === "Clear" || colorVal === "White" || colorVal === "Beige" || colorVal === "Cream" || colorVal === "Ivory";

                      return (
                        <button
                          key={`${attr.key}-${colorVal}`}
                          type="button"
                          title={colorVal}
                          className={cn(
                            "h-5 w-5 rounded-full border-2 transition-all flex-shrink-0 cursor-pointer",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                            isTagged
                              ? "border-primary ring-2 ring-primary/30 scale-110"
                              : isLight
                              ? "border-border hover:border-foreground/40"
                              : "border-transparent hover:border-foreground/40"
                          )}
                          style={{
                            background: isGradient ? cssColor : undefined,
                            backgroundColor: !isGradient ? (cssColor ?? "#888") : undefined,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTagChange(idx, attr.key, isTagged ? "" : colorVal);
                          }}
                          aria-label={`${colorVal}${isTagged ? " ✓" : ""}`}
                          aria-pressed={isTagged}
                        />
                      );
                    })
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("upload.deleteConfirmTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-polaris-text-subdued">
            {t("upload.deleteConfirmMessage")}
          </p>
          {deleteError && (
            <p className="text-sm text-destructive" role="alert">{deleteError}</p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              {t("upload.deleteCancelButton")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              aria-busy={isDeleting}
            >
              {isDeleting ? t("upload.deletingButton") : t("upload.deleteConfirmButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
