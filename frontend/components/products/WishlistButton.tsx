"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import logger from "@/lib/logger";

interface WishlistButtonProps {
  productId: string;
  productName?: string;
  size?: "sm" | "md";
  className?: string;
}

export function WishlistButton({
  productId,
  productName,
  size = "md",
  className,
}: WishlistButtonProps) {
  const { t } = useTranslation("wishlist");
  const { user } = useAuth();
  const { wishlistIds, toggleItem } = useWishlist();
  const { toast } = useToast();
  const [toggling, setToggling] = useState(false);

  const isInWishlist = wishlistIds.has(productId);

  const handleToggle = async () => {
    if (!user) {
      toast({ description: t("loginRequired"), variant: "destructive" });
      return;
    }

    setToggling(true);
    try {
      await toggleItem(productId);
      toast({
        description: isInWishlist
          ? t("removed", { name: productName ?? "" })
          : t("added", { name: productName ?? "" }),
      });
    } catch (err) {
      logger.error("WishlistButton toggle error:", err);
      toast({ title: t("errorToggle"), variant: "destructive" });
    } finally {
      setToggling(false);
    }
  };

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "rounded-full",
        size === "sm" ? "h-8 w-8" : "h-10 w-10",
        className
      )}
      disabled={toggling}
      onClick={handleToggle}
      aria-label={
        isInWishlist
          ? t("removeAriaLabel", { name: productName ?? "" })
          : t("addAriaLabel", { name: productName ?? "" })
      }
      aria-pressed={isInWishlist}
    >
      <Heart
        className={cn(
          iconSize,
          "transition-colors",
          isInWishlist
            ? "fill-red-500 text-red-500"
            : "text-muted-foreground"
        )}
      />
    </Button>
  );
}
