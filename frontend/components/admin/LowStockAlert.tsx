"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardLowStockProduct } from "@/types";

interface LowStockAlertProps {
  products: DashboardLowStockProduct[];
  isLoading: boolean;
}

function getStockVariant(stock: number): "destructive" | "warning" | "secondary" {
  if (stock <= 3) return "destructive";
  if (stock <= 8) return "warning";
  return "secondary";
}

export function LowStockAlert({ products, isLoading }: LowStockAlertProps) {
  const { t } = useTranslation("admin");

  if (isLoading) {
    return (
      <Card className="shadow-polaris flex flex-col max-h-[370px]">
        <CardHeader className="p-4 pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Card className="shadow-polaris flex flex-col max-h-[370px]">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold text-polaris-text flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-polaris-warning" />
            {t("dashboard.lowStock.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-polaris-text-subdued">{t("dashboard.lowStock.allGood")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-polaris flex flex-col max-h-[370px]">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-2 shrink-0">
        <CardTitle className="text-sm font-semibold text-polaris-text flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-polaris-warning" />
          {t("dashboard.lowStock.title")}
        </CardTitle>
        <Badge variant="secondary" className="text-xs">
          {products.length}
        </Badge>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto px-0 pb-0 pt-0 min-h-0">
        <div className="divide-y divide-polaris-border">
          {products.map((product) => (
            <Link
              key={product._id}
              href={`/admin/products/${product._id}/edit`}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-polaris-surface-hovered transition-colors"
            >
              <span className="truncate font-medium text-polaris-text flex-1 min-w-0">{product.name}</span>
              <Badge variant={getStockVariant(product.stock)} className="whitespace-nowrap text-xs shrink-0">
                {product.stock === 0
                  ? t("dashboard.lowStock.outOfStock")
                  : t("dashboard.lowStock.remaining", { count: product.stock })}
              </Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
