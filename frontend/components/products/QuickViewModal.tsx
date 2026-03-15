"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { useToast } from "@/hooks/use-toast";
import logger from "@/lib/logger";
import type { Product } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

interface QuickViewModalProps {
  product: Product;
  onClose: () => void;
}

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const { t } = useTranslation("products");
  const { t: tCart } = useTranslation("cart");
  const { addItem, openDrawer } = useCart();
  const formatPrice = useFormatPrice();
  const { toast } = useToast();
  const [imgIdx, setImgIdx] = useState(0);
  const [adding, setAdding] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Escape key, body scroll lock, focus trap
  useEffect(() => {
    closeRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const images = product.images || [];
  const inStock = product.stock > 0;
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

  const prevImage = useCallback(() => {
    setImgIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const nextImage = useCallback(() => {
    setImgIdx((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await addItem(product.id, 1);
      toast({ description: tCart("addedToCartDesc", { name: product.name }) });
      openDrawer();
      onClose();
    } catch (err) {
      logger.error("QuickView addToCart error:", err);
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast({
        title: tCart("errorAdding"),
        description: msg ?? undefined,
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("quickView.ariaLabel", { name: product.name })}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="relative bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 z-10 w-11 h-11 flex items-center justify-center text-allure-text-muted hover:text-allure-text transition-colors cursor-pointer"
          aria-label={t("quickView.close", { defaultValue: "Close" })}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image gallery */}
          <div className="relative aspect-square bg-allure-bg-alt">
            {images.length > 0 ? (
              <>
                <Image
                  src={`${BASE_URL}${images[imgIdx].large}`}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 384px"
                />
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
                      aria-label={t("quickView.prevImage", { defaultValue: "Previous image" })}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
                      aria-label={t("quickView.nextImage", { defaultValue: "Next image" })}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingCart className="w-12 h-12 text-allure-text-muted" aria-hidden="true" />
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="p-6 md:p-8 flex flex-col justify-center">
            {product.category && (
              <p className="text-[11px] uppercase tracking-allure text-allure-text-muted mb-2">
                {product.category.name}
              </p>
            )}
            <h2 className="font-heading text-xl md:text-2xl font-medium uppercase tracking-allure text-allure-text mb-3">
              {product.name}
            </h2>

            <div className="flex items-center gap-3 mb-4">
              <span className="font-heading text-lg font-medium text-allure-text">
                {formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-allure-text-muted line-through">
                  {formatPrice(product.compareAtPrice!)}
                </span>
              )}
              <Badge variant={inStock ? "default" : "secondary"} className="text-xs">
                {inStock ? t("status.inStock") : t("status.outOfStock")}
              </Badge>
            </div>

            {product.description && (
              <p className="text-sm text-allure-text-muted leading-relaxed mb-6 line-clamp-4">
                {product.description}
              </p>
            )}

            <div className="flex flex-col gap-3">
              <Button
                disabled={!inStock || adding}
                onClick={handleAddToCart}
                className="w-full h-12 text-xs uppercase tracking-allure font-heading font-medium bg-allure-dark text-white hover:bg-allure-dark/90 cursor-pointer"
              >
                <ShoppingCart className="h-4 w-4 mr-2" aria-hidden="true" />
                {t("catalog.addToCart")}
              </Button>
              <Link
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="text-center text-xs uppercase tracking-allure font-heading text-allure-text hover:text-allure-text-muted transition-colors"
              >
                {t("quickView.viewFull", { defaultValue: "View Full Details" })}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
