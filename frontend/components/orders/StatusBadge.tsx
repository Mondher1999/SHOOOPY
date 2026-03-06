"use client";

import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:    "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed:  "bg-blue-100 text-blue-800 border-blue-200",
  processing: "bg-purple-100 text-purple-800 border-purple-200",
  shipped:    "bg-indigo-100 text-indigo-800 border-indigo-200",
  delivered:  "bg-green-100 text-green-800 border-green-200",
  cancelled:  "bg-red-100 text-red-800 border-red-200",
};

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation("orders");

  return (
    <Badge
      variant="outline"
      className={cn(STATUS_STYLES[status], className)}
    >
      {t(`status.${status}`)}
    </Badge>
  );
}
