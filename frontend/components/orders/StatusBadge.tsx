"use client";

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

// Inline styles per Problem 1 rules — avoids CSS-variable specificity battles
// inside .admin-polaris and maps each status to its exact Polaris token color.
const STATUS_INLINE: Record<OrderStatus, React.CSSProperties> = {
  pending:    { background: "#FFEA8A", backgroundColor: "#FFEA8A", color: "#B98900", border: "1px solid #FFEA8A" },
  confirmed:  { background: "#A4E8F2", backgroundColor: "#A4E8F2", color: "#2C6ECB", border: "1px solid #A4E8F2" },
  processing: { background: "#E4E5E7", backgroundColor: "#E4E5E7", color: "#454F5B", border: "1px solid #E4E5E7" },
  shipped:    { background: "#B4E0FA", backgroundColor: "#B4E0FA", color: "#0870D9", border: "1px solid #B4E0FA" },
  delivered:  { background: "#AEE9D1", backgroundColor: "#AEE9D1", color: "#008060", border: "1px solid #AEE9D1" },
  cancelled:  { background: "#FED3D1", backgroundColor: "#FED3D1", color: "#D72C0D", border: "1px solid #FED3D1" },
};

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation("orders");

  return (
    <span
      style={{
        ...STATUS_INLINE[status],
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "9999px",
        padding: "2px 10px",
        fontSize: "12px",
        fontWeight: 500,
        lineHeight: "20px",
        whiteSpace: "nowrap",
      }}
      className={cn(className)}
    >
      {t(`status.${status}`)}
    </span>
  );
}
