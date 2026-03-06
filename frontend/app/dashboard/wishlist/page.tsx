"use client";

import { useTranslation } from "react-i18next";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RatingStars } from "@/components/products/RatingStars";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import logger from "@/lib/logger";
import { useState } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function WishlistSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <Skeleton className="aspect-square w-full rounded-t-lg" />
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-9 w-full mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function WishlistPage() {
  const { t } = useTranslation("wishlist");
  const { t: tCart } = useTranslation("cart");
  const { t: tProducts } = useTranslation("products");
  const { wishlist, isLoading, removeItem, reload } = useWishlist();
  const { addItem: addToCart, openDrawer } = useCart();
  const { toast } = useToast();
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  const handleRemove = async (productId: string, productName: string) => {
    try {
      await removeItem(productId);
      toast({ description: t("removed", { name: productName }) });
    } catch (err) {
      logger.error("WishlistPage remove error:", err);
      toast({ title: t("errorRemove"), variant: "destructive" });
    }
  };

  const handleAddToCart = async (productId: string, productName: string) => {
    setAddingToCart(productId);
    try {
      await addToCart(productId, 1);
      toast({ description: tCart("addedToCartDesc", { name: productName }) });
      openDrawer();
    } catch (err) {
      logger.error("WishlistPage addToCart error:", err);
      toast({ title: tCart("errorAdding"), variant: "destructive" });
    } finally {
      setAddingToCart(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("pageTitle")}</h1>

      {/* Loading */}
      {isLoading && !wishlist && <WishlistSkeleton />}

      {/* Error / empty fallback when no wishlist loaded */}
      {!isLoading && !wishlist && (
        <Alert>
          <AlertDescription>{t("errorLoading")}</AlertDescription>
          <Button variant="outline" size="sm" className="mt-2" onClick={reload}>
            {t("retry")}
          </Button>
        </Alert>
      )}

      {/* Empty state */}
      {wishlist && wishlist.items.length === 0 && (
        <div className="text-center py-16">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold mb-2">{t("emptyTitle")}</h2>
          <p className="text-muted-foreground mb-4">{t("emptyDescription")}</p>
          <Button asChild>
            <Link href="/products">{t("browseProducts")}</Link>
          </Button>
        </div>
      )}

      {/* Product grid */}
      {wishlist && wishlist.items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlist.items.map((item) => {
            const product = item.product;
            if (!product || typeof product !== "object") return null;

            const primaryImage = product.images?.[0] ?? null;
            const inStock = product.stock > 0;

            return (
              <Card key={product.id} className="group overflow-hidden">
                <Link
                  href={`/products/${product.slug}`}
                  className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {primaryImage ? (
                      <Image
                        src={`${BASE_URL}${primaryImage.thumbnail}`}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        unoptimized
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                </Link>

                <CardContent className="p-4">
                  <Link href={`/products/${product.slug}`} className="group/title">
                    <h3 className="font-medium text-sm leading-snug group-hover/title:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
                      {product.name}
                    </h3>
                  </Link>

                  <RatingStars
                    rating={product.ratings.average}
                    size="sm"
                    count={product.ratings.count}
                    className="mt-1"
                  />

                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="font-semibold">${product.price.toFixed(2)}</span>
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <span className="text-xs text-muted-foreground line-through">
                        ${product.compareAtPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <Badge
                    variant={inStock ? "default" : "secondary"}
                    className="text-xs mt-1.5"
                  >
                    {inStock ? tProducts("status.inStock") : tProducts("status.outOfStock")}
                  </Badge>

                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      className="flex-1 text-xs"
                      disabled={!inStock || addingToCart === product.id}
                      onClick={() => handleAddToCart(product.id, product.name)}
                    >
                      <ShoppingCart className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                      {tProducts("catalog.addToCart")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemove(product.id, product.name)}
                      aria-label={t("removeAriaLabel", { name: product.name })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
