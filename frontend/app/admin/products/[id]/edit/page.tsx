"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { getProductByIdAPI } from "@/services/product-service";
import type { Product } from "@/types";
import ProductForm from "@/components/admin/ProductForm";
import logger from "@/lib/logger";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation("common");

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getProductByIdAPI(id)
      .then((res) => setProduct(res.data))
      .catch((err) => {
        const msg = err instanceof Error ? err.message : t("errors.generic");
        setError(msg);
        logger.error("getProductById failed:", err);
      })
      .finally(() => setIsLoading(false));
  }, [id, t]);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <Alert variant="destructive" role="alert">
          <p className="text-sm">{error}</p>
        </Alert>
      </div>
    );
  }

  if (!product) return null;

  return <ProductForm product={product} isEdit />;
}
