"use client";

import { useRef, useState, useCallback, type DragEvent, type ChangeEvent } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { UploadCloud, X, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import logger from "@/lib/logger";
import { uploadProductImagesAPI } from "@/services/upload-service";
import type { ProductImage } from "@/types";

interface FileUploadState {
  file: File;
  /** Preview URL created by URL.createObjectURL */
  previewUrl: string;
  status: "queued" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
}

interface ImageUploaderProps {
  productId: string;
  /** Called with the new image objects after a successful upload batch */
  onUploaded: (images: ProductImage[]) => void;
  className?: string;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILES = 10;
const MAX_SIZE_MB = 5;

export default function ImageUploader({ productId, onUploaded, className }: ImageUploaderProps) {
  const { t } = useTranslation("products");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploads, setUploads] = useState<FileUploadState[]>([]);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type))
      return t("upload.errorFileType");
    if (file.size > MAX_SIZE_MB * 1024 * 1024)
      return t("upload.errorFileSize", { mb: MAX_SIZE_MB });
    return null;
  };

  const enqueueFiles = useCallback(
    (rawFiles: File[]) => {
      const accepted: FileUploadState[] = [];
      for (const file of rawFiles.slice(0, MAX_FILES)) {
        const error = validateFile(file);
        accepted.push({
          file,
          previewUrl: URL.createObjectURL(file),
          status: error ? "error" : "queued",
          progress: 0,
          error: error ?? undefined,
        });
      }
      setUploads((prev) => [...prev, ...accepted]);

      // Upload valid files immediately
      const validFiles = accepted.filter((s) => s.status === "queued").map((s) => s.file);
      if (validFiles.length) {
        startUpload(validFiles, accepted);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [productId, t]
  );

  const startUpload = async (files: File[], states: FileUploadState[]) => {
    // Mark all as uploading
    setUploads((prev) =>
      prev.map((u) =>
        states.find((s) => s.file === u.file) ? { ...u, status: "uploading" } : u
      )
    );

    try {
      const result = await uploadProductImagesAPI(productId, files, (pct) => {
        setUploads((prev) =>
          prev.map((u) =>
            states.find((s) => s.file === u.file && u.status === "uploading")
              ? { ...u, progress: pct }
              : u
          )
        );
      });

      // Mark all as done
      setUploads((prev) =>
        prev.map((u) =>
          states.find((s) => s.file === u.file)
            ? { ...u, status: "done", progress: 100 }
            : u
        )
      );

      onUploaded(result.data.images);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("upload.errorGeneric");
      logger.error("ImageUploader upload failed:", err);
      setUploads((prev) =>
        prev.map((u) =>
          states.find((s) => s.file === u.file)
            ? { ...u, status: "error", error: msg }
            : u
        )
      );
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) enqueueFiles(files);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) enqueueFiles(files);
    // Reset input so same file can be re-selected after removal
    e.target.value = "";
  };

  const removeUpload = (idx: number) => {
    setUploads((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[idx].previewUrl);
      next.splice(idx, 1);
      return next;
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label={t("upload.dropZoneAriaLabel")}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer select-none",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
        )}
      >
        <UploadCloud className="h-10 w-10 text-polaris-text-subdued" aria-hidden="true" />
        <div className="text-center">
          <p className="text-sm font-medium">{t("upload.dropZoneTitle")}</p>
          <p className="text-xs text-polaris-text-subdued mt-1">{t("upload.dropZoneHint")}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          aria-hidden="true"
          onChange={handleFileInput}
        />
      </div>

      {/* Upload queue */}
      {uploads.length > 0 && (
        <ul className="space-y-2" aria-label={t("upload.queueAriaLabel")}>
          {uploads.map((item, idx) => (
            <li
              key={idx}
              className="flex items-center gap-3 rounded-md border bg-card p-2"
            >
              {/* Thumbnail preview */}
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded">
                <Image
                  src={item.previewUrl}
                  alt={item.file.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                  unoptimized
                />
              </div>

              {/* File info + progress */}
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-xs font-medium">{item.file.name}</p>
                {item.status === "uploading" && (
                  <Progress value={item.progress} className="h-1.5" aria-label={`${item.progress}%`} />
                )}
                {item.status === "done" && (
                  <p className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" aria-hidden="true" />
                    {t("upload.statusDone")}
                  </p>
                )}
                {item.status === "error" && (
                  <p className="flex items-center gap-1 text-xs text-destructive" role="alert">
                    <AlertCircle className="h-3 w-3" aria-hidden="true" />
                    {item.error}
                  </p>
                )}
                {item.status === "queued" && (
                  <p className="text-xs text-polaris-text-subdued">{t("upload.statusQueued")}</p>
                )}
              </div>

              {/* Remove button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 h-7 w-7"
                onClick={() => removeUpload(idx)}
                aria-label={t("upload.removeAriaLabel", { name: item.file.name })}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
