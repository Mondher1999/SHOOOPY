"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Home, Briefcase, MapPin, Plus, CheckCircle2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { getAddressesAPI, createAddressAPI } from "@/services/address-service";
import logger from "@/lib/logger";
import type { Address } from "@/types";

// ─── Validation schema ────────────────────────────────────────────────────────

const addressSchema = z.object({
  fullName:   z.string().min(2, "checkout:addressForm.fullNameMin"),
  phone:      z.string().min(7, "checkout:addressForm.phoneMin"),
  street:     z.string().min(5, "checkout:addressForm.streetMin"),
  city:       z.string().min(2, "checkout:addressForm.cityMin"),
  state:      z.string().min(2, "checkout:addressForm.stateMin"),
  postalCode: z.string().min(3, "checkout:addressForm.postalCodeMin"),
  country:    z.string().min(2, "checkout:addressForm.countryMin"),
  label:      z.enum(["home", "work", "other"]).default("home"),
});

type AddressFields = z.infer<typeof addressSchema>;

// ─── Label icon helper ────────────────────────────────────────────────────────

function LabelIcon({ label }: { label: string }) {
  if (label === "home") return <Home className="h-4 w-4" aria-hidden="true" />;
  if (label === "work") return <Briefcase className="h-4 w-4" aria-hidden="true" />;
  return <MapPin className="h-4 w-4" aria-hidden="true" />;
}

// ─── Add-new-address inline form ──────────────────────────────────────────────

interface AddressFormProps {
  onCreated: (address: Address) => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

export function AddressForm({ onCreated, onCancel, showCancel = true }: AddressFormProps) {
  const { t } = useTranslation("checkout");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressFields>({
    resolver: zodResolver(addressSchema),
    defaultValues: { label: "home", country: "US" },
  });

  const onSubmit = async (data: AddressFields) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const res = await createAddressAPI(data);
      reset();
      onCreated(res.data);
    } catch (err: unknown) {
      logger.error("AddressForm create error:", err);
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setServerError(msg ?? t("addressForm.errorCreating"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">{t("addressForm.fullName")}</Label>
          <Input
            id="fullName"
            {...register("fullName")}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
            aria-invalid={!!errors.fullName}
          />
          {errors.fullName && (
            <p id="fullName-error" className="text-destructive text-xs" role="alert">
              {t(errors.fullName.message ?? "addressForm.fullNameMin")}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">{t("addressForm.phone")}</Label>
          <Input
            id="phone"
            type="tel"
            {...register("phone")}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            aria-invalid={!!errors.phone}
          />
          {errors.phone && (
            <p id="phone-error" className="text-destructive text-xs" role="alert">
              {t(errors.phone.message ?? "addressForm.phoneMin")}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="street">{t("addressForm.street")}</Label>
        <Input
          id="street"
          {...register("street")}
          aria-describedby={errors.street ? "street-error" : undefined}
          aria-invalid={!!errors.street}
        />
        {errors.street && (
          <p id="street-error" className="text-destructive text-xs" role="alert">
            {t(errors.street.message ?? "addressForm.streetMin")}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="city">{t("addressForm.city")}</Label>
          <Input
            id="city"
            {...register("city")}
            aria-describedby={errors.city ? "city-error" : undefined}
            aria-invalid={!!errors.city}
          />
          {errors.city && (
            <p id="city-error" className="text-destructive text-xs" role="alert">
              {t(errors.city.message ?? "addressForm.cityMin")}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="state">{t("addressForm.state")}</Label>
          <Input
            id="state"
            {...register("state")}
            aria-describedby={errors.state ? "state-error" : undefined}
            aria-invalid={!!errors.state}
          />
          {errors.state && (
            <p id="state-error" className="text-destructive text-xs" role="alert">
              {t(errors.state.message ?? "addressForm.stateMin")}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="postalCode">{t("addressForm.postalCode")}</Label>
          <Input
            id="postalCode"
            {...register("postalCode")}
            aria-describedby={errors.postalCode ? "postalCode-error" : undefined}
            aria-invalid={!!errors.postalCode}
          />
          {errors.postalCode && (
            <p id="postalCode-error" className="text-destructive text-xs" role="alert">
              {t(errors.postalCode.message ?? "addressForm.postalCodeMin")}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="country">{t("addressForm.country")}</Label>
          <Input
            id="country"
            {...register("country")}
            aria-describedby={errors.country ? "country-error" : undefined}
            aria-invalid={!!errors.country}
          />
          {errors.country && (
            <p id="country-error" className="text-destructive text-xs" role="alert">
              {t(errors.country.message ?? "addressForm.countryMin")}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="label">{t("addressForm.label")}</Label>
          <select
            id="label"
            {...register("label")}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="home">{t("addressForm.labelHome")}</option>
            <option value="work">{t("addressForm.labelWork")}</option>
            <option value="other">{t("addressForm.labelOther")}</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />}
          {t("addressForm.save")}
        </Button>
        {showCancel && onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("common:actions.cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}

// ─── AddressSelector ──────────────────────────────────────────────────────────

interface AddressSelectorProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function AddressSelector({ selectedId, onSelect }: AddressSelectorProps) {
  const { t } = useTranslation("checkout");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAddressesAPI();
      setAddresses(res.data);
      // Auto-select the default address if nothing is selected yet
      if (!selectedId) {
        const def = res.data.find((a) => a.isDefault) ?? res.data[0];
        if (def) onSelect(def.id);
      }
    } catch (err) {
      logger.error("AddressSelector load error:", err);
      setError(t("addressSelector.errorLoading"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreated = (address: Address) => {
    setAddresses((prev) => [address, ...prev]);
    onSelect(address.id);
    setShowForm(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription className="flex items-center justify-between">
          {error}
          <Button variant="outline" size="sm" onClick={load} className="ml-4">
            {t("common:actions.retry", "Retry")}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3" role="radiogroup" aria-label={t("addressSelector.title")}>
      {addresses.map((address) => {
        const isSelected = selectedId === address.id;
        return (
          <button
            key={address.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(address.id)}
            className={cn(
              "w-full text-left rounded-lg border-2 p-4 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <LabelIcon label={address.label} />
                  <span className="font-medium text-sm capitalize">{address.label}</span>
                  {address.isDefault && (
                    <Badge variant="secondary" className="text-xs">
                      {t("addressSelector.default")}
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-semibold">{address.fullName}</p>
                <p className="text-sm text-muted-foreground">{address.phone}</p>
                <p className="text-sm text-muted-foreground">
                  {address.street}, {address.city}, {address.state} {address.postalCode}
                </p>
                <p className="text-sm text-muted-foreground">{address.country}</p>
              </div>
              {isSelected && (
                <CheckCircle2
                  className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              )}
            </div>
          </button>
        );
      })}

      {/* No saved addresses: show inline form immediately */}
      {addresses.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm mb-4">{t("addressSelector.noAddresses")}</p>
            <AddressForm onCreated={handleCreated} showCancel={false} />
          </CardContent>
        </Card>
      )}

      {/* Has saved addresses: show "Add new" button or inline form */}
      {addresses.length > 0 && (
        !showForm ? (
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            {t("addressSelector.addNew")}
          </Button>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">{t("addressSelector.newAddressTitle")}</h3>
              <AddressForm
                onCreated={handleCreated}
                onCancel={() => setShowForm(false)}
                showCancel
              />
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
