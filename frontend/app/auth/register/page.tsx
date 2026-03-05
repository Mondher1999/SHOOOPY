"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Loader2, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import logger from "@/lib/logger";

const registerSchema = z
  .object({
    name: z.string().min(1, "validation.nameRequired").trim(),
    email: z.string().min(1, "validation.emailRequired").email("validation.emailInvalid"),
    password: z.string().min(8, "validation.passwordMinLength"),
    confirmPassword: z.string().min(1, "validation.confirmPasswordRequired"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "validation.passwordsMustMatch",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 25, label: "strengthWeak", color: "bg-destructive" };
  if (score === 2) return { score: 50, label: "strengthFair", color: "bg-yellow-500" };
  if (score === 3) return { score: 75, label: "strengthGood", color: "bg-blue-500" };
  return { score: 100, label: "strengthStrong", color: "bg-green-500" };
}

export default function RegisterPage() {
  const { t } = useTranslation("auth");
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch("password", "");
  const strength = passwordValue ? getPasswordStrength(passwordValue) : null;

  const onSubmit = async (data: RegisterForm) => {
    setServerError(null);
    try {
      await registerUser(data.name, data.email, data.password);
      setRegisteredEmail(data.email);
    } catch (error: unknown) {
      const message =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setServerError(message || t("validation.emailInvalid"));
      logger.error("Registration failed:", error);
    }
  };

  // Success state — user registered, awaiting email verification
  if (registeredEmail) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <CheckCircle2 className="h-12 w-12 text-green-500" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl text-center">{t("register.successTitle")}</CardTitle>
          <CardDescription className="text-center">
            {t("register.successMessage", { email: registeredEmail })}
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button variant="outline" onClick={() => router.push("/auth/login")}>
            {t("login.signIn")}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">{t("register.title")}</CardTitle>
        <CardDescription>{t("register.subtitle")}</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          {serverError && (
            <Alert variant="destructive" aria-live="polite">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">{t("register.nameLabel")}</Label>
            <Input
              id="name"
              type="text"
              placeholder={t("register.namePlaceholder")}
              autoComplete="name"
              aria-describedby={errors.name ? "name-error" : undefined}
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-destructive" role="alert">
                {t(errors.name.message as string)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("register.emailLabel")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("register.emailPlaceholder")}
              autoComplete="email"
              aria-describedby={errors.email ? "email-error" : undefined}
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive" role="alert">
                {t(errors.email.message as string)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("register.passwordLabel")}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t("register.passwordPlaceholder")}
              autoComplete="new-password"
              aria-describedby={
                errors.password ? "password-error" : strength ? "password-strength" : undefined
              }
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            {strength && (
              <div id="password-strength" aria-live="polite">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{t("register.passwordStrength")}</span>
                  <span className="text-xs font-medium">{t(`register.${strength.label}`)}</span>
                </div>
                <Progress value={strength.score} className={`h-1.5 [&>div]:${strength.color}`} />
              </div>
            )}
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive" role="alert">
                {t(errors.password.message as string)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t("register.confirmPasswordLabel")}</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder={t("register.confirmPasswordPlaceholder")}
              autoComplete="new-password"
              aria-describedby={errors.confirmPassword ? "confirm-error" : undefined}
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p id="confirm-error" className="text-sm text-destructive" role="alert">
                {t(errors.confirmPassword.message as string)}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                {t("register.submitting")}
              </>
            ) : (
              t("register.submitButton")
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t("register.hasAccount")}{" "}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              {t("register.signIn")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
