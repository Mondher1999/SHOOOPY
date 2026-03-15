"use client";

import { ShoppingCart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";

export function CartIcon() {
  const { t } = useTranslation("cart");
  const { totalItems, openDrawer } = useCart();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t("cartIconAriaLabel", { count: totalItems })}
      className="relative"
      onClick={openDrawer}
      suppressHydrationWarning
    >
      <ShoppingCart className="h-5 w-5" aria-hidden="true" />
      {totalItems > 0 && (
        <Badge
          className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full px-1 text-xs flex items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
          {totalItems > 99 ? "99+" : totalItems}
        </Badge>
      )}
    </Button>
  );
}
