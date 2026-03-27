"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Camera, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfileAPI } from "@/services/user-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import logger from "@/lib/logger";

const schema = z.object({
  name: z.string().min(1, "dashboard:validation.nameRequired"),
  email: z
    .string()
    .min(1, "dashboard:validation.emailRequired")
    .email("dashboard:validation.emailInvalid"),
});

type FormValues = z.infer<typeof schema>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

const inputClasses = cn(
  "w-full h-9 px-3 text-sm rounded border border-[#C9CCCF] bg-polaris-surface text-polaris-text",
  "placeholder:text-polaris-text-subdued",
  "focus:outline-none focus:ring-1 focus:ring-polaris-primary focus:border-polaris-primary"
);

const cardClasses = "bg-polaris-surface border border-polaris-border rounded-lg shadow-sm";

export default function ProfilePage() {
  const { user, refreshUser, isLoading: authLoading } = useAuth();
  const { t } = useTranslation(["dashboard", "common"]);
  const { toast } = useToast();

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "" },
  });

  useEffect(() => {
    if (user) reset({ name: user.name, email: user.email });
  }, [user, reset]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: t("profile.invalidAvatarType"), variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: t("profile.avatarTooLarge"), variant: "destructive" });
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      await updateProfileAPI({
        name: values.name !== user?.name ? values.name : undefined,
        email: values.email !== user?.email ? values.email : undefined,
        avatar: avatarFile ?? undefined,
      });
      await refreshUser();
      setAvatarFile(null);
      toast({ title: t("dashboard:profile.successMessage") });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("common:errors.generic");
      setServerError(msg);
      logger.error("updateProfile failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const avatarSrc = avatarPreview
    ? avatarPreview
    : user?.avatar
    ? `${API_URL}${user.avatar}`
    : null;

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  if (authLoading) {
    return (
      <div className="space-y-5">
        <div>
          <Skeleton className="h-7 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className={cn(cardClasses, "p-6 space-y-4")}>
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className={cn(cardClasses, "p-6 space-y-4")}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page heading */}
      <div>
        <h1 className="text-xl font-semibold text-polaris-text">{t("dashboard:profile.title")}</h1>
        <p className="text-sm text-polaris-text-subdued mt-0.5">{t("dashboard:profile.subtitle")}</p>
      </div>

      {/* Avatar card */}
      <div className={cn(cardClasses, "p-6")}>
        <h2 className="text-sm font-semibold text-polaris-text mb-4">{t("dashboard:profile.avatarLabel")}</h2>
        <div className="flex items-center gap-5">
          {/* Avatar circle */}
          <div
            className="relative h-20 w-20 rounded-full bg-polaris-surface-hovered flex items-center justify-center overflow-hidden ring-2 ring-polaris-border cursor-pointer group shrink-0"
            onClick={() => fileInputRef.current?.click()}
            role="button"
            aria-label={t("dashboard:profile.avatarChange")}
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt={t("dashboard:profile.avatarLabel")} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-semibold text-polaris-text-subdued">{initials}</span>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="h-5 w-5 text-white" />
            </div>
          </div>

          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 px-3 text-sm font-medium rounded border border-[#C9CCCF] text-polaris-text bg-polaris-surface hover:bg-polaris-surface-hovered transition-colors cursor-pointer"
            >
              {t("dashboard:profile.avatarChange")}
            </button>
            <p className="text-xs text-polaris-text-subdued">{t("dashboard:profile.avatarHint")}</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          aria-label={t("dashboard:profile.avatarChange")}
          onChange={handleAvatarChange}
        />
      </div>

      {/* Profile form card */}
      <div className={cn(cardClasses, "p-6")}>
        <h2 className="text-sm font-semibold text-polaris-text mb-4">{t("dashboard:profile.title")}</h2>

        {serverError && (
          <div
            role="alert"
            className="flex items-center gap-2 mb-4 px-3 py-2 rounded border border-polaris-critical-light bg-[#FFF4F4] text-polaris-critical text-sm"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Name */}
          <div className="space-y-1">
            <label htmlFor="name" className="block text-sm font-medium text-polaris-text">
              {t("dashboard:profile.nameLabel")}
            </label>
            <input
              id="name"
              className={inputClasses}
              {...register("name")}
              aria-describedby={errors.name ? "name-error" : undefined}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p id="name-error" role="alert" className="text-xs text-polaris-critical">
                {t(errors.name.message as string)}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-polaris-text">
              {t("dashboard:profile.emailLabel")}
            </label>
            <input
              id="email"
              type="email"
              className={inputClasses}
              {...register("email")}
              aria-describedby={errors.email ? "email-error" : undefined}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p id="email-error" role="alert" className="text-xs text-polaris-critical">
                {t(errors.email.message as string)}
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="pt-1 border-t border-polaris-border mt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium rounded bg-polaris-primary text-white hover:bg-polaris-primary-hovered disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSubmitting ? t("dashboard:profile.submitting") : t("dashboard:profile.submitButton")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
