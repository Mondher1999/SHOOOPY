"use client";

import { useState, useRef, type DragEvent } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import logger from "@/lib/logger";
import { deleteProductImageAPI, reorderProductImagesAPI } from "@/services/upload-service";
import type { ProductImage } from "@/types";

interface ImageSortableProps {
  productId: string;
  images: ProductImage[];
  /** Called when the images array changes (reorder or delete) */
  onChange: (images: ProductImage[]) => void;
  className?: string;
}

export default function ImageSortable({
  productId,
  images,
  onChange,
  className,
}: ImageSortableProps) {
  const { t } = useTranslation("products");
  const [deleteTarget, setDeleteTarget] = useState<ProductImage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ─── Drag-to-reorder ────────────────────────────────────────────────────────
  const dragIdx = useRef<number | null>(null);
  const dragOverIdx = useRef<number | null>(null);

  const handleDragStart = (idx: number) => {
    dragIdx.current = idx;
  };

  const handleDragEnter = (idx: number) => {
    dragOverIdx.current = idx;
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
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
      // Optimistic update already applied — revert on error
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
      // fileId = "{productId}:{originalFilename}"
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

  if (!images.length) {
    return (
      <p className="text-sm text-muted-foreground py-2">
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
        {images.map((img, idx) => (
          <li
            key={img.original}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragEnter={() => handleDragEnter(idx)}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-md border bg-muted cursor-grab active:cursor-grabbing",
              dragIdx.current === idx && "opacity-40 ring-2 ring-primary"
            )}
            aria-label={t("upload.imageAriaLabel", { idx: idx + 1 })}
          >
            <Image
              src={`http://localhost:5000${img.thumbnail}`}
              alt={t("upload.imageAriaLabel", { idx: idx + 1 })}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              unoptimized
            />

            {/* Drag handle overlay */}
            <div className="absolute inset-0 flex items-start justify-between p-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="rounded bg-background/70 p-0.5">
                <GripVertical className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
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

            {/* First image badge */}
            {idx === 0 && (
              <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                {t("upload.primaryBadge")}
              </span>
            )}
          </li>
        ))}
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
          <p className="text-sm text-muted-foreground">
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
