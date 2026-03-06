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

export function LowStockAlert({ products, isLoading }: LowStockAlertProps) {
  const { t } = useTranslation("admin");

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            {t("dashboard.lowStock.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("dashboard.lowStock.allGood")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          {t("dashboard.lowStock.title")}
          <Badge variant="secondary" className="ml-auto">
            {products.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2" role="list">
          {products.map((product) => (
            <li key={product._id}>
              <Link
                href={`/admin/products/${product._id}/edit`}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <span className="truncate font-medium">{product.name}</span>
                <Badge variant={product.stock === 0 ? "destructive" : "outline"}>
                  {product.stock === 0
                    ? t("dashboard.lowStock.outOfStock")
                    : t("dashboard.lowStock.remaining", { count: product.stock })}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
