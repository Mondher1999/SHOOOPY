"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ShoppingCart, Star, AlertCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";
import { ImageGallery, ImageGallerySkeleton } from "@/components/products/ImageGallery";
import { RelatedProducts } from "@/components/products/RelatedProducts";
import { getProductBySlugAPI } from "@/services/product-service";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import logger from "@/lib/logger";
import type { Product } from "@/types";

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

export default function ProductDetailPage() {
  const { t } = useTranslation("products");
  const { t: tCart } = useTranslation("cart");
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const { addItem, openDrawer } = useCart();
  const { toast } = useToast();

  useEffect(() => {
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
  }, [slug, t]);

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

  const inStock = product.stock > 0;
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  // Build breadcrumbs
  const crumbs: BreadcrumbItem[] = [
    { label: t("catalog.breadcrumbProducts"), href: "/products" },
  ];
  if (product.category) {
    crumbs.push({
      label: product.category.name,
      href: `/categories/${product.category.slug}`,
    });
  }
  crumbs.push({ label: product.name });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={crumbs} className="mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Image Gallery */}
        <ImageGallery images={product.images} productName={product.name} />

        {/* Product Info */}
        <div className="space-y-5">
          {product.category && (
            <Link
              href={`/categories/${product.category.slug}`}
              className="text-sm text-primary hover:underline"
            >
              {product.category.name}
            </Link>
          )}

          <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{product.name}</h1>

          {/* Rating */}
          {product.ratings.count > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${s <= Math.round(product.ratings.average) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground" aria-label={t("catalog.ratingAriaLabel", { average: product.ratings.average, count: product.ratings.count })}>
                {product.ratings.average.toFixed(1)} ({product.ratings.count} {t("catalog.reviews")})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">${product.price.toFixed(2)}</span>
            {hasDiscount && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  ${product.compareAtPrice!.toFixed(2)}
                </span>
                <Badge variant="destructive" className="text-xs">
                  -{discountPercent}%
                </Badge>
              </>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Badge variant={inStock ? "default" : "secondary"}>
              {inStock
                ? t("catalog.inStockCount", { count: product.stock })
                : t("status.outOfStock")}
            </Badge>
          </div>

          <Separator />

          {/* Description */}
          {product.description && (
            <div>
              <h2 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground">
                {t("catalog.description")}
              </h2>
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Attributes */}
          {Object.keys(product.attributes).length > 0 && (
            <div>
              <h2 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground">
                {t("catalog.attributes")}
              </h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {Object.entries(product.attributes).map(([key, val]) => (
                  <>
                    <dt key={`k-${key}`} className="text-muted-foreground">{key}</dt>
                    <dd key={`v-${key}`} className="font-medium">{String(val)}</dd>
                  </>
                ))}
              </dl>
            </div>
          )}

          <Separator />

          {/* Add to Cart */}
          <Button
            size="lg"
            disabled={!inStock || adding}
            className="w-full"
            aria-label={t("catalog.addToCartAriaLabel", { name: product.name })}
            onClick={async () => {
              setAdding(true);
              try {
                await addItem(product.id, 1);
                toast({ description: tCart("addedToCartDesc", { name: product.name }) });
                openDrawer();
              } catch (err) {
                logger.error("Product detail addToCart error:", err);
                const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
                toast({ title: tCart("errorAdding"), description: msg ?? undefined, variant: "destructive" });
              } finally {
                setAdding(false);
              }
            }}
          >
            <ShoppingCart className="h-5 w-5 mr-2" aria-hidden="true" />
            {inStock ? t("catalog.addToCart") : t("status.outOfStock")}
          </Button>

          {product.sku && (
            <p className="text-xs text-muted-foreground">
              {t("catalog.sku")}: {product.sku}
            </p>
          )}
        </div>
      </div>

      {/* Related Products */}
      <RelatedProducts
        categoryId={product.category?.id ?? null}
        excludeProductId={product.id}
      />
    </div>
  );
}
