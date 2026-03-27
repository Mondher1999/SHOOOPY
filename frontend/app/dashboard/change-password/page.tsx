"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { AlertCircle, CheckCircle } from "lucide-react";
import { changePasswordAPI } from "@/services/user-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import logger from "@/lib/logger";

const schema = z
  .object({
    currentPassword: z.string().min(1, "dashboard:validation.currentPasswordRequired"),
    newPassword: z
      .string()
      .min(1, "dashboard:validation.newPasswordRequired")
      .min(8, "dashboard:validation.newPasswordMinLength"),
    confirmPassword: z.string().min(1, "dashboard:validation.confirmPasswordRequired"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "dashboard:validation.passwordsMustMatch",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function ChangePasswordPage() {
  const { t } = useTranslation(["dashboard", "common"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setServerError(null);
    setSuccess(false);
    try {
      await changePasswordAPI(values.currentPassword, values.newPassword);
      setSuccess(true);
      reset();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const serverMsg = axiosErr?.response?.data?.error || "";
      const errorMap: Record<string, string> = {
        "Current password is incorrect": t("dashboard:changePassword.errorCurrentPassword"),
        "New password must differ from current password": t("dashboard:changePassword.errorSamePassword"),
      };
      const msg = errorMap[serverMsg] || serverMsg || (err instanceof Error ? err.message : t("common:errors.generic"));
      setServerError(msg);
      logger.error("changePassword failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-polaris-text">{t("dashboard:changePassword.title")}</h1>
        <p className="text-sm text-polaris-text-subdued mt-0.5">
          {t("dashboard:changePassword.subtitle")}
        </p>
      </div>

      <Card className="max-w-md bg-polaris-surface border-polaris-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-polaris-text">{t("dashboard:changePassword.title")}</CardTitle>
          <CardDescription className="text-polaris-text-subdued">{t("dashboard:changePassword.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <Alert className="mb-4 border-green-500 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="ml-2 text-sm">{t("dashboard:changePassword.successMessage")}</p>
            </Alert>
          )}

          {serverError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <p className="ml-2 text-sm">{serverError}</p>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1">
              <Label htmlFor="currentPassword">
                {t("dashboard:changePassword.currentPasswordLabel")}
              </Label>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                {...register("currentPassword")}
                aria-describedby={errors.currentPassword ? "cur-pw-error" : undefined}
                aria-invalid={!!errors.currentPassword}
              />
              {errors.currentPassword && (
                <p id="cur-pw-error" role="alert" className="text-xs text-destructive">
                  {t(errors.currentPassword.message as string)}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="newPassword">
                {t("dashboard:changePassword.newPasswordLabel")}
              </Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                {...register("newPassword")}
                aria-describedby={errors.newPassword ? "new-pw-error" : undefined}
                aria-invalid={!!errors.newPassword}
              />
              {errors.newPassword && (
                <p id="new-pw-error" role="alert" className="text-xs text-destructive">
                  {t(errors.newPassword.message as string)}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword">
                {t("dashboard:changePassword.confirmPasswordLabel")}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...register("confirmPassword")}
                aria-describedby={errors.confirmPassword ? "conf-pw-error" : undefined}
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <p id="conf-pw-error" role="alert" className="text-xs text-destructive">
                  {t(errors.confirmPassword.message as string)}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="min-w-[160px]">
              {isSubmitting
                ? t("dashboard:changePassword.submitting")
                : t("dashboard:changePassword.submitButton")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
