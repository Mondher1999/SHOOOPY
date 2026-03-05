"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Camera, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfileAPI } from "@/services/user-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import logger from "@/lib/logger";

const schema = z.object({
  name: z.string().min(1, "dashboard:validation.nameRequired"),
  email: z
    .string()
    .min(1, "dashboard:validation.emailRequired")
    .email("dashboard:validation.emailInvalid"),
});

type FormValues = z.infer<typeof schema>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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

  // Populate form once user data is available
  useEffect(() => {
    if (user) {
      reset({ name: user.name, email: user.email });
    }
  }, [user, reset]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      const msg =
        err instanceof Error ? err.message : t("common:errors.generic");
      setServerError(msg);
      logger.error("updateProfile failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Current avatar URL (preview takes priority, then server avatar, then null)
  const avatarSrc = avatarPreview
    ? avatarPreview
    : user?.avatar
    ? `${API_URL}${user.avatar}`
    : null;

  // Initials fallback
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  if (authLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("dashboard:profile.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("dashboard:profile.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("dashboard:profile.avatarLabel")}</CardTitle>
          <CardDescription>{t("dashboard:profile.avatarHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div
              className="relative h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden ring-2 ring-border cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              aria-label={t("dashboard:profile.avatarChange")}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            >
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={t("dashboard:profile.avatarLabel")}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xl font-semibold text-muted-foreground">{initials}</span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>

            <div className="space-y-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                {t("dashboard:profile.avatarChange")}
              </Button>
              <p className="text-xs text-muted-foreground">{t("dashboard:profile.avatarHint")}</p>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("dashboard:profile.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {serverError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <p className="ml-2 text-sm">{serverError}</p>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1">
              <Label htmlFor="name">{t("dashboard:profile.nameLabel")}</Label>
              <Input
                id="name"
                {...register("name")}
                aria-describedby={errors.name ? "name-error" : undefined}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p id="name-error" role="alert" className="text-xs text-destructive">
                  {t(errors.name.message as string)}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">{t("dashboard:profile.emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                aria-describedby={errors.email ? "email-error" : undefined}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="text-xs text-destructive">
                  {t(errors.email.message as string)}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
              {isSubmitting
                ? t("dashboard:profile.submitting")
                : t("dashboard:profile.submitButton")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
