"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageGallerySkeleton } from "@/components/products/ImageGallery";
import { ProductDetailViewSwitcher } from "@/components/products/views/ProductDetailViewSwitcher";
import { BuyNowModal } from "@/components/products/BuyNowModal";
import { getProductBySlugAPI } from "@/services/product-service";
import { getProductTypeCatalogAPI } from "@/services/settings-service";
import { trackProductView } from "@/components/home/RecentlyViewed";
import { useCart } from "@/contexts/CartContext";
import { useShowcase } from "@/hooks/useShowcase";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import logger from "@/lib/logger";
import type { Product, ProductTypeCatalog } from "@/types";

function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Skeleton className="h-4 w-48 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <ImageGallerySkeleton />
        <div className="space-y-4">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}

interface ProductDetailClientProps {
  initialProduct?: Product | null;
}

export default function ProductDetailClient({ initialProduct }: ProductDetailClientProps) {
  const { t } = useTranslation("products");
  const { t: tCart } = useTranslation("cart");
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(initialProduct ?? null);
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [buyNowOpen, setBuyNowOpen] = useState(false);
  const [typeCatalog, setTypeCatalog] = useState<ProductTypeCatalog | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string | string[]>>({});
  const { addItem, openDrawer } = useCart();
  const isShowcase = useShowcase();
  const { settings } = useSettings();
  const buyNowEnabled = settings?.store?.buyNowEnabled ?? true;
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (initialProduct) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    getProductBySlugAPI(slug)
      .then((res) => {
        if (!cancelled) setProduct(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          logger.error("Product detail fetch error:", err);
          const status = err?.response?.status;
          if (status === 404) setError(t("catalog.notFound"));
          else setError(t("catalog.errorLoading"));
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [slug, t, initialProduct]);

  useEffect(() => {
    if (product?.id) trackProductView(product.id);
  }, [product?.id]);

  // Fetch product type catalog for variant selectors
  useEffect(() => {
    if (!product?.productType) return;
    getProductTypeCatalogAPI()
      .then((res) => setTypeCatalog(res.data))
      .catch((err) => logger.error("Failed to load type catalog:", err));
  }, [product?.productType]);

  // Reset selected options when product changes
  useEffect(() => {
    setSelectedOptions({});
  }, [product?.id]);

  const handleOptionChange = useCallback((key: string, value: string | string[]) => {
    setSelectedOptions((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Filter out empty values from selected options before sending
  const cleanSelectedOptions = useMemo(() => {
    const clean: Record<string, string | string[]> = {};
    for (const [k, v] of Object.entries(selectedOptions)) {
      if (typeof v === "string" && v) clean[k] = v;
      else if (Array.isArray(v) && v.length > 0) clean[k] = v;
    }
    return Object.keys(clean).length > 0 ? clean : undefined;
  }, [selectedOptions]);

  const handleAddToCart = useCallback(async (quantityOrEvent?: number | unknown) => {
    if (!product) return;
    const qty = typeof quantityOrEvent === "number" ? quantityOrEvent : 1;
    // Convert cleanSelectedOptions to Record<string, string> for cart storage
    // (buyer picks ONE value per attribute, so array values take the first element)
    const cartOptions: Record<string, string> | undefined = cleanSelectedOptions
      ? Object.entries(cleanSelectedOptions).reduce<Record<string, string>>((acc, [k, v]) => {
          acc[k] = Array.isArray(v) ? v[0] : v;
          return acc;
        }, {})
      : undefined;
    setAdding(true);
    try {
      await addItem(product.id, qty, cartOptions);
      toast({ description: tCart("addedToCartDesc", { name: product.name }) });
      openDrawer();
    } catch (err) {
      logger.error("Product detail addToCart error:", err);
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast({ title: tCart("errorAdding"), description: msg ?? undefined, variant: "destructive" });
    } finally {
      setAdding(false);
    }
  }, [product, addItem, openDrawer, toast, tCart, cleanSelectedOptions]);

  const handleBuyNow = useCallback(() => {
    if (!product) return;
    if (!user) {
      toast({ title: tCart("loginRequired") ?? "Please log in to continue", variant: "destructive" });
      return;
    }
    setBuyNowOpen(true);
  }, [product, user, toast, tCart]);

  if (loading) return <ProductDetailSkeleton />;

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Alert variant="destructive" className="max-w-sm mx-auto">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{error ?? t("catalog.notFound")}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/products">{t("catalog.backToProducts")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <ProductDetailViewSwitcher
        product={product}
        isShowcase={isShowcase}
        adding={adding}
        onAddToCart={handleAddToCart}
        onBuyNow={buyNowEnabled ? handleBuyNow : undefined}
        typeCatalog={typeCatalog}
        selectedOptions={selectedOptions}
        onOptionChange={handleOptionChange}
      />
      {product && buyNowEnabled && (
        <BuyNowModal
          product={product}
          open={buyNowOpen}
          onOpenChange={setBuyNowOpen}
          selectedOptions={cleanSelectedOptions}
        />
      )}
    </>
  );
}
