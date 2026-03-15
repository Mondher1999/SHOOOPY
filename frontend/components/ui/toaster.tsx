"use client";

import { ShoppingCart, CheckCircle2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts } = useToast();
  const { t } = useTranslation("cart");

  return (
    <ToastProvider duration={2000}>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isDestructive = variant === "destructive";
        const isCartAdd = !title && !isDestructive;

        return (
          <Toast key={id} variant={variant} {...props}>
            {/* Icon */}
            <div className={cn(
              "flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full",
              isDestructive
                ? "bg-destructive/10 text-destructive"
                : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
            )}>
              {isDestructive
                ? <AlertCircle className="h-4 w-4" />
                : isCartAdd
                  ? <ShoppingCart className="h-4 w-4" />
                  : <CheckCircle2 className="h-4 w-4" />
              }
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {title
                ? <ToastTitle>{title}</ToastTitle>
                : isCartAdd && (
                  <p className="text-sm font-semibold text-foreground leading-none mb-1">
                    {t("addedToCart")}
                  </p>
                )
              }
              {description && (
                <ToastDescription className="line-clamp-2">
                  {description}
                </ToastDescription>
              )}
            </div>

            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
