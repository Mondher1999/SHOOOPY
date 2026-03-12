"use client";

import { useState, useEffect, useCallback, useRef, type DragEvent } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { AlertCircle, Plus, Trash2, Send, ChevronDown, GripVertical, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { getSettingsAPI, updateSettingsAPI, uploadSettingsFileAPI, sendTestEmailAPI } from "@/services/settings-service";
import { useSettings } from "@/contexts/SettingsContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import logger from "@/lib/logger";
import type { SiteSettings, HomepageSlide, HomepageSectionKey, ThemeConfig, TestimonialItem, TrustBarItem, ValuePropositionItem, PartnerItem, InstagramImage, TypographySettings, ColorPaletteSettings, HeaderVariant, FooterVariant } from "@/types";
import { THEMES, getThemeIds, getTheme } from "@/components/home/HomepageSections";
import { CURRENCIES, getCurrency } from "@/lib/currency";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// Maps each homepage theme to the header & footer variant that matches its visual identity.
// "classic" uses hardcoded Omega layout; all others use dynamic mode.
const THEME_LAYOUT_MAP: Record<string, { header: { variant: HeaderVariant; mode: "dynamic" | "hardcoded" }; footer: { variant: FooterVariant; mode: "dynamic" | "hardcoded" } }> = {
  classic:  { header: { variant: "classic",  mode: "hardcoded" }, footer: { variant: "luxury",   mode: "hardcoded" } },
  bold:     { header: { variant: "bold",     mode: "dynamic"   }, footer: { variant: "bold",     mode: "dynamic"   } },
  artisan:  { header: { variant: "artisan",  mode: "dynamic"   }, footer: { variant: "artisan",  mode: "dynamic"   } },
  magazine: { header: { variant: "magazine", mode: "dynamic"   }, footer: { variant: "magazine", mode: "dynamic"   } },
  zen:      { header: { variant: "zen",      mode: "dynamic"   }, footer: { variant: "zen",      mode: "dynamic"   } },
  playful:  { header: { variant: "playful",  mode: "dynamic"   }, footer: { variant: "playful",  mode: "dynamic"   } },
  tech:     { header: { variant: "tech",     mode: "dynamic"   }, footer: { variant: "tech",     mode: "dynamic"   } },
  elegant:  { header: { variant: "elegant",  mode: "dynamic"   }, footer: { variant: "elegant",  mode: "dynamic"   } },
  minimal:  { header: { variant: "minimal",  mode: "dynamic"   }, footer: { variant: "minimal",  mode: "dynamic"   } },
};

const inputClasses = cn(
  "w-full h-9 px-3 text-sm rounded border border-[#C9CCCF] bg-polaris-surface text-polaris-text",
  "placeholder:text-polaris-text-subdued",
  "focus:outline-none focus:ring-1 focus:ring-polaris-primary focus:border-polaris-primary"
);

const textareaClasses = cn(
  "w-full px-3 py-2 text-sm rounded border border-[#C9CCCF] bg-polaris-surface text-polaris-text",
  "placeholder:text-polaris-text-subdued resize-y min-h-[120px]",
  "focus:outline-none focus:ring-1 focus:ring-polaris-primary focus:border-polaris-primary"
);

const selectClasses = inputClasses;

const sectionClasses = "bg-polaris-surface border border-polaris-border rounded-lg shadow-polaris p-6";

interface SaveButtonProps {
  onClick: () => void;
  isSaving: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function SaveButton({ onClick, isSaving, t }: SaveButtonProps) {
  return (
    <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 px-6 py-3 bg-polaris-surface border-t border-polaris-border flex justify-end rounded-b-lg z-10">
      <button
        type="button"
        onClick={onClick}
        disabled={isSaving}
        className="px-5 py-2 text-sm font-medium rounded bg-polaris-primary text-white hover:bg-polaris-primary-hovered disabled:opacity-50 transition-colors cursor-pointer"
      >
        {isSaving ? t("common:actions.saving") : t("common:actions.save")}
      </button>
    </div>
  );
}

interface FieldProps {
  label: string;
  help?: string;
  children: React.ReactNode;
}

function Field({ label, help, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-polaris-text">{label}</Label>
      {children}
      {help && <p className="text-xs text-polaris-text-subdued">{help}</p>}
    </div>
  );
}

interface ToggleFieldProps {
  label: string;
  help: string;
  checked: boolean;
  onCheckedChange: (val: boolean) => void;
  id: string;
}

function ToggleField({ label, help, checked, onCheckedChange, id }: ToggleFieldProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-polaris-border last:border-0">
      <div className="space-y-0.5 pr-4">
        <Label htmlFor={id} className="text-sm font-medium text-polaris-text cursor-pointer">
          {label}
        </Label>
        <p className="text-xs text-polaris-text-subdued">{help}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export default function AdminSettingsPage() {
  const { t } = useTranslation(["admin", "common"]);
  const { toast } = useToast();
  const { update: updateGlobalSettings } = useSettings();

  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingTab, setSavingTab] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getSettingsAPI();
      setSettings(res.data);
    } catch (err) {
      logger.error("fetchSettings failed:", err);
      setError(t("admin:settings.error"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSection = async (section: string, data: object) => {
    setSavingTab(section);
    try {
      const res = await updateSettingsAPI({ [section]: data } as Parameters<typeof updateSettingsAPI>[0]);
      setSettings(res.data);
      updateGlobalSettings(res.data); // Propagates to HeaderSwitcher / FooterSwitcher immediately
      toast({ title: t("admin:settings.saved") });
    } catch (err) {
      logger.error("saveSettings failed:", err);
      toast({ title: t("admin:settings.saveError"), variant: "destructive" });
    } finally {
      setSavingTab(null);
    }
  };

  // Saves homepage settings and auto-syncs header/footer to match the selected theme.
  const saveHomepageWithLayout = async (homepageData: object) => {
    setSavingTab("homepage");
    try {
      const template = (homepageData as { template?: string }).template;
      const layoutSync = template ? THEME_LAYOUT_MAP[template] : undefined;

      const payload: Parameters<typeof updateSettingsAPI>[0] = { homepage: homepageData as Parameters<typeof updateSettingsAPI>[0]["homepage"] };
      if (layoutSync) {
        payload.header = layoutSync.header;
        payload.footer = layoutSync.footer;
      }

      const res = await updateSettingsAPI(payload);
      setSettings(res.data);
      updateGlobalSettings(res.data); // Propagates to HeaderSwitcher / FooterSwitcher immediately
      toast({ title: layoutSync ? t("admin:settings.homepage.themeSaved") : t("admin:settings.saved") });
    } catch (err) {
      logger.error("saveSettings failed:", err);
      toast({ title: t("admin:settings.saveError"), variant: "destructive" });
    } finally {
      setSavingTab(null);
    }
  };

  // ── Loading Skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-5">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64 mt-1" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // ── Error State ───────────────────────────────────────────────────────────
  if (error || !settings) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-polaris-text">{t("admin:settings.title")}</h1>
        </div>
        <div className="bg-polaris-critical-light border border-polaris-critical/20 rounded-lg p-4 flex items-center gap-2 text-sm text-polaris-critical" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error || t("admin:settings.error")}
          <button onClick={fetchSettings} className="ml-auto text-sm underline cursor-pointer">
            {t("common:actions.retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-polaris-text">{t("admin:settings.title")}</h1>
        <p className="text-sm text-polaris-text-subdued mt-0.5">{t("admin:settings.subtitle")}</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="store" className="space-y-4">
        <TabsList className="bg-polaris-surface border border-polaris-border rounded-lg p-2 h-auto flex flex-wrap items-center gap-1">
          {/* General */}
          {["store", "orders", "products"].map((tab) => (
            <TabsTrigger key={tab} value={tab} className="px-3 py-1.5 text-sm rounded data-[state=active]:bg-polaris-primary data-[state=active]:text-white text-polaris-text-subdued hover:text-polaris-text transition-colors">
              {t(`admin:settings.tabs.${tab}`)}
            </TabsTrigger>
          ))}
          <span className="mx-1 h-5 w-px bg-polaris-border-subdued" aria-hidden="true" />
          {/* Communication */}
          {["email", "emailTemplates", "smtp"].map((tab) => (
            <TabsTrigger key={tab} value={tab} className="px-3 py-1.5 text-sm rounded data-[state=active]:bg-polaris-primary data-[state=active]:text-white text-polaris-text-subdued hover:text-polaris-text transition-colors">
              {t(`admin:settings.tabs.${tab}`)}
            </TabsTrigger>
          ))}
          <span className="mx-1 h-5 w-px bg-polaris-border-subdued" aria-hidden="true" />
          {/* Branding & SEO */}
          {["social", "legal", "seo"].map((tab) => (
            <TabsTrigger key={tab} value={tab} className="px-3 py-1.5 text-sm rounded data-[state=active]:bg-polaris-primary data-[state=active]:text-white text-polaris-text-subdued hover:text-polaris-text transition-colors">
              {t(`admin:settings.tabs.${tab}`)}
            </TabsTrigger>
          ))}
          <span className="mx-1 h-5 w-px bg-polaris-border-subdued" aria-hidden="true" />
          {/* Appearance */}
          {["layout", "homepage", "typography", "colors"].map((tab) => (
            <TabsTrigger key={tab} value={tab} className="px-3 py-1.5 text-sm rounded data-[state=active]:bg-polaris-primary data-[state=active]:text-white text-polaris-text-subdued hover:text-polaris-text transition-colors">
              {t(`admin:settings.tabs.${tab}`)}
            </TabsTrigger>
          ))}
          <span className="mx-1 h-5 w-px bg-polaris-border-subdued" aria-hidden="true" />
          {/* System */}
          {["maintenance"].map((tab) => (
            <TabsTrigger key={tab} value={tab} className="px-3 py-1.5 text-sm rounded data-[state=active]:bg-polaris-primary data-[state=active]:text-white text-polaris-text-subdued hover:text-polaris-text transition-colors">
              {t(`admin:settings.tabs.${tab}`)}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Store Tab ────────────────────────────────────────────────────── */}
        <TabsContent value="store">
          <StoreTab settings={settings} onSave={(data) => saveSection("store", data)} isSaving={savingTab === "store"} t={t} />
        </TabsContent>

        {/* ── Orders Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="orders">
          <OrdersTab settings={settings} onSave={(data) => saveSection("orders", data)} isSaving={savingTab === "orders"} t={t} />
        </TabsContent>

        {/* ── Products Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="products">
          <ProductsTab settings={settings} onSave={(data) => saveSection("products", data)} isSaving={savingTab === "products"} t={t} />
        </TabsContent>

        {/* ── Email Tab ────────────────────────────────────────────────────── */}
        <TabsContent value="email">
          <EmailTab settings={settings} onSave={(data) => saveSection("notifications", data)} isSaving={savingTab === "notifications"} t={t} />
        </TabsContent>

        {/* ── Social Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="social">
          <SocialTab settings={settings} onSave={(data) => saveSection("social", data)} isSaving={savingTab === "social"} t={t} />
        </TabsContent>

        {/* ── Legal Tab ────────────────────────────────────────────────────── */}
        <TabsContent value="legal">
          <LegalTab settings={settings} onSave={(data) => saveSection("legal", data)} isSaving={savingTab === "legal"} t={t} />
        </TabsContent>

        {/* ── SEO Tab ──────────────────────────────────────────────────────── */}
        <TabsContent value="seo">
          <SEOTab settings={settings} onSave={(data) => saveSection("seo", data)} isSaving={savingTab === "seo"} t={t} />
        </TabsContent>

        {/* ── Maintenance Tab ────────────────────────────────────────────── */}
        <TabsContent value="maintenance">
          <MaintenanceTab settings={settings} onSave={(data) => saveSection("maintenance", data)} isSaving={savingTab === "maintenance"} t={t} />
        </TabsContent>

        {/* ── Layout Tab (Header & Footer) ────────────────────────────── */}
        <TabsContent value="layout">
          <LayoutTab key={settings.updatedAt} settings={settings} onSave={saveSection} isSaving={savingTab} t={t} />
        </TabsContent>

        {/* ── Homepage Tab ───────────────────────────────────────────────── */}
        <TabsContent value="homepage">
          <HomepageTab key={settings.updatedAt} settings={settings} onSave={saveHomepageWithLayout} isSaving={savingTab === "homepage"} t={t} onRefresh={fetchSettings} />
        </TabsContent>

        {/* ── Typography Tab ────────────────────────────────────────── */}
        <TabsContent value="typography">
          <TypographyTab settings={settings} onSave={(data) => saveSection("typography", data)} isSaving={savingTab === "typography"} t={t} />
        </TabsContent>

        {/* ── Colors Tab ──────────────────────────────────────────── */}
        <TabsContent value="colors">
          <ColorsTab settings={settings} onSave={(data) => saveSection("colorPalette", data)} isSaving={savingTab === "colorPalette"} t={t} />
        </TabsContent>

        {/* ── Email Templates Tab ────────────────────────────────────────── */}
        <TabsContent value="emailTemplates">
          <EmailTemplatesTab settings={settings} onSave={(data) => saveSection("emailTemplates", data)} isSaving={savingTab === "emailTemplates"} t={t} />
        </TabsContent>

        {/* ── SMTP Tab ───────────────────────────────────────────────────── */}
        <TabsContent value="smtp">
          <SmtpTab settings={settings} onSave={(data) => saveSection("smtp", data)} isSaving={savingTab === "smtp"} t={t} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab Components
// ═══════════════════════════════════════════════════════════════════════════════

interface TabProps {
  settings: SiteSettings;
  onSave: (data: object) => Promise<void>;
  isSaving: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function StoreTab({ settings, onSave, isSaving, t }: TabProps) {
  const { toast } = useToast();
  const [form, setForm] = useState(() => ({
    ...settings.store,
    currency: getCurrency(settings.store.currency || "USD").code,
    logoEnabled: settings.store.logoEnabled ?? true,
  }));
  const [logoMode, setLogoMode] = useState<"url" | "upload">("url");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const set = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleLogoUpload = async (file: File) => {
    setIsUploadingLogo(true);
    try {
      const res = await uploadSettingsFileAPI(file, "logo");
      // Backend returns full SiteSettings when field is "logo"
      const url = "store" in res.data ? (res.data as { store: { logo: string } }).store.logo : "";
      if (url) setForm((prev) => ({ ...prev, logo: url }));
    } catch {
      toast({ title: t("admin:settings.saveError"), variant: "destructive" });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  return (
    <div className={cn(sectionClasses, "space-y-4")}>
      <Field label={t("admin:settings.store.nameLabel")}>
        <input className={inputClasses} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={t("admin:settings.store.namePlaceholder")} />
      </Field>
      <Field label={t("admin:settings.store.descriptionLabel")}>
        <input className={inputClasses} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder={t("admin:settings.store.descriptionPlaceholder")} />
      </Field>

      {/* ── Logo ── */}
      <div className="space-y-3 pb-3 border-b border-polaris-border">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-polaris-text">
            {t("admin:settings.store.logoLabel", { defaultValue: "Logo de la boutique" })}
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-polaris-text-subdued">
              {form.logoEnabled
                ? t("admin:settings.store.logoEnabled", { defaultValue: "Affiché" })
                : t("admin:settings.store.logoDisabled", { defaultValue: "Masqué" })}
            </span>
            <Switch
              id="logo-enabled"
              checked={form.logoEnabled}
              onCheckedChange={(val) => setForm((prev) => ({ ...prev, logoEnabled: val }))}
            />
          </div>
        </div>

        {/* Preview */}
        {form.logo && (
          <div className="flex items-center gap-3 p-3 rounded border border-polaris-border bg-polaris-bg">
            <img src={form.logo} alt="logo preview" className="h-10 w-auto max-w-[120px] object-contain rounded" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-polaris-text-subdued truncate">{form.logo}</p>
            </div>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, logo: "" }))}
              className="text-xs text-red-500 hover:text-red-700 shrink-0"
            >
              {t("common:actions.remove", { defaultValue: "Supprimer" })}
            </button>
          </div>
        )}

        {/* Mode tabs */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setLogoMode("url")}
            className={cn("px-3 py-1.5 text-xs rounded border transition-colors", logoMode === "url" ? "bg-polaris-primary text-white border-polaris-primary" : "border-polaris-border text-polaris-text-subdued hover:text-polaris-text")}
          >
            {t("admin:settings.store.logoByUrl", { defaultValue: "Par URL" })}
          </button>
          <button
            type="button"
            onClick={() => setLogoMode("upload")}
            className={cn("px-3 py-1.5 text-xs rounded border transition-colors", logoMode === "upload" ? "bg-polaris-primary text-white border-polaris-primary" : "border-polaris-border text-polaris-text-subdued hover:text-polaris-text")}
          >
            {t("admin:settings.store.logoByUpload", { defaultValue: "Téléverser" })}
          </button>
        </div>

        {logoMode === "url" ? (
          <input
            className={inputClasses}
            value={form.logo}
            onChange={(e) => set("logo", e.target.value)}
            placeholder="https://example.com/logo.png"
          />
        ) : (
          <div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }}
            />
            <button
              type="button"
              disabled={isUploadingLogo}
              onClick={() => logoInputRef.current?.click()}
              className="px-4 py-2 text-sm rounded border border-polaris-border text-polaris-text hover:bg-polaris-surface-hovered transition-colors disabled:opacity-50"
            >
              {isUploadingLogo
                ? t("admin:settings.store.logoUploading", { defaultValue: "Téléversement..." })
                : t("admin:settings.store.logoUploadBtn", { defaultValue: "Choisir une image" })}
            </button>
            <p className="text-xs text-polaris-text-subdued mt-1">
              {t("admin:settings.store.logoUploadHelp", { defaultValue: "PNG, JPG, SVG — max 2 Mo" })}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t("admin:settings.store.contactEmailLabel")}>
          <input className={inputClasses} type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} placeholder={t("admin:settings.store.contactEmailPlaceholder")} />
        </Field>
        <Field label={t("admin:settings.store.contactPhoneLabel")}>
          <input className={inputClasses} value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder={t("admin:settings.store.contactPhonePlaceholder")} />
        </Field>
      </div>
      <Field label={t("admin:settings.store.addressLabel")}>
        <input className={inputClasses} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder={t("admin:settings.store.addressPlaceholder")} />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t("admin:settings.store.currencyLabel")}>
          <select className={selectClasses} value={form.currency} onChange={(e) => set("currency", e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} — {c.name} ({c.code})
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("admin:settings.store.timezoneLabel")}>
          <input className={inputClasses} value={form.timezone} onChange={(e) => set("timezone", e.target.value)} placeholder={t("admin:settings.store.timezonePlaceholder")} />
        </Field>
      </div>
      <ToggleField
        id="showcase-mode"
        label={t("admin:settings.store.showcaseModeLabel", { defaultValue: "Showcase Mode" })}
        help={t("admin:settings.store.showcaseModeHelp", { defaultValue: "Disable all e-commerce features (prices, cart, checkout). The site becomes a product showcase only." })}
        checked={form.showcaseMode ?? false}
        onCheckedChange={(val) => setForm((prev) => ({ ...prev, showcaseMode: val }))}
      />
      <SaveButton onClick={() => onSave(form)} isSaving={isSaving} t={t} />
    </div>
  );
}

function OrdersTab({ settings, onSave, isSaving, t }: TabProps) {
  const [form, setForm] = useState(settings.orders);
  const set = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: parseFloat(val) || 0 }));

  return (
    <div className={cn(sectionClasses, "space-y-4")}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t("admin:settings.orders.shippingCostLabel")} help={t("admin:settings.orders.shippingCostHelp")}>
          <input className={inputClasses} type="number" min="0" step="0.01" value={form.defaultShippingCost} onChange={(e) => set("defaultShippingCost", e.target.value)} />
        </Field>
        <Field label={t("admin:settings.orders.minimumOrderLabel")} help={t("admin:settings.orders.minimumOrderHelp")}>
          <input className={inputClasses} type="number" min="0" step="0.01" value={form.minimumOrderAmount} onChange={(e) => set("minimumOrderAmount", e.target.value)} />
        </Field>
        <Field label={t("admin:settings.orders.freeShippingLabel")} help={t("admin:settings.orders.freeShippingHelp")}>
          <input className={inputClasses} type="number" min="0" step="0.01" value={form.freeShippingThreshold} onChange={(e) => set("freeShippingThreshold", e.target.value)} />
        </Field>
        <Field label={t("admin:settings.orders.autoCancelLabel")} help={t("admin:settings.orders.autoCancelHelp")}>
          <input className={inputClasses} type="number" min="0" step="1" value={form.autoCancelPendingDays} onChange={(e) => set("autoCancelPendingDays", e.target.value)} />
        </Field>
      </div>
      <SaveButton onClick={() => onSave(form)} isSaving={isSaving} t={t} />
    </div>
  );
}

function ProductsTab({ settings, onSave, isSaving, t }: TabProps) {
  const [form, setForm] = useState(settings.products);

  return (
    <div className={cn(sectionClasses, "space-y-4")}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t("admin:settings.products.lowStockLabel")} help={t("admin:settings.products.lowStockHelp")}>
          <input className={inputClasses} type="number" min="1" value={form.lowStockThreshold} onChange={(e) => setForm((prev) => ({ ...prev, lowStockThreshold: parseInt(e.target.value) || 1 }))} />
        </Field>
        <Field label={t("admin:settings.products.maxImagesLabel")} help={t("admin:settings.products.maxImagesHelp")}>
          <input className={inputClasses} type="number" min="1" max="20" value={form.maxImagesPerProduct} onChange={(e) => setForm((prev) => ({ ...prev, maxImagesPerProduct: parseInt(e.target.value) || 1 }))} />
        </Field>
      </div>
      <Field label={t("admin:settings.products.defaultSortLabel")}>
        <select className={selectClasses} value={form.defaultSortOrder} onChange={(e) => setForm((prev) => ({ ...prev, defaultSortOrder: e.target.value as typeof prev.defaultSortOrder }))}>
          <option value="newest">{t("admin:settings.products.sortNewest")}</option>
          <option value="price_asc">{t("admin:settings.products.sortPriceAsc")}</option>
          <option value="price_desc">{t("admin:settings.products.sortPriceDesc")}</option>
          <option value="rating">{t("admin:settings.products.sortRating")}</option>
        </select>
      </Field>
      <ToggleField
        id="reviews-enabled"
        label={t("admin:settings.products.reviewsLabel")}
        help={t("admin:settings.products.reviewsHelp")}
        checked={form.reviewsEnabled}
        onCheckedChange={(val) => setForm((prev) => ({ ...prev, reviewsEnabled: val }))}
      />
      <SaveButton onClick={() => onSave(form)} isSaving={isSaving} t={t} />
    </div>
  );
}

function EmailTab({ settings, onSave, isSaving, t }: TabProps) {
  const [form, setForm] = useState(settings.notifications);

  return (
    <div className={cn(sectionClasses, "space-y-0")}>
      <ToggleField id="order-confirmation" label={t("admin:settings.email.orderConfirmationLabel")} help={t("admin:settings.email.orderConfirmationHelp")} checked={form.orderConfirmation} onCheckedChange={(val) => setForm((prev) => ({ ...prev, orderConfirmation: val }))} />
      <ToggleField id="order-status" label={t("admin:settings.email.orderStatusLabel")} help={t("admin:settings.email.orderStatusHelp")} checked={form.orderStatusUpdate} onCheckedChange={(val) => setForm((prev) => ({ ...prev, orderStatusUpdate: val }))} />
      <ToggleField id="welcome-email" label={t("admin:settings.email.welcomeLabel")} help={t("admin:settings.email.welcomeHelp")} checked={form.welcomeEmail} onCheckedChange={(val) => setForm((prev) => ({ ...prev, welcomeEmail: val }))} />
      <ToggleField id="admin-new-order" label={t("admin:settings.email.adminNewOrderLabel")} help={t("admin:settings.email.adminNewOrderHelp")} checked={form.adminNewOrder} onCheckedChange={(val) => setForm((prev) => ({ ...prev, adminNewOrder: val }))} />
      <ToggleField id="admin-low-stock" label={t("admin:settings.email.adminLowStockLabel")} help={t("admin:settings.email.adminLowStockHelp")} checked={form.adminLowStock} onCheckedChange={(val) => setForm((prev) => ({ ...prev, adminLowStock: val }))} />
      <div className="pt-4">
        <Field label={t("admin:settings.email.adminEmailLabel")} help={t("admin:settings.email.adminEmailHelp")}>
          <input className={inputClasses} type="email" value={form.adminNotificationEmail} onChange={(e) => setForm((prev) => ({ ...prev, adminNotificationEmail: e.target.value }))} placeholder={t("admin:settings.email.adminEmailPlaceholder")} />
        </Field>
      </div>
      <SaveButton onClick={() => onSave(form)} isSaving={isSaving} t={t} />
    </div>
  );
}

function SocialTab({ settings, onSave, isSaving, t }: TabProps) {
  const [form, setForm] = useState(settings.social);
  const set = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <div className={cn(sectionClasses, "space-y-4")}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t("admin:settings.social.facebookLabel")}>
          <input className={inputClasses} value={form.facebook} onChange={(e) => set("facebook", e.target.value)} placeholder={t("admin:settings.social.facebookPlaceholder")} />
        </Field>
        <Field label={t("admin:settings.social.instagramLabel")}>
          <input className={inputClasses} value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder={t("admin:settings.social.instagramPlaceholder")} />
        </Field>
        <Field label={t("admin:settings.social.twitterLabel")}>
          <input className={inputClasses} value={form.twitter} onChange={(e) => set("twitter", e.target.value)} placeholder={t("admin:settings.social.twitterPlaceholder")} />
        </Field>
        <Field label={t("admin:settings.social.tiktokLabel")}>
          <input className={inputClasses} value={form.tiktok} onChange={(e) => set("tiktok", e.target.value)} placeholder={t("admin:settings.social.tiktokPlaceholder")} />
        </Field>
        <Field label={t("admin:settings.social.youtubeLabel")}>
          <input className={inputClasses} value={form.youtube} onChange={(e) => set("youtube", e.target.value)} placeholder={t("admin:settings.social.youtubePlaceholder")} />
        </Field>
        <Field label={t("admin:settings.social.whatsappLabel")}>
          <input className={inputClasses} value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder={t("admin:settings.social.whatsappPlaceholder")} />
        </Field>
      </div>
      <SaveButton onClick={() => onSave(form)} isSaving={isSaving} t={t} />
    </div>
  );
}

function LegalTab({ settings, onSave, isSaving, t }: TabProps) {
  const [form, setForm] = useState(settings.legal);
  const set = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  const legalFields = [
    { key: "termsAndConditions", label: t("admin:settings.legal.termsLabel") },
    { key: "privacyPolicy", label: t("admin:settings.legal.privacyLabel") },
    { key: "returnPolicy", label: t("admin:settings.legal.returnLabel") },
    { key: "shippingPolicy", label: t("admin:settings.legal.shippingLabel") },
  ] as const;

  return (
    <div className={cn(sectionClasses, "space-y-6")}>
      <p className="text-xs text-polaris-text-subdued">{t("admin:settings.legal.editorHelp")}</p>
      {legalFields.map((field) => (
        <Field key={field.key} label={field.label}>
          <textarea
            className={textareaClasses}
            rows={8}
            value={form[field.key]}
            onChange={(e) => set(field.key, e.target.value)}
          />
        </Field>
      ))}
      <SaveButton onClick={() => onSave(form)} isSaving={isSaving} t={t} />
    </div>
  );
}

function SEOTab({ settings, onSave, isSaving, t }: TabProps) {
  const [form, setForm] = useState(settings.seo);
  const set = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <div className={cn(sectionClasses, "space-y-4")}>
      <Field label={t("admin:settings.seo.metaTitleLabel")} help={t("admin:settings.seo.metaTitleHelp")}>
        <input className={inputClasses} value={form.metaTitleTemplate} onChange={(e) => set("metaTitleTemplate", e.target.value)} placeholder={t("admin:settings.seo.metaTitlePlaceholder")} />
      </Field>
      <Field label={t("admin:settings.seo.metaDescriptionLabel")}>
        <textarea className={textareaClasses} rows={3} value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} placeholder={t("admin:settings.seo.metaDescriptionPlaceholder")} />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t("admin:settings.seo.gaIdLabel")}>
          <input className={inputClasses} value={form.googleAnalyticsId} onChange={(e) => set("googleAnalyticsId", e.target.value)} placeholder={t("admin:settings.seo.gaIdPlaceholder")} />
        </Field>
        <Field label={t("admin:settings.seo.fbPixelLabel")}>
          <input className={inputClasses} value={form.facebookPixelId} onChange={(e) => set("facebookPixelId", e.target.value)} placeholder={t("admin:settings.seo.fbPixelPlaceholder")} />
        </Field>
      </div>
      <SaveButton onClick={() => onSave(form)} isSaving={isSaving} t={t} />
    </div>
  );
}

// ─── Maintenance Tab ───────────────────────────────────────────────────────────

function MaintenanceTab({ settings, onSave, isSaving, t }: TabProps) {
  const [form, setForm] = useState(settings.maintenance ?? { enabled: false, message: "" });

  return (
    <div className={cn(sectionClasses, "space-y-4")}>
      <ToggleField
        id="maintenance-enabled"
        label={t("admin:settings.maintenance.enabledLabel")}
        help={t("admin:settings.maintenance.enabledHelp")}
        checked={form.enabled}
        onCheckedChange={(val) => setForm((prev) => ({ ...prev, enabled: val }))}
      />
      <Field label={t("admin:settings.maintenance.messageLabel")} help={t("admin:settings.maintenance.messageHelp")}>
        <textarea
          className={textareaClasses}
          rows={4}
          value={form.message}
          onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
          placeholder={t("admin:settings.maintenance.messagePlaceholder")}
        />
      </Field>
      <SaveButton onClick={() => onSave(form)} isSaving={isSaving} t={t} />
    </div>
  );
}

// ─── Homepage Tab ──────────────────────────────────────────────────────────────

interface HomepageTabProps extends TabProps {
  onRefresh: () => Promise<void>;
}

// Theme-aware: use THEMES registry from HomepageSections for default orders
function getDefaultOrderForTheme(themeId: string): HomepageSectionKey[] {
  return [...getTheme(themeId).defaultOrder];
}
function getValidKeysForTheme(themeId: string): Set<HomepageSectionKey> {
  return new Set(getTheme(themeId).defaultOrder);
}

const EMPTY_SLIDE: HomepageSlide = { title: "", subtitle: "", ctaText: "Shop Now", ctaLink: "/products", imageUrl: "", type: "image", videoUrl: "", posterUrl: "" };
const EMPTY_TESTIMONIAL: TestimonialItem = { name: "", quote: "", location: "", rating: 5, avatar: "" };
const EMPTY_TRUST_ITEM: TrustBarItem = { icon: "Shield", title: "", description: "" };
const EMPTY_VP_ITEM: ValuePropositionItem = { icon: "Shield", title: "", description: "" };
const EMPTY_PARTNER: PartnerItem = { imageUrl: "", link: "", name: "" };
const EMPTY_IG_IMAGE: InstagramImage = { url: "", link: "" };

const ICON_OPTIONS = [
  { value: "Truck", label: "Truck (Shipping)" },
  { value: "Shield", label: "Shield (Security)" },
  { value: "RotateCcw", label: "Return (Returns)" },
  { value: "Headphones", label: "Headphones (Support)" },
  { value: "Leaf", label: "Leaf (Eco)" },
  { value: "Gem", label: "Gem (Quality)" },
  { value: "Package", label: "Package (Delivery)" },
  { value: "Zap", label: "Zap (Fast)" },
  { value: "Heart", label: "Heart (Love)" },
  { value: "Star", label: "Star (Rating)" },
  { value: "Clock", label: "Clock (Time)" },
  { value: "Award", label: "Award (Excellence)" },
  { value: "CheckCircle", label: "Check (Verified)" },
  { value: "ThumbsUp", label: "Thumbs Up (Approval)" },
  { value: "Lock", label: "Lock (Privacy)" },
  { value: "CreditCard", label: "Card (Payment)" },
];

interface CollapsibleProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Collapsible({ title, defaultOpen = false, children }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-polaris-border rounded-lg">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-polaris-text hover:bg-polaris-surface-hovered transition-colors cursor-pointer"
      >
        {title}
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="px-4 pb-4 space-y-4 border-t border-polaris-border pt-4">{children}</div>}
    </div>
  );
}

// ─── Layout Tab (Header & Footer) ────────────────────────────────────────────

interface LayoutTabProps {
  settings: SiteSettings;
  onSave: (section: string, data: object) => Promise<void>;
  isSaving: string | null;
  t: (key: string, options?: Record<string, unknown>) => string;
}

/* ── Omega Ω SVG (shared between header & footer previews) ── */
const OmegaSVG = ({ size = 10 }: { size?: number }) => (
  <svg viewBox="0 0 200 200" style={{ height: size, width: "auto" }} aria-hidden="true">
    <path d="M40 170V150h25C45 135 30 110 30 82c0-37 30-67 70-67s70 30 70 67c0 28-15 53-35 68h25v20h-50v-20h10c15-12 25-38 25-68 0-24-20-44-45-44S55 58 55 82c0 30 10 56 25 68h10v20H40z" fill="#FF6A00"/>
  </svg>
);

/* ── Header mini-preview components ── */
function HeaderPreviewOmega() {
  return (
    <div className="w-full h-24 rounded-md overflow-hidden border border-black/10 bg-white flex flex-col">
      {/* Header bar */}
      <div className="h-5 bg-white flex items-center justify-between px-2 border-b border-gray-100">
        <div className="flex gap-1">
          <div className="w-4 h-1 rounded-full bg-gray-200" />
          <div className="w-4 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-center gap-[2px]">
          <OmegaSVG size={8} />
          <span className="text-[4px] font-bold italic" style={{ color: "#FF6A00" }}>Omega</span>
          <span className="text-[4px] font-light italic" style={{ color: "#5A6A7A" }}>Distribution</span>
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#FF6A00" }} />
        </div>
      </div>
      {/* Content placeholder */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-[4px] text-gray-300">Mega Menu &middot; Search &middot; Cart</div>
      </div>
      {/* Footer hint */}
      <div className="h-3" style={{ backgroundColor: "#5A6A7A" }} />
    </div>
  );
}

function HeaderPreviewClassic() {
  return (
    <div className="w-full h-24 rounded-md overflow-hidden border border-black/10 bg-white flex flex-col">
      {/* Classic: nav left | logo center | icons right */}
      <div className="h-6 bg-white flex items-center justify-between px-2 border-b border-gray-100">
        <div className="flex gap-1">
          <div className="w-5 h-1 rounded-full bg-gray-300" />
          <div className="w-5 h-1 rounded-full bg-gray-300" />
          <div className="w-5 h-1 rounded-full bg-gray-300" />
        </div>
        <div className="w-8 h-2 rounded bg-gray-800" />
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        </div>
      </div>
      {/* Page body */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-[4px] text-gray-300">Centered Logo &middot; Mega Menu</div>
      </div>
    </div>
  );
}

function HeaderPreviewMinimal() {
  return (
    <div className="w-full h-24 rounded-md overflow-hidden border border-black/10 bg-white flex flex-col">
      {/* Minimal: logo left | inline nav center | icons right — compact */}
      <div className="h-5 bg-white flex items-center justify-between px-2 border-b border-gray-100">
        <div className="w-6 h-1.5 rounded bg-gray-800" />
        <div className="flex gap-1.5">
          <div className="w-4 h-1 rounded-full bg-gray-200" />
          <div className="w-4 h-1 rounded-full bg-gray-200" />
          <div className="w-4 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        </div>
      </div>
      {/* Page body */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-[4px] text-gray-300">Left Logo &middot; Compact Nav</div>
      </div>
    </div>
  );
}

function HeaderPreviewCentered() {
  return (
    <div className="w-full h-24 rounded-md overflow-hidden border border-black/10 bg-white flex flex-col">
      {/* Centered: top utility bar */}
      <div className="h-3 bg-gray-50 flex items-center justify-between px-2">
        <div className="flex gap-1">
          <div className="w-3 h-0.5 rounded-full bg-gray-200" />
          <div className="w-3 h-0.5 rounded-full bg-gray-200" />
        </div>
        <div className="w-6 h-1 rounded bg-gray-800" />
        <div className="flex gap-0.5">
          <div className="w-1 h-1 rounded-full bg-gray-200" />
          <div className="w-1 h-1 rounded-full bg-gray-200" />
        </div>
      </div>
      {/* Bottom nav bar */}
      <div className="h-4 bg-white flex items-center justify-center gap-2 border-b border-gray-100">
        <div className="w-5 h-0.5 rounded-full bg-gray-300" />
        <div className="w-5 h-0.5 rounded-full bg-gray-300" />
        <div className="w-5 h-0.5 rounded-full bg-gray-300" />
      </div>
      {/* Page body */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-[4px] text-gray-300">Utility Bar + Centered Nav</div>
      </div>
    </div>
  );
}

/* ── Themed header mini-preview components ── */
function HeaderPreviewBold() {
  return (
    <div className="w-full h-24 rounded-md overflow-hidden border border-black/10 bg-white flex flex-col">
      <div className="h-5 flex items-center justify-between px-2" style={{ backgroundColor: "#0F0F0F" }}>
        <div className="w-6 h-1.5 rounded bg-white/80" />
        <div className="flex gap-1.5">
          <div className="w-4 h-1 rounded-full bg-white/30" />
          <div className="w-4 h-1 rounded-full bg-white/30" />
          <div className="w-4 h-1 rounded-full bg-white/30" />
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
        </div>
      </div>
      <div className="h-[2px]" style={{ backgroundColor: "#FF3C00" }} />
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-[4px] text-gray-300">Dark Bar + Red Accent Line</div>
      </div>
    </div>
  );
}

function HeaderPreviewElegant() {
  return (
    <div className="w-full h-24 rounded-md overflow-hidden border border-black/10 bg-white flex flex-col">
      <div className="h-3 flex items-center justify-between px-2" style={{ backgroundColor: "#2D2A26" }}>
        <div className="flex gap-1">
          <div className="w-3 h-0.5 rounded-full bg-white/30" />
        </div>
        <div className="flex gap-0.5">
          <div className="w-1 h-1 rounded-full bg-white/40" />
          <div className="w-1 h-1 rounded-full bg-white/40" />
        </div>
      </div>
      <div className="h-5 flex items-center justify-center gap-2" style={{ backgroundColor: "#FAF7F2" }}>
        <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: "#2D2A26", opacity: 0.3 }} />
        <div className="w-0.5 h-0.5 rounded-full" style={{ backgroundColor: "#C5A467" }} />
        <div className="w-8 h-1.5 rounded" style={{ backgroundColor: "#2D2A26" }} />
        <div className="w-0.5 h-0.5 rounded-full" style={{ backgroundColor: "#C5A467" }} />
        <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: "#2D2A26", opacity: 0.3 }} />
      </div>
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-[4px] text-gray-300">Gold Accents + Cream Bg</div>
      </div>
    </div>
  );
}

function HeaderPreviewZen() {
  return (
    <div className="w-full h-24 rounded-md overflow-hidden border border-black/10 bg-white flex flex-col">
      <div className="h-4 bg-white flex items-center justify-between px-2 border-b border-gray-100">
        <div className="w-5 h-1 rounded bg-gray-200" />
        <div className="flex gap-2">
          <div className="w-3 h-0.5 rounded-full bg-gray-100" />
          <div className="w-3 h-0.5 rounded-full bg-gray-100" />
          <div className="w-3 h-0.5 rounded-full bg-gray-100" />
        </div>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-gray-100" />
          <div className="w-1 h-1 rounded-full bg-gray-100" />
        </div>
      </div>
      <div className="flex-1 bg-white flex items-center justify-center">
        <div className="text-[4px] text-gray-200">Whisper-Quiet + Ultra-Light</div>
      </div>
    </div>
  );
}

function HeaderPreviewPlayful() {
  return (
    <div className="w-full h-24 rounded-md overflow-hidden border border-black/10 bg-white flex flex-col">
      <div className="h-[3px] bg-gradient-to-r from-[#7C3AED] to-[#EC4899]" />
      <div className="h-5 flex items-center justify-between px-2" style={{ backgroundColor: "#F8F7FF" }}>
        <div className="w-6 h-1.5 rounded" style={{ backgroundColor: "#7C3AED" }} />
        <div className="flex gap-1.5">
          <div className="w-4 h-1 rounded-full" style={{ backgroundColor: "#4B4869", opacity: 0.3 }} />
          <div className="w-4 h-1 rounded-full" style={{ backgroundColor: "#4B4869", opacity: 0.3 }} />
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#7C3AED", opacity: 0.4 }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#7C3AED", opacity: 0.4 }} />
        </div>
      </div>
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-[4px] text-gray-300">Gradient Strip + Purple</div>
      </div>
    </div>
  );
}

function HeaderPreviewTech() {
  return (
    <div className="w-full h-24 rounded-md overflow-hidden border border-black/10 bg-white flex flex-col">
      <div className="h-5 flex items-center justify-between px-2" style={{ backgroundColor: "#0A0A0F" }}>
        <div className="w-6 h-1.5 rounded" style={{ backgroundColor: "#00FF88" }} />
        <div className="flex gap-1.5">
          <div className="w-4 h-1 rounded-full bg-white/20" />
          <div className="w-4 h-1 rounded-full bg-white/20" />
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
        </div>
      </div>
      <div className="h-[1px]" style={{ backgroundColor: "#00FF88", opacity: 0.2 }} />
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-[4px] text-gray-300">Cyberpunk + Neon Green</div>
      </div>
    </div>
  );
}

function HeaderPreviewArtisan() {
  return (
    <div className="w-full h-24 rounded-md overflow-hidden border border-black/10 bg-white flex flex-col">
      <div className="h-2.5 flex items-center justify-center" style={{ backgroundColor: "#2C1810" }}>
        <div className="text-[3px] text-white/50">Handcrafted with love</div>
      </div>
      <div className="h-5 flex items-center justify-between px-2" style={{ backgroundColor: "#FFF8F0" }}>
        <div className="w-6 h-1.5 rounded" style={{ backgroundColor: "#2C1810" }} />
        <div className="flex gap-1.5">
          <div className="w-4 h-1 rounded-full" style={{ backgroundColor: "#3D2B1F", opacity: 0.3 }} />
          <div className="w-4 h-1 rounded-full" style={{ backgroundColor: "#3D2B1F", opacity: 0.3 }} />
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#C67B4A", opacity: 0.5 }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#C67B4A", opacity: 0.5 }} />
        </div>
      </div>
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-[4px] text-gray-300">Tagline Bar + Warm Cream</div>
      </div>
    </div>
  );
}

function HeaderPreviewMagazine() {
  return (
    <div className="w-full h-24 rounded-md overflow-hidden border border-black/10 bg-white flex flex-col">
      <div className="h-2.5 bg-white flex items-center justify-between px-2 border-b border-black/5">
        <div className="w-3 h-0.5 rounded-full bg-gray-200" />
        <div className="flex gap-0.5">
          <div className="w-1 h-1 rounded-full bg-gray-300" />
          <div className="w-1 h-1 rounded-full bg-gray-300" />
        </div>
      </div>
      <div className="h-6 bg-white flex flex-col items-center justify-center border-t-2 border-b border-black gap-0.5">
        <div className="w-12 h-2 rounded bg-black" />
        <div className="flex gap-1">
          <div className="w-3 h-0.5 rounded-full bg-black/20" />
          <div className="w-3 h-0.5 rounded-full bg-black/20" />
          <div className="w-3 h-0.5 rounded-full bg-black/20" />
        </div>
      </div>
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-[4px] text-gray-300">Masthead + Editorial Rules</div>
      </div>
    </div>
  );
}

/* ── Footer mini-preview components ── */
function FooterPreviewOmega() {
  return (
    <div className="w-full h-24 rounded-md overflow-hidden border border-black/10 bg-white flex flex-col">
      {/* Page body hint */}
      <div className="flex-1 bg-gray-50" />
      {/* Footer */}
      <div className="h-14 flex flex-col" style={{ backgroundColor: "#5A6A7A" }}>
        <div className="flex-1 flex items-center px-2 gap-2">
          <div className="flex items-center gap-[2px]">
            <OmegaSVG size={6} />
            <span className="text-[3px] font-bold italic text-white/80">Omega</span>
          </div>
          <div className="flex-1 flex gap-1.5">
            <div className="w-3 h-0.5 rounded-full bg-white/30" />
            <div className="w-3 h-0.5 rounded-full bg-white/30" />
            <div className="w-3 h-0.5 rounded-full bg-white/30" />
          </div>
          <div className="flex-1 flex gap-1.5">
            <div className="w-3 h-0.5 rounded-full bg-white/30" />
            <div className="w-3 h-0.5 rounded-full bg-white/30" />
          </div>
          <div className="flex gap-0.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#FF6A00" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
          </div>
        </div>
        <div className="h-3 border-t border-white/10 flex items-center justify-center">
          <div className="text-[3px] text-white/40">&copy; Omega Distribution</div>
        </div>
      </div>
    </div>
  );
}

function FooterPreviewLuxury() {
  return (
    <div className="w-full h-24 rounded-md overflow-hidden border border-black/10 bg-white flex flex-col">
      {/* Page body hint */}
      <div className="flex-1 bg-gray-50" />
      {/* Luxury footer: 4-column dark */}
      <div className="h-14 bg-gray-900 flex flex-col">
        <div className="flex-1 grid grid-cols-4 gap-1 px-2 pt-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <div className="w-6 h-0.5 rounded-full bg-white/40" />
              <div className="w-5 h-0.5 rounded-full bg-white/20" />
              <div className="w-4 h-0.5 rounded-full bg-white/20" />
              {i === 0 && <div className="mt-0.5 w-8 h-1.5 rounded-sm bg-primary/60" />}
            </div>
          ))}
        </div>
        <div className="h-3 border-t border-white/10 flex items-center justify-center">
          <div className="w-12 h-0.5 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  );
}

function FooterPreviewMinimal() {
  return (
    <div className="w-full h-24 rounded-md overflow-hidden border border-black/10 bg-white flex flex-col">
      {/* Page body hint */}
      <div className="flex-1 bg-gray-50" />
      {/* Minimal footer: single slim row */}
      <div className="h-6 bg-gray-100 border-t border-gray-200 flex items-center justify-between px-3">
        <div className="w-8 h-1 rounded bg-gray-400" />
        <div className="flex gap-2">
          <div className="w-4 h-0.5 rounded-full bg-gray-300" />
          <div className="w-4 h-0.5 rounded-full bg-gray-300" />
          <div className="w-4 h-0.5 rounded-full bg-gray-300" />
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        </div>
      </div>
    </div>
  );
}

function FooterPreviewColumns() {
  return (
    <div className="w-full h-24 rounded-md overflow-hidden border border-black/10 bg-white flex flex-col">
      {/* Page body hint */}
      <div className="flex-1 bg-gray-50" />
      {/* Columns footer: 3-col structured */}
      <div className="h-12 bg-gray-800 flex flex-col">
        <div className="flex-1 grid grid-cols-3 gap-1.5 px-2 pt-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <div className="w-6 h-0.5 rounded-full bg-white/50" />
              <div className="w-5 h-0.5 rounded-full bg-white/20" />
              <div className="w-4 h-0.5 rounded-full bg-white/20" />
              <div className="w-5 h-0.5 rounded-full bg-white/20" />
            </div>
          ))}
        </div>
        <div className="h-2.5 border-t border-white/10 flex items-center justify-center">
          <div className="w-10 h-0.5 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  );
}

/* ── Themed footer mini-preview components ── */
function FooterPreviewBold() {
  return (
    <div className="w-full h-24 rounded-md overflow-hidden border border-black/10 bg-white flex flex-col">
      <div className="flex-1 bg-gray-50" />
      <div className="h-12 flex flex-col" style={{ backgroundColor: "#0F0F0F" }}>
        <div className="flex-1 grid grid-cols-3 gap-1.5 px-2 pt-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <div className="w-6 h-0.5 rounded-full" style={{ backgroundColor: "#FF3C00" }} />
              <div className="w-3 h-[1px]" style={{ backgroundColor: "#FF3C00" }} />
              <div className="w-5 h-0.5 rounded-full bg-white/20" />
              <div className="w-4 h-0.5 rounded-full bg-white/20" />
            </div>
          ))}
        </div>
        <div className="h-2.5 border-t border-white/10 flex items-center justify-center">
          <div className="w-10 h-0.5 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  );
}

function FooterPreviewElegant() {
  return (
    <div className="w-full h-24 rounded-md overflow-hidden border border-black/10 bg-white flex flex-col">
      <div className="flex-1 bg-gray-50" />
      <div className="h-14 flex flex-col" style={{ backgroundColor: "#FAF7F2" }}>
        <div className="flex-1 grid grid-cols-4 gap-1 px-2 pt-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <div className="w-6 h-0.5 rounded-full" style={{ backgroundColor: "#C5A467" }} />
              <div className="w-4 h-[1px]" style={{ backgroundColor: "#C5A467", opacity: 0.3 }} />
              <div className="w-5 h-0.5 rounded-full" style={{ backgroundColor: "#2D2A26", opacity: 0.15 }} />
              <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: "#2D2A26", opacity: 0.15 }} />
            </div>
          ))}
        </div>
        <div className="h-3 border-t" style={{ borderColor: "#E8DDD0" }}>
          <div className="flex items-center justify-center h-full">
            <div className="w-10 h-0.5 rounded-full" style={{ backgroundColor: "#2D2A26", opacity: 0.15 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FooterPreviewZen() {
  return (
    <div className="w-full h-24 rounded-md overflow-hidden border border-black/10 bg-white flex flex-col">
      <div className="flex-1 bg-gray-50" />
      <div className="h-10 bg-white border-t border-gray-100 flex flex-col items-center justify-center gap-1 py-1">
        <div className="w-8 h-0.5 rounded-full bg-gray-100" />
        <div className="flex gap-1">
          <div className="w-3 h-0.5 rounded-full bg-gray-100" />
          <div className="w-3 h-0.5 rounded-full bg-gray-100" />
          <div className="w-3 h-0.5 rounded-full bg-gray-100" />
        </div>
        <div className="w-6 h-0.5 rounded-full bg-gray-50" />
      </div>
    </div>
  );
}

function FooterPreviewPlayful() {
  return (
    <div className="w-full h-24 rounded-md overflow-hidden border border-black/10 bg-white flex flex-col">
      <div className="flex-1 bg-gray-50" />
      <div className="h-10 flex flex-col" style={{ backgroundColor: "#F8F7FF" }}>
        <div className="flex-1 grid grid-cols-3 gap-1 px-2 pt-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <div className="w-5 h-0.5 rounded-full" style={{ backgroundColor: "#7C3AED" }} />
              <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: "#4B4869", opacity: 0.2 }} />
              <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: "#4B4869", opacity: 0.2 }} />
            </div>
          ))}
        </div>
      </div>
      <div className="h-3 flex items-center justify-center" style={{ backgroundColor: "#2D2A4A" }}>
        <div className="w-10 h-0.5 rounded-full bg-white/20" />
      </div>
    </div>
  );
}

function FooterPreviewTech() {
  return (
    <div className="w-full h-24 rounded-md overflow-hidden border border-black/10 bg-white flex flex-col">
      <div className="flex-1 bg-gray-50" />
      <div className="h-14 flex flex-col" style={{ backgroundColor: "#0A0A0F" }}>
        <div className="flex-1 grid grid-cols-4 gap-1 px-2 pt-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <div className="w-5 h-0.5 rounded-full" style={{ backgroundColor: "#00FF88" }} />
              <div className="w-4 h-0.5 rounded-full bg-white/15" />
              <div className="w-3 h-0.5 rounded-full bg-white/15" />
            </div>
          ))}
        </div>
        <div className="h-2.5 flex items-center justify-center" style={{ borderTop: "1px solid rgba(0,255,136,0.1)" }}>
          <div className="w-10 h-0.5 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}

function FooterPreviewArtisan() {
  return (
    <div className="w-full h-24 rounded-md overflow-hidden border border-black/10 bg-white flex flex-col">
      <div className="flex-1 bg-gray-50" />
      <div className="h-10 flex flex-col" style={{ backgroundColor: "#FFF8F0" }}>
        <div className="flex-1 grid grid-cols-3 gap-1 px-2 pt-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-0.5" style={{ borderLeft: i > 0 ? "1px dashed #E8DDD0" : "none", paddingLeft: i > 0 ? 4 : 0 }}>
              <div className="w-5 h-0.5 rounded-full" style={{ backgroundColor: "#C67B4A" }} />
              <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: "#3D2B1F", opacity: 0.2 }} />
              <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: "#3D2B1F", opacity: 0.2 }} />
            </div>
          ))}
        </div>
      </div>
      <div className="h-3 flex items-center justify-center" style={{ backgroundColor: "#2C1810" }}>
        <div className="w-10 h-0.5 rounded-full bg-white/20" />
      </div>
    </div>
  );
}

function FooterPreviewMagazine() {
  return (
    <div className="w-full h-24 rounded-md overflow-hidden border border-black/10 bg-white flex flex-col">
      <div className="flex-1 bg-gray-50" />
      <div className="h-16 bg-white border-t-2 border-black flex flex-col">
        <div className="flex items-center justify-center pt-1">
          <div className="w-10 h-1.5 rounded bg-black" />
        </div>
        <div className="flex-1 grid grid-cols-4 gap-1 px-2 pt-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <div className="w-5 h-0.5 rounded-full bg-black/60" />
              <div className="w-4 h-0.5 rounded-full bg-black/15" />
              <div className="w-3 h-0.5 rounded-full bg-black/15" />
            </div>
          ))}
        </div>
        <div className="h-2.5 border-t-2 border-black flex items-center justify-center">
          <div className="w-10 h-0.5 rounded-full bg-black/15" />
        </div>
      </div>
    </div>
  );
}

/* ── Header/Footer option definitions ── */
const HEADER_OPTIONS: { id: string; mode: "hardcoded" | "dynamic"; variant: HeaderVariant; labelKey: string; descKey: string; Preview: React.ComponentType }[] = [
  { id: "omega",    mode: "hardcoded", variant: "classic",  labelKey: "admin:settings.layout.headerOmega",    descKey: "admin:settings.layout.headerOmegaDesc",    Preview: HeaderPreviewOmega },
  { id: "classic",  mode: "dynamic",   variant: "classic",  labelKey: "admin:settings.layout.headerClassic",  descKey: "admin:settings.layout.headerClassicDesc",  Preview: HeaderPreviewClassic },
  { id: "minimal",  mode: "dynamic",   variant: "minimal",  labelKey: "admin:settings.layout.headerMinimal",  descKey: "admin:settings.layout.headerMinimalDesc",  Preview: HeaderPreviewMinimal },
  { id: "centered", mode: "dynamic",   variant: "centered", labelKey: "admin:settings.layout.headerCentered", descKey: "admin:settings.layout.headerCenteredDesc", Preview: HeaderPreviewCentered },
  { id: "bold",     mode: "dynamic",   variant: "bold",     labelKey: "admin:settings.layout.headerBold",     descKey: "admin:settings.layout.headerBoldDesc",     Preview: HeaderPreviewBold },
  { id: "elegant",  mode: "dynamic",   variant: "elegant",  labelKey: "admin:settings.layout.headerElegant",  descKey: "admin:settings.layout.headerElegantDesc",  Preview: HeaderPreviewElegant },
  { id: "zen",      mode: "dynamic",   variant: "zen",      labelKey: "admin:settings.layout.headerZen",      descKey: "admin:settings.layout.headerZenDesc",      Preview: HeaderPreviewZen },
  { id: "playful",  mode: "dynamic",   variant: "playful",  labelKey: "admin:settings.layout.headerPlayful",  descKey: "admin:settings.layout.headerPlayfulDesc",  Preview: HeaderPreviewPlayful },
  { id: "tech",     mode: "dynamic",   variant: "tech",     labelKey: "admin:settings.layout.headerTech",     descKey: "admin:settings.layout.headerTechDesc",     Preview: HeaderPreviewTech },
  { id: "artisan",  mode: "dynamic",   variant: "artisan",  labelKey: "admin:settings.layout.headerArtisan",  descKey: "admin:settings.layout.headerArtisanDesc",  Preview: HeaderPreviewArtisan },
  { id: "magazine", mode: "dynamic",   variant: "magazine", labelKey: "admin:settings.layout.headerMagazine", descKey: "admin:settings.layout.headerMagazineDesc", Preview: HeaderPreviewMagazine },
];

const FOOTER_OPTIONS: { id: string; mode: "hardcoded" | "dynamic"; variant: FooterVariant; labelKey: string; descKey: string; Preview: React.ComponentType }[] = [
  { id: "omega",   mode: "hardcoded", variant: "luxury",  labelKey: "admin:settings.layout.footerOmega",   descKey: "admin:settings.layout.footerOmegaDesc",   Preview: FooterPreviewOmega },
  { id: "luxury",  mode: "dynamic",   variant: "luxury",  labelKey: "admin:settings.layout.footerLuxury",  descKey: "admin:settings.layout.footerLuxuryDesc",  Preview: FooterPreviewLuxury },
  { id: "minimal", mode: "dynamic",   variant: "minimal", labelKey: "admin:settings.layout.footerMinimal", descKey: "admin:settings.layout.footerMinimalDesc", Preview: FooterPreviewMinimal },
  { id: "columns",  mode: "dynamic",   variant: "columns",  labelKey: "admin:settings.layout.footerColumns",  descKey: "admin:settings.layout.footerColumnsDesc",  Preview: FooterPreviewColumns },
  { id: "bold",     mode: "dynamic",   variant: "bold",     labelKey: "admin:settings.layout.footerBold",     descKey: "admin:settings.layout.footerBoldDesc",     Preview: FooterPreviewBold },
  { id: "elegant",  mode: "dynamic",   variant: "elegant",  labelKey: "admin:settings.layout.footerElegant",  descKey: "admin:settings.layout.footerElegantDesc",  Preview: FooterPreviewElegant },
  { id: "zen",      mode: "dynamic",   variant: "zen",      labelKey: "admin:settings.layout.footerZen",      descKey: "admin:settings.layout.footerZenDesc",      Preview: FooterPreviewZen },
  { id: "playful",  mode: "dynamic",   variant: "playful",  labelKey: "admin:settings.layout.footerPlayful",  descKey: "admin:settings.layout.footerPlayfulDesc",  Preview: FooterPreviewPlayful },
  { id: "tech",     mode: "dynamic",   variant: "tech",     labelKey: "admin:settings.layout.footerTech",     descKey: "admin:settings.layout.footerTechDesc",     Preview: FooterPreviewTech },
  { id: "artisan",  mode: "dynamic",   variant: "artisan",  labelKey: "admin:settings.layout.footerArtisan",  descKey: "admin:settings.layout.footerArtisanDesc",  Preview: FooterPreviewArtisan },
  { id: "magazine", mode: "dynamic",   variant: "magazine", labelKey: "admin:settings.layout.footerMagazine", descKey: "admin:settings.layout.footerMagazineDesc", Preview: FooterPreviewMagazine },
];

function LayoutTab({ settings, onSave, isSaving, t }: LayoutTabProps) {
  // ── Header state ──
  const [headerEnabled, setHeaderEnabled] = useState(settings.header?.enabled !== false);
  const [headerVariant, setHeaderVariant] = useState<HeaderVariant>(settings.header?.variant || "classic");
  const [headerMode, setHeaderMode] = useState<"dynamic" | "hardcoded">(settings.header?.mode || "dynamic");

  // ── Footer state ──
  const [footerEnabled, setFooterEnabled] = useState(settings.footer?.enabled !== false);
  const [footerVariant, setFooterVariant] = useState<FooterVariant>(settings.footer?.variant || "luxury");
  const [footerMode, setFooterMode] = useState<"dynamic" | "hardcoded">(settings.footer?.mode || "dynamic");

  // Derive active card IDs
  const activeHeaderId = headerMode === "hardcoded" ? "omega" : headerVariant;
  const activeFooterId = footerMode === "hardcoded" ? "omega" : footerVariant;

  const handleHeaderSelect = (opt: typeof HEADER_OPTIONS[number]) => {
    setHeaderMode(opt.mode);
    setHeaderVariant(opt.variant);
  };

  const handleFooterSelect = (opt: typeof FOOTER_OPTIONS[number]) => {
    setFooterMode(opt.mode);
    setFooterVariant(opt.variant);
  };

  return (
    <div className="space-y-6">
      {/* ── Header Settings ────────────────────────────────────────────── */}
      <div className={cn(sectionClasses, "space-y-4")}>
        <h3 className="text-sm font-semibold text-polaris-text">{t("admin:settings.layout.headerTitle")}</h3>
        <p className="text-xs text-polaris-text-subdued -mt-2">{t("admin:settings.layout.headerHelp")}</p>

        {/* Visibility toggle */}
        <ToggleField
          id="header-enabled"
          label={t("admin:settings.layout.headerEnabledLabel")}
          help={t("admin:settings.layout.headerEnabledHelp")}
          checked={headerEnabled}
          onCheckedChange={setHeaderEnabled}
        />

        {/* Header gallery */}
        <div className={!headerEnabled ? "opacity-40 pointer-events-none select-none" : ""}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {HEADER_OPTIONS.map((opt) => {
              const isActive = activeHeaderId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleHeaderSelect(opt)}
                  className={cn(
                    "relative text-left rounded-lg border-2 p-3 transition-all cursor-pointer",
                    isActive
                      ? "border-primary ring-1 ring-primary bg-primary/5"
                      : "border-polaris-border bg-polaris-surface hover:border-polaris-border-hovered hover:shadow-sm"
                  )}
                >
                  {isActive && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                  )}
                  <opt.Preview />
                  <p className="text-xs font-semibold text-polaris-text mt-2">{t(opt.labelKey)}</p>
                  <p className="text-[10px] text-polaris-text-subdued mt-0.5 line-clamp-2">{t(opt.descKey)}</p>
                </button>
              );
            })}
          </div>
        </div>

        <SaveButton
          onClick={() => onSave("header", { enabled: headerEnabled, variant: headerVariant, mode: headerMode })}
          isSaving={isSaving === "header"}
          t={t}
        />
      </div>

      {/* ── Footer Settings ────────────────────────────────────────────── */}
      <div className={cn(sectionClasses, "space-y-4")}>
        <h3 className="text-sm font-semibold text-polaris-text">{t("admin:settings.layout.footerTitle")}</h3>
        <p className="text-xs text-polaris-text-subdued -mt-2">{t("admin:settings.layout.footerHelp")}</p>

        {/* Visibility toggle */}
        <ToggleField
          id="footer-enabled"
          label={t("admin:settings.layout.footerEnabledLabel")}
          help={t("admin:settings.layout.footerEnabledHelp")}
          checked={footerEnabled}
          onCheckedChange={setFooterEnabled}
        />

        {/* Footer gallery */}
        <div className={!footerEnabled ? "opacity-40 pointer-events-none select-none" : ""}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {FOOTER_OPTIONS.map((opt) => {
              const isActive = activeFooterId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleFooterSelect(opt)}
                  className={cn(
                    "relative text-left rounded-lg border-2 p-3 transition-all cursor-pointer",
                    isActive
                      ? "border-primary ring-1 ring-primary bg-primary/5"
                      : "border-polaris-border bg-polaris-surface hover:border-polaris-border-hovered hover:shadow-sm"
                  )}
                >
                  {isActive && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                  )}
                  <opt.Preview />
                  <p className="text-xs font-semibold text-polaris-text mt-2">{t(opt.labelKey)}</p>
                  <p className="text-[10px] text-polaris-text-subdued mt-0.5 line-clamp-2">{t(opt.descKey)}</p>
                </button>
              );
            })}
          </div>
        </div>

        <SaveButton
          onClick={() => onSave("footer", { enabled: footerEnabled, variant: footerVariant, mode: footerMode })}
          isSaving={isSaving === "footer"}
          t={t}
        />
      </div>
    </div>
  );
}

// ─── Homepage Tab ────────────────────────────────────────────────────────────

function HomepageTab({ settings, onSave, isSaving, t, onRefresh }: HomepageTabProps) {
  const { toast } = useToast();
  const hp = settings.homepage;

  // ── Active theme (any registered theme ID) ──
  const resolveInitialTheme = (): string => {
    if (hp?.template && THEMES[hp.template]) return hp.template;
    if (hp?.mode === "hardcoded") return "classic";
    return "dynamic";
  };
  const [activeTheme, setActiveTheme] = useState<string>(resolveInitialTheme);

  // ── Section visibility & order (theme-aware) ──────────────────────────
  const [sections, setSections] = useState<Partial<Record<HomepageSectionKey, boolean>>>(() => {
    return { ...hp?.sections };
  });
  const [sectionOrder, setSectionOrder] = useState<HomepageSectionKey[]>(() => {
    const stored = hp?.sectionOrder;
    const themeDefaults = getDefaultOrderForTheme(resolveInitialTheme());
    const validKeys = getValidKeysForTheme(resolveInitialTheme());
    if (stored && Array.isArray(stored) && stored.length > 0) {
      const validStored = stored.filter((k): k is HomepageSectionKey => validKeys.has(k as HomepageSectionKey));
      if (validStored.length > 0) {
        const missing = themeDefaults.filter((k) => !validStored.includes(k));
        return [...validStored, ...missing];
      }
    }
    return themeDefaults;
  });
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // ── Handle theme change: reset section order to new theme defaults ──
  const handleThemeChange = (newThemeId: string) => {
    setActiveTheme(newThemeId);
    const theme = getTheme(newThemeId);
    setSectionOrder([...theme.defaultOrder]);
    // Reset visibility for new theme sections to defaults
    const updated = { ...sections };
    for (const key of theme.defaultOrder) {
      if (updated[key] === undefined) updated[key] = true;
    }
    // Apply defaultHidden
    if (theme.defaultHidden) {
      for (const key of theme.defaultHidden) {
        if (updated[key] === undefined) updated[key] = false;
      }
    }
    setSections(updated);
  };

  // ── Announcement bar ────────────────────────────────────────────────────
  const [annEnabled, setAnnEnabled] = useState(hp?.announcement?.enabled !== false);
  const [annText, setAnnText] = useState(hp?.announcement?.text || hp?.announcementText || "");
  const [annLink, setAnnLink] = useState(hp?.announcement?.link || "");
  const [annBgColor, setAnnBgColor] = useState(hp?.announcement?.bgColor || "#1a1a1a");
  const [annTextColor, setAnnTextColor] = useState(hp?.announcement?.textColor || "#ffffff");
  const [annDismissible, setAnnDismissible] = useState(hp?.announcement?.dismissible ?? false);

  // ── Hero slides ─────────────────────────────────────────────────────────
  const [slides, setSlides] = useState<HomepageSlide[]>(hp?.slides ?? []);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ── Promo banner ────────────────────────────────────────────────────────
  const [promoTitle, setPromoTitle] = useState(hp?.promoBanner?.title || "");
  const [promoSubtitle, setPromoSubtitle] = useState(hp?.promoBanner?.subtitle || "");
  const [promoCtaText, setPromoCtaText] = useState(hp?.promoBanner?.ctaText || "");
  const [promoCtaLink, setPromoCtaLink] = useState(hp?.promoBanner?.ctaLink || "/products");
  const [promoImage, setPromoImage] = useState(hp?.promoBanner?.imageUrl || "");
  const [promoCountdown, setPromoCountdown] = useState(hp?.promoBanner?.countdownEnd ? hp.promoBanner.countdownEnd.slice(0, 16) : "");

  // ── Featured products ───────────────────────────────────────────────────
  const [fpTitle, setFpTitle] = useState(hp?.featuredProducts?.title || "");
  const [fpMode, setFpMode] = useState<"auto" | "manual">(hp?.featuredProducts?.mode || "auto");
  const [fpSort, setFpSort] = useState<"newest" | "bestseller" | "rating">(hp?.featuredProducts?.sortBy || "newest");
  const [fpLimit, setFpLimit] = useState(hp?.featuredProducts?.limit || 8);
  const [fpIds, setFpIds] = useState((hp?.featuredProducts?.productIds || []).join(", "));

  // ── Collections ─────────────────────────────────────────────────────────
  const [colTitle, setColTitle] = useState(hp?.collections?.title || "");
  const [colLimit, setColLimit] = useState(hp?.collections?.limit || 4);
  const [colIds, setColIds] = useState((hp?.collections?.categoryIds || []).join(", "));

  // ── New arrivals ────────────────────────────────────────────────────────
  const [naTitle, setNaTitle] = useState(hp?.newArrivals?.title || "");
  const [naLimit, setNaLimit] = useState(hp?.newArrivals?.limit || 4);

  // ── Testimonials ────────────────────────────────────────────────────────
  const [testTitle, setTestTitle] = useState(hp?.testimonials?.title || "");
  const [testMode, setTestMode] = useState<"auto" | "manual">(hp?.testimonials?.mode || "manual");
  const [testItems, setTestItems] = useState<TestimonialItem[]>(hp?.testimonials?.items ?? []);

  // ── Brand story ─────────────────────────────────────────────────────────
  const [bsTitle, setBsTitle] = useState(hp?.brandStory?.title || "");
  const [bsBody, setBsBody] = useState(hp?.brandStory?.body || "");
  const [bsCtaText, setBsCtaText] = useState(hp?.brandStory?.ctaText || "");
  const [bsCtaLink, setBsCtaLink] = useState(hp?.brandStory?.ctaLink || "/products");
  const [bsImage, setBsImage] = useState(hp?.brandStory?.imageUrl || "");
  const [bsPosition, setBsPosition] = useState<"left" | "right">(hp?.brandStory?.imagePosition || "left");

  // ── Trust bar ───────────────────────────────────────────────────────────
  const [trustItems, setTrustItems] = useState<TrustBarItem[]>(hp?.trustBar?.items ?? []);

  // ── Newsletter ─────────────────────────────────────────────────────────
  const [nlTitle, setNlTitle] = useState(hp?.newsletter?.title || "");
  const [nlSubtitle, setNlSubtitle] = useState(hp?.newsletter?.subtitle || "");
  const [nlPlaceholder, setNlPlaceholder] = useState(hp?.newsletter?.placeholder || "");
  const [nlButtonText, setNlButtonText] = useState(hp?.newsletter?.buttonText || "");
  const [nlBgColor, setNlBgColor] = useState(hp?.newsletter?.bgColor || "#1a1a1a");
  const [nlTextColor, setNlTextColor] = useState(hp?.newsletter?.textColor || "#ffffff");

  // ── Instagram ──────────────────────────────────────────────────────────
  const [igUsername, setIgUsername] = useState(hp?.instagram?.username || "");
  const [igImages, setIgImages] = useState<InstagramImage[]>(hp?.instagram?.images ?? []);

  // ── Value Propositions ─────────────────────────────────────────────────
  const [vpItems, setVpItems] = useState<ValuePropositionItem[]>(hp?.valuePropositions?.items ?? []);

  // ── Partners ───────────────────────────────────────────────────────────
  const [partnerItems, setPartnerItems] = useState<PartnerItem[]>(hp?.partners?.items ?? []);

  // ── Collections display mode ───────────────────────────────────────────
  const [colDisplayMode, setColDisplayMode] = useState<"grid" | "slider">(hp?.collections?.displayMode || "grid");

  // ── Popup ──────────────────────────────────────────────────────────────
  const [popupEnabled, setPopupEnabled] = useState(hp?.popup?.enabled ?? false);
  const [popupTitle, setPopupTitle] = useState(hp?.popup?.title || "");
  const [popupBody, setPopupBody] = useState(hp?.popup?.body || "");
  const [popupCtaText, setPopupCtaText] = useState(hp?.popup?.ctaText || "");
  const [popupCtaLink, setPopupCtaLink] = useState(hp?.popup?.ctaLink || "");
  const [popupImage, setPopupImage] = useState(hp?.popup?.imageUrl || "");
  const [popupTrigger, setPopupTrigger] = useState<"exit" | "timed" | "scroll">(hp?.popup?.trigger || "timed");
  const [popupDelay, setPopupDelay] = useState(hp?.popup?.delay ?? 5);
  const [popupScrollPercent, setPopupScrollPercent] = useState(hp?.popup?.scrollPercent ?? 50);
  const [popupFrequency, setPopupFrequency] = useState<"once" | "session" | "daily">(hp?.popup?.frequency || "session");

  // ── Helpers ─────────────────────────────────────────────────────────────
  const updateSlide = (idx: number, key: keyof HomepageSlide, val: string) => {
    setSlides((prev) => prev.map((s, i) => (i === idx ? { ...s, [key]: val } : s)));
  };

  const handleImageUpload = async (fieldName: string, onSuccess: (url: string) => void) => {
    const el = fileInputRefs.current[fieldName];
    if (!el) return;
    const file = el.files?.[0];
    if (!file) return;
    try {
      const res = await uploadSettingsFileAPI(file, fieldName);
      const url = "url" in res.data ? (res.data as { url: string }).url : "";
      if (url) onSuccess(url);
      else await onRefresh();
      toast({ title: t("admin:settings.homepage.imageUploaded") });
    } catch {
      toast({ title: t("admin:settings.saveError"), variant: "destructive" });
    }
    el.value = "";
  };

  // ── Drag-to-reorder (native HTML5 Drag API) ────────────────────────────
  const handleDragStart = (e: DragEvent<HTMLDivElement>, idx: number) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(idx));
  };
  const handleDragEnter = (e: DragEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const from = dragIdx;
    const to = dragOverIdx;
    setDragIdx(null);
    setDragOverIdx(null);
    if (from === null || to === null || from === to) return;
    setSectionOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };
  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  // ── Build save payload ──────────────────────────────────────────────────
  const handleSave = () => {
    const productIds = fpIds.split(",").map((s) => s.trim()).filter(Boolean);
    const categoryIds = colIds.split(",").map((s) => s.trim()).filter(Boolean);

    onSave({
      template: activeTheme,
      sections,
      sectionOrder,
      slides,
      announcement: {
        enabled: annEnabled,
        text: annText,
        link: annLink,
        bgColor: annBgColor,
        textColor: annTextColor,
        dismissible: annDismissible,
      },
      promoBanner: {
        title: promoTitle,
        subtitle: promoSubtitle,
        ctaText: promoCtaText,
        ctaLink: promoCtaLink,
        imageUrl: promoImage,
        countdownEnd: promoCountdown || null,
      },
      featuredProducts: {
        title: fpTitle,
        mode: fpMode,
        sortBy: fpSort,
        limit: fpLimit,
        productIds,
      },
      collections: {
        title: colTitle,
        limit: colLimit,
        categoryIds,
        displayMode: colDisplayMode,
      },
      newArrivals: { title: naTitle, limit: naLimit },
      testimonials: { title: testTitle, mode: testMode, items: testItems },
      brandStory: {
        title: bsTitle,
        body: bsBody,
        ctaText: bsCtaText,
        ctaLink: bsCtaLink,
        imageUrl: bsImage,
        imagePosition: bsPosition,
      },
      trustBar: { items: trustItems },
      newsletter: {
        title: nlTitle,
        subtitle: nlSubtitle,
        placeholder: nlPlaceholder,
        buttonText: nlButtonText,
        bgColor: nlBgColor,
        textColor: nlTextColor,
      },
      instagram: { username: igUsername, images: igImages },
      valuePropositions: { items: vpItems },
      partners: { items: partnerItems },
      popup: {
        enabled: popupEnabled,
        title: popupTitle,
        body: popupBody,
        ctaText: popupCtaText,
        ctaLink: popupCtaLink,
        imageUrl: popupImage,
        trigger: popupTrigger,
        delay: popupDelay,
        scrollPercent: popupScrollPercent,
        frequency: popupFrequency,
      },
      announcementText: annText,
    });
  };

  return (
    <div className="space-y-4">
      {/* ── Theme Gallery ────────────────────────────────────────────────── */}
      <div className="border border-polaris-border rounded-lg p-4 bg-polaris-surface">
        <h3 className="text-sm font-semibold text-polaris-text">{t("admin:settings.homepage.themeGalleryTitle")}</h3>
        <p className="text-xs text-polaris-text-subdued mt-1 mb-4">{t("admin:settings.homepage.themeGalleryHelp")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {getThemeIds().map((themeId) => {
            const theme = getTheme(themeId);
            const isActive = activeTheme === themeId;
            return (
              <button
                key={themeId}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleThemeChange(themeId)}
                className={cn(
                  "relative text-left rounded-lg border-2 p-3 transition-all cursor-pointer",
                  isActive
                    ? "border-primary ring-1 ring-primary bg-primary/5"
                    : "border-polaris-border bg-polaris-surface hover:border-polaris-border-hovered hover:shadow-sm"
                )}
              >
                {/* Styled mini-page preview */}
                {themeId === "classic" && (
                  <div className="w-full h-32 rounded-md mb-3 overflow-hidden border border-black/10 bg-white flex flex-col">
                    {/* Header with Omega logo */}
                    <div className="h-4 bg-white flex items-center px-2 border-b border-gray-100">
                      <div className="flex items-center gap-[3px]">
                        <svg viewBox="0 0 200 200" className="h-[10px] w-auto" aria-hidden="true">
                          <path d="M40 170V150h25C45 135 30 110 30 82c0-37 30-67 70-67s70 30 70 67c0 28-15 53-35 68h25v20h-50v-20h10c15-12 25-38 25-68 0-24-20-44-45-44S55 58 55 82c0 30 10 56 25 68h10v20H40z" fill="#FF6A00"/>
                        </svg>
                        <div className="flex items-baseline gap-[1px]">
                          <span className="text-[5px] font-bold italic text-[#FF6A00]">Omega</span>
                          <span className="text-[5px] font-light italic text-[#5A6A7A]">Distribution</span>
                        </div>
                      </div>
                      <div className="ml-auto flex gap-[3px]">{[1,2,3].map(i=><div key={i} className="w-[6px] h-[2px] rounded-full bg-gray-300" />)}</div>
                    </div>
                    {/* Hero area */}
                    <div className="mx-2.5 mt-1.5 h-11 bg-gray-50 rounded-sm flex flex-col items-center justify-center border border-gray-100">
                      <div className="w-[52px] h-[3px] bg-gray-400 rounded-full mb-1" />
                      <div className="w-8 h-[2px] bg-gray-200 rounded-full mb-1.5" />
                      <div className="w-10 h-[7px] bg-[#FF6A00] rounded-[2px]" />
                    </div>
                    {/* Product grid */}
                    <div className="mx-2.5 mt-1.5 flex gap-1">{[1,2,3].map(i=><div key={i} className="flex-1 rounded-sm overflow-hidden"><div className="h-[18px] bg-gray-50 border border-gray-100" /><div className="h-[8px] bg-white flex items-center px-1"><div className="w-3 h-[2px] bg-gray-200 rounded-full" /></div></div>)}</div>
                    {/* Footer */}
                    <div className="mt-auto h-[7px] bg-[#5A6A7A]" />
                  </div>
                )}
                {themeId === "bold" && (
                  <div className="w-full h-32 rounded-md mb-3 overflow-hidden border border-white/5 bg-[#0F0F0F] flex flex-col">
                    <div className="h-[2px] bg-[#FF3C00]" />
                    <div className="h-3 bg-[#0F0F0F] flex items-center px-2">
                      <div className="w-4 h-[3px] bg-white/80 rounded-[1px]" />
                      <div className="ml-auto flex gap-[3px]">{[1,2,3].map(i=><div key={i} className="w-[6px] h-[2px] bg-white/20 rounded-full" />)}</div>
                    </div>
                    <div className="mx-2 mt-1 h-14 bg-gradient-to-br from-[#FF3C00]/15 to-transparent rounded-[3px] flex flex-col items-start justify-center pl-3">
                      <div className="w-[56px] h-[4px] bg-white/70 rounded-[1px] mb-1" />
                      <div className="w-10 h-[3px] bg-white/30 rounded-[1px] mb-2" />
                      <div className="w-11 h-[8px] bg-[#FF3C00] rounded-[2px]" />
                    </div>
                    <div className="mx-2 mt-1.5 flex gap-1">{[1,2,3,4].map(i=><div key={i} className="flex-1 rounded-[2px] overflow-hidden"><div className="h-[14px] bg-white/[0.04]" /><div className="h-[5px] bg-white/[0.02]" /></div>)}</div>
                    <div className="mt-auto h-[5px] bg-[#FF3C00]/20" />
                  </div>
                )}
                {themeId === "elegant" && (
                  <div className="w-full h-32 rounded-md mb-3 overflow-hidden border border-[#C5A467]/20 bg-[#FAF7F2] flex flex-col">
                    <div className="h-3.5 bg-[#FAF7F2] flex items-center justify-center border-b border-[#C5A467]/20">
                      <div className="w-5 h-[3px] bg-[#1B1B1B]/60 rounded-full" />
                    </div>
                    <div className="mx-3 mt-2 h-[46px] flex flex-col items-center justify-center">
                      <div className="w-4 h-[1px] bg-[#C5A467]/60 mb-1.5" />
                      <div className="w-[50px] h-[3px] bg-[#1B1B1B]/50 rounded-full mb-1" />
                      <div className="w-9 h-[2px] bg-[#1B1B1B]/20 rounded-full mb-2" />
                      <div className="w-12 h-[7px] border border-[#C5A467] rounded-[1px] flex items-center justify-center"><div className="w-5 h-[2px] bg-[#C5A467]/60 rounded-full" /></div>
                    </div>
                    <div className="mx-3 h-[1px] bg-[#C5A467]/15 mt-1" />
                    <div className="mx-3 mt-1.5 flex gap-1.5">{[1,2,3].map(i=><div key={i} className="flex-1 rounded-[1px] overflow-hidden border border-[#C5A467]/10"><div className="h-[15px] bg-[#1B1B1B]/[0.03]" /><div className="h-[6px] flex items-center justify-center"><div className="w-4 h-[1.5px] bg-[#C5A467]/30 rounded-full" /></div></div>)}</div>
                    <div className="mt-auto h-[6px] bg-[#1B1B1B]/[0.03] border-t border-[#C5A467]/10" />
                  </div>
                )}
                {themeId === "minimal" && (
                  <div className="w-full h-32 rounded-md mb-3 overflow-hidden border border-black/[0.06] bg-white flex flex-col">
                    <div className="h-3 flex items-center justify-between px-3">
                      <div className="w-3 h-[2px] bg-black/70" />
                      <div className="w-2 h-[2px] bg-black/30" />
                    </div>
                    <div className="h-[0.5px] bg-black/[0.06]" />
                    <div className="flex-1 flex flex-col items-center justify-center px-4">
                      <div className="w-[60px] h-[3px] bg-black/40 mb-1.5" />
                      <div className="w-10 h-[1.5px] bg-black/15 mb-3" />
                      <div className="w-8 h-[6px] bg-black rounded-[1px]" />
                    </div>
                    <div className="mx-4 mb-2 flex gap-3">{[1,2,3].map(i=><div key={i} className="flex-1"><div className="h-[12px] bg-black/[0.03]" /><div className="mt-0.5 w-3/4 h-[1.5px] bg-black/10" /></div>)}</div>
                    <div className="h-[0.5px] bg-black/[0.06]" />
                    <div className="h-[4px]" />
                  </div>
                )}
                {themeId === "playful" && (
                  <div className="w-full h-32 rounded-md mb-3 overflow-hidden border border-purple-200 flex flex-col" style={{ background: "linear-gradient(135deg, #FDF4FF 0%, #FFF1F2 50%, #FEF9C3 100%)" }}>
                    <div className="h-3.5 flex items-center px-2" style={{ background: "linear-gradient(90deg, #8B5CF6, #EC4899)" }}>
                      <div className="w-3.5 h-[4px] bg-white/80 rounded-full" />
                      <div className="ml-auto flex gap-1">{[1,2,3].map(i=><div key={i} className="w-[5px] h-[5px] rounded-full bg-white/30" />)}</div>
                    </div>
                    <div className="mx-2 mt-2 h-11 rounded-xl flex flex-col items-center justify-center" style={{ background: "linear-gradient(135deg, #8B5CF620, #EC489920)" }}>
                      <div className="w-12 h-[3px] bg-[#8B5CF6]/50 rounded-full mb-1" />
                      <div className="w-8 h-[2px] bg-[#EC4899]/30 rounded-full mb-1.5" />
                      <div className="w-10 h-[8px] rounded-full" style={{ background: "linear-gradient(90deg, #8B5CF6, #EC4899)" }} />
                    </div>
                    <div className="mx-2 mt-1.5 flex gap-1">{[1,2,3].map(i=><div key={i} className="flex-1 rounded-xl overflow-hidden" style={{ backgroundColor: i === 1 ? "#8B5CF615" : i === 2 ? "#EC489915" : "#F59E0B15" }}><div className="h-[13px]" /><div className="h-[6px] flex items-center justify-center"><div className="w-4 h-[2px] rounded-full" style={{ backgroundColor: i === 1 ? "#8B5CF640" : i === 2 ? "#EC489940" : "#F59E0B40" }} /></div></div>)}</div>
                    <div className="mt-auto h-[6px]" style={{ background: "linear-gradient(90deg, #8B5CF620, #EC489920, #F59E0B20)" }} />
                  </div>
                )}
                {themeId === "tech" && (
                  <div className="w-full h-32 rounded-md mb-3 overflow-hidden border border-[#00FF88]/20 bg-[#0A0A0F] flex flex-col">
                    <div className="h-3.5 flex items-center px-2 border-b border-[#00FF88]/10">
                      <div className="w-[5px] h-[5px] rounded-sm border border-[#00FF88]/50" />
                      <div className="ml-1.5 w-3 h-[2px] bg-[#00FF88]/40 rounded-[1px]" />
                      <div className="ml-auto flex gap-1">{[1,2,3].map(i=><div key={i} className="w-[5px] h-[2px] bg-[#00D4FF]/25" />)}</div>
                    </div>
                    <div className="mx-2 mt-1.5 h-12 rounded-[3px] border border-[#00FF88]/10 flex flex-col items-start justify-center pl-2.5" style={{ background: "linear-gradient(135deg, #00FF8808, #00D4FF05)" }}>
                      <div className="w-12 h-[3px] bg-[#00FF88]/50 rounded-[1px] mb-0.5" />
                      <div className="w-[52px] h-[2px] bg-white/15 rounded-[1px] mb-1.5" />
                      <div className="flex gap-1">
                        <div className="w-9 h-[7px] bg-[#00FF88] rounded-[2px]" />
                        <div className="w-7 h-[7px] border border-[#00D4FF]/40 rounded-[2px]" />
                      </div>
                    </div>
                    <div className="mx-2 mt-1.5 grid grid-cols-4 gap-[3px]">{[1,2,3,4].map(i=><div key={i} className="h-[15px] rounded-[2px] border border-[#00FF88]/[0.07] bg-white/[0.02]"><div className="h-[8px] bg-white/[0.02]" /></div>)}</div>
                    <div className="mt-auto h-[3px] bg-gradient-to-r from-[#00FF88]/10 via-[#00D4FF]/10 to-transparent" />
                  </div>
                )}
                {themeId === "artisan" && (
                  <div className="w-full h-32 rounded-md mb-3 overflow-hidden border-2 border-dashed border-[#E8DDD0] bg-[#FFF8F0] flex flex-col">
                    <div className="h-3.5 bg-[#FFF8F0] flex items-center justify-center border-b border-dashed border-[#E8DDD0]">
                      <div className="w-5 h-[3px] bg-[#2C1810]/40 rounded-full" />
                    </div>
                    <div className="mx-2.5 mt-2 h-11 flex flex-col items-center justify-center">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-4 h-[1px]" style={{ backgroundColor: "#C67B4A" }} />
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#C67B4A" }} />
                        <div className="w-4 h-[1px]" style={{ backgroundColor: "#C67B4A" }} />
                      </div>
                      <div className="w-14 h-[3px] bg-[#2C1810]/40 rounded-full mb-1" />
                      <div className="w-10 h-[2px] bg-[#2C1810]/15 rounded-full mb-1.5" />
                      <div className="w-11 h-[7px] rounded-full" style={{ backgroundColor: "#C67B4A" }} />
                    </div>
                    <div className="mx-2.5 mt-1.5 flex gap-1.5">{[1,2,3].map(i=><div key={i} className="flex-1 rounded-xl overflow-hidden border-2 border-dashed border-[#E8DDD0]"><div className="h-[15px] bg-[#2C1810]/[0.04]" /><div className="h-[7px] flex items-center justify-center"><div className="w-4 h-[2px] rounded-full" style={{ backgroundColor: "#6B7C5E40" }} /></div></div>)}</div>
                    <div className="mt-auto h-[6px] bg-[#2C1810] flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full" style={{ backgroundColor: "#C67B4A" }} />
                    </div>
                  </div>
                )}
                {themeId === "magazine" && (
                  <div className="w-full h-32 rounded-md mb-3 overflow-hidden border border-[#E0E0E0] bg-white flex flex-col">
                    <div className="h-[2px]" style={{ backgroundColor: "#E63946" }} />
                    <div className="h-3 flex items-center px-2 border-b border-[#E0E0E0]">
                      <div className="w-4 h-[3px] bg-black/80" />
                      <div className="mx-auto w-6 h-[2px] bg-black/30" />
                      <div className="flex gap-[3px]">{[1,2,3].map(i=><div key={i} className="w-[5px] h-[2px] bg-black/20" />)}</div>
                    </div>
                    <div className="mx-2 mt-1.5 flex gap-0">
                      <div className="flex-1 h-14 bg-black/[0.04] flex flex-col items-start justify-end p-2">
                        <div className="w-3 h-[2px] mb-1" style={{ backgroundColor: "#E63946" }} />
                        <div className="w-12 h-[4px] bg-black/60 mb-0.5" />
                        <div className="w-8 h-[2px] bg-black/20" />
                      </div>
                      <div className="w-[1px] bg-[#E0E0E0]" />
                      <div className="flex-1 flex flex-col gap-[1px] bg-[#E0E0E0]">
                        <div className="flex-1 bg-black/[0.03]" />
                        <div className="flex-1 bg-black/[0.03]" />
                      </div>
                    </div>
                    <div className="mx-2 mt-1 grid grid-cols-4 gap-[1px] bg-[#E0E0E0]">{[1,2,3,4].map(i=><div key={i} className="bg-white"><div className="h-[12px] bg-black/[0.03]" /><div className="h-[5px] bg-white px-0.5"><div className="w-3 h-[1.5px] bg-black/15 mt-0.5" /></div></div>)}</div>
                    <div className="mt-auto h-[2px]" style={{ backgroundColor: "#E63946" }} />
                  </div>
                )}
                {themeId === "dynamic" && (
                  <div className="w-full h-32 rounded-md mb-3 overflow-hidden border border-indigo-200 bg-[#EEF2FF] flex flex-col relative">
                    <div className="h-3 bg-[#6366F1] flex items-center px-2">
                      <div className="w-3.5 h-[3px] bg-white/70 rounded-[1px]" />
                      <div className="ml-auto flex gap-[3px]">{[1,2,3].map(i=><div key={i} className="w-[6px] h-[2px] bg-white/30 rounded-full" />)}</div>
                    </div>
                    <div className="mx-2 mt-1.5 h-10 rounded-[3px] border border-dashed border-[#6366F1]/25 bg-white/50 flex flex-col items-center justify-center">
                      <div className="w-12 h-[3px] bg-[#6366F1]/30 rounded-full mb-1" />
                      <div className="w-8 h-[7px] bg-[#6366F1]/15 rounded-[2px] border border-dashed border-[#6366F1]/20" />
                    </div>
                    <div className="mx-2 mt-1 flex gap-1">{[1,2,3].map(i=><div key={i} className="flex-1 h-[18px] rounded-[3px] border border-dashed border-[#6366F1]/15 bg-white/40" />)}</div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-[#6366F1]/[0.08] flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#6366F1]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.212-1.281c-.063-.374-.313-.686-.645-.87a6.47 6.47 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-auto h-[5px] bg-[#6366F1]/10" />
                  </div>
                )}
                {/* Theme info */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-polaris-text">{t(`admin:settings.homepage.${theme.label}`)}</span>
                  {isActive && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-primary text-primary-foreground rounded">
                      <Check className="h-3 w-3" />
                      {t("admin:settings.homepage.themeActive")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-polaris-text-subdued leading-relaxed">{t(`admin:settings.homepage.${theme.description}`)}</p>
                {/* Editable badge */}
                <div className="mt-2">
                  <span className={cn(
                    "inline-block px-1.5 py-0.5 text-[10px] font-medium rounded",
                    theme.editable
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  )}>
                    {theme.editable ? t("admin:settings.homepage.themeEditable") : t("admin:settings.homepage.themePrebuilt")}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Section Visibility & Order (works for both templates) ──── */}
      <Collapsible title={t("admin:settings.homepage.sectionOrderTitle")} defaultOpen>
        <p className="text-xs text-polaris-text-subdued mb-3">{t("admin:settings.homepage.sectionOrderHelp")}</p>
        <div className="space-y-1">
          {sectionOrder.map((key, idx) => {
            const isDragging = dragIdx === idx;
            const isDropTarget = dragOverIdx === idx && dragIdx !== idx;
            return (
              <div
                key={key}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragEnter={(e) => handleDragEnter(e, idx)}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                className={`flex items-center justify-between py-2 px-3 border rounded transition-all duration-150 cursor-grab active:cursor-grabbing ${
                  isDragging
                    ? "opacity-30 scale-95 border-polaris-border bg-polaris-surface"
                    : isDropTarget
                      ? "ring-2 ring-primary scale-[1.02] border-primary bg-polaris-surface-hovered shadow-sm"
                      : "border-polaris-border bg-polaris-surface"
                }`}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-polaris-text-subdued" aria-hidden="true" />
                  <span className="text-sm text-polaris-text select-none">{t(`admin:settings.homepage.sectionNames.${key}`)}</span>
                </div>
                <Switch checked={sections[key] !== false} onCheckedChange={(val) => setSections((prev) => ({ ...prev, [key]: val }))} />
              </div>
            );
          })}
        </div>
      </Collapsible>

      {/* ── Content panels (only shown for editable themes) ── */}
      {getTheme(activeTheme).editable && (<>

      {/* ── Announcement Bar ────────────────────────────────────────────── */}
      <Collapsible title={t("admin:settings.homepage.announcementSection")}>
        <ToggleField id="ann-enabled" label={t("admin:settings.homepage.announcementEnabledLabel")} help="" checked={annEnabled} onCheckedChange={setAnnEnabled} />
        <Field label={t("admin:settings.homepage.announcementTextLabel")}>
          <input className={inputClasses} value={annText} onChange={(e) => setAnnText(e.target.value)} />
        </Field>
        <Field label={t("admin:settings.homepage.announcementLinkLabel")}>
          <input className={inputClasses} value={annLink} onChange={(e) => setAnnLink(e.target.value)} placeholder={t("admin:settings.homepage.announcementLinkPlaceholder")} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("admin:settings.homepage.announcementBgColorLabel")}>
            <div className="flex gap-2 items-center">
              <input type="color" value={annBgColor} onChange={(e) => setAnnBgColor(e.target.value)} className="h-9 w-12 rounded border border-[#C9CCCF] cursor-pointer" />
              <input className={inputClasses} value={annBgColor} onChange={(e) => setAnnBgColor(e.target.value)} />
            </div>
          </Field>
          <Field label={t("admin:settings.homepage.announcementTextColorLabel")}>
            <div className="flex gap-2 items-center">
              <input type="color" value={annTextColor} onChange={(e) => setAnnTextColor(e.target.value)} className="h-9 w-12 rounded border border-[#C9CCCF] cursor-pointer" />
              <input className={inputClasses} value={annTextColor} onChange={(e) => setAnnTextColor(e.target.value)} />
            </div>
          </Field>
        </div>
        <ToggleField id="ann-dismiss" label={t("admin:settings.homepage.announcementDismissibleLabel")} help={t("admin:settings.homepage.announcementDismissibleHelp")} checked={annDismissible} onCheckedChange={setAnnDismissible} />
      </Collapsible>

      {/* ── Hero Slides ─────────────────────────────────────────────────── */}
      <Collapsible title={t("admin:settings.homepage.slidesTitle")}>
        <div className="flex items-center justify-end">
          <button type="button" onClick={() => { if (slides.length < 10) setSlides((p) => [...p, { ...EMPTY_SLIDE }]); }} disabled={slides.length >= 10} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded border border-polaris-border text-polaris-text bg-polaris-surface hover:bg-polaris-surface-hovered disabled:opacity-50 transition-colors cursor-pointer">
            <Plus className="h-3.5 w-3.5" /> {t("admin:settings.homepage.addSlide")}
          </button>
        </div>
        {slides.length === 0 && <p className="text-sm text-polaris-text-subdued py-4 text-center">{t("admin:settings.homepage.noSlides")}</p>}
        {slides.map((slide, idx) => (
          <div key={idx} className="border border-polaris-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-polaris-text-subdued">{t("admin:settings.homepage.slideNumber", { n: idx + 1 })}</span>
              <button type="button" onClick={() => setSlides((p) => p.filter((_, i) => i !== idx))} className="text-polaris-critical hover:text-[#BC2200] cursor-pointer"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t("admin:settings.homepage.slideTitleLabel")}><input className={inputClasses} value={slide.title} onChange={(e) => updateSlide(idx, "title", e.target.value)} /></Field>
              <Field label={t("admin:settings.homepage.slideSubtitleLabel")}><input className={inputClasses} value={slide.subtitle} onChange={(e) => updateSlide(idx, "subtitle", e.target.value)} /></Field>
              <Field label={t("admin:settings.homepage.slideCtaTextLabel")}><input className={inputClasses} value={slide.ctaText} onChange={(e) => updateSlide(idx, "ctaText", e.target.value)} /></Field>
              <Field label={t("admin:settings.homepage.slideCtaLinkLabel")}><input className={inputClasses} value={slide.ctaLink} onChange={(e) => updateSlide(idx, "ctaLink", e.target.value)} /></Field>
            </div>
            <Field label={t("admin:settings.homepage.slideTypeLabel")}>
              <select className={selectClasses} value={slide.type || "image"} onChange={(e) => updateSlide(idx, "type", e.target.value)}>
                <option value="image">{t("admin:settings.homepage.slideTypeImage")}</option>
                <option value="video">{t("admin:settings.homepage.slideTypeVideo")}</option>
              </select>
            </Field>
            {(slide.type || "image") === "video" ? (
              <>
                <Field label={t("admin:settings.homepage.slideVideoUrlLabel")} help={t("admin:settings.homepage.slideVideoUrlHelp")}>
                  <input className={inputClasses} value={slide.videoUrl || ""} onChange={(e) => updateSlide(idx, "videoUrl", e.target.value)} placeholder="https://youtube.com/watch?v=... or .mp4 URL" />
                </Field>
                <Field label={t("admin:settings.homepage.slidePosterLabel")}>
                  <div className="flex items-center gap-3">
                    {slide.posterUrl && (
                      <div className="relative h-16 w-28 rounded overflow-hidden bg-polaris-bg border border-polaris-border">
                        <Image src={slide.posterUrl.startsWith("/") ? `${BASE_URL}${slide.posterUrl}` : slide.posterUrl} alt="" fill className="object-cover" unoptimized />
                      </div>
                    )}
                    <button type="button" onClick={() => fileInputRefs.current[`hero-poster-${idx}`]?.click()} className="px-3 py-1.5 text-xs font-medium rounded border border-polaris-border text-polaris-text bg-polaris-surface hover:bg-polaris-surface-hovered transition-colors cursor-pointer">{t("admin:settings.homepage.uploadImage")}</button>
                    <input ref={(el) => { fileInputRefs.current[`hero-poster-${idx}`] = el; }} type="file" accept="image/*" className="hidden" onChange={() => handleImageUpload(`hero-poster-${idx}`, (url) => updateSlide(idx, "posterUrl", url))} />
                  </div>
                </Field>
              </>
            ) : (
              <div className="flex items-center gap-3">
                {slide.imageUrl && (
                  <div className="relative h-16 w-28 rounded overflow-hidden bg-polaris-bg border border-polaris-border">
                    <Image src={slide.imageUrl.startsWith("/") ? `${BASE_URL}${slide.imageUrl}` : slide.imageUrl} alt="" fill className="object-cover" unoptimized />
                  </div>
                )}
                <div>
                  <button type="button" onClick={() => fileInputRefs.current[`hero-${idx}`]?.click()} className="px-3 py-1.5 text-xs font-medium rounded border border-polaris-border text-polaris-text bg-polaris-surface hover:bg-polaris-surface-hovered transition-colors cursor-pointer">{t("admin:settings.homepage.uploadImage")}</button>
                  <input ref={(el) => { fileInputRefs.current[`hero-${idx}`] = el; }} type="file" accept="image/*" className="hidden" onChange={() => handleImageUpload(`hero-${idx}`, (url) => updateSlide(idx, "imageUrl", url))} />
                </div>
              </div>
            )}
          </div>
        ))}
      </Collapsible>

      {/* ── Promo Banner ────────────────────────────────────────────────── */}
      <Collapsible title={t("admin:settings.homepage.promoSection")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t("admin:settings.homepage.promoTitleLabel")}><input className={inputClasses} value={promoTitle} onChange={(e) => setPromoTitle(e.target.value)} /></Field>
          <Field label={t("admin:settings.homepage.promoSubtitleLabel")}><input className={inputClasses} value={promoSubtitle} onChange={(e) => setPromoSubtitle(e.target.value)} /></Field>
          <Field label={t("admin:settings.homepage.promoCtaTextLabel")}><input className={inputClasses} value={promoCtaText} onChange={(e) => setPromoCtaText(e.target.value)} /></Field>
          <Field label={t("admin:settings.homepage.promoCtaLinkLabel")}><input className={inputClasses} value={promoCtaLink} onChange={(e) => setPromoCtaLink(e.target.value)} /></Field>
        </div>
        <Field label={t("admin:settings.homepage.promoCountdownLabel")} help={t("admin:settings.homepage.promoCountdownHelp")}>
          <input type="datetime-local" className={inputClasses} value={promoCountdown} onChange={(e) => setPromoCountdown(e.target.value)} />
        </Field>
        <Field label={t("admin:settings.homepage.promoImageLabel")}>
          <div className="flex items-center gap-3">
            {promoImage && (
              <div className="relative h-16 w-28 rounded overflow-hidden bg-polaris-bg border border-polaris-border">
                <Image src={promoImage.startsWith("/") ? `${BASE_URL}${promoImage}` : promoImage} alt="" fill className="object-cover" unoptimized />
              </div>
            )}
            <button type="button" onClick={() => fileInputRefs.current["promo-banner"]?.click()} className="px-3 py-1.5 text-xs font-medium rounded border border-polaris-border text-polaris-text bg-polaris-surface hover:bg-polaris-surface-hovered transition-colors cursor-pointer">{t("admin:settings.homepage.uploadImage")}</button>
            <input ref={(el) => { fileInputRefs.current["promo-banner"] = el; }} type="file" accept="image/*" className="hidden" onChange={() => handleImageUpload("promo-banner", setPromoImage)} />
          </div>
        </Field>
      </Collapsible>

      {/* ── Featured Products ───────────────────────────────────────────── */}
      <Collapsible title={t("admin:settings.homepage.featuredSection")}>
        <Field label={t("admin:settings.homepage.featuredTitleLabel")}>
          <input className={inputClasses} value={fpTitle} onChange={(e) => setFpTitle(e.target.value)} placeholder={t("admin:settings.homepage.featuredTitlePlaceholder")} />
        </Field>
        <Field label={t("admin:settings.homepage.featuredModeLabel")}>
          <select className={selectClasses} value={fpMode} onChange={(e) => setFpMode(e.target.value as "auto" | "manual")}>
            <option value="auto">{t("admin:settings.homepage.featuredModeAuto")}</option>
            <option value="manual">{t("admin:settings.homepage.featuredModeManual")}</option>
          </select>
        </Field>
        {fpMode === "auto" && (
          <Field label={t("admin:settings.homepage.featuredSortLabel")}>
            <select className={selectClasses} value={fpSort} onChange={(e) => setFpSort(e.target.value as "newest" | "bestseller" | "rating")}>
              <option value="newest">{t("admin:settings.homepage.featuredSortNewest")}</option>
              <option value="bestseller">{t("admin:settings.homepage.featuredSortBestseller")}</option>
              <option value="rating">{t("admin:settings.homepage.featuredSortRating")}</option>
            </select>
          </Field>
        )}
        <Field label={t("admin:settings.homepage.featuredLimitLabel")}>
          <select className={selectClasses} value={fpLimit} onChange={(e) => setFpLimit(parseInt(e.target.value, 10) || 8)}>
            {[4, 6, 8, 10, 12].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        {fpMode === "manual" && (
          <Field label={t("admin:settings.homepage.featuredProductIdsLabel")} help={t("admin:settings.homepage.featuredProductIdsHelp")}>
            <input className={inputClasses} value={fpIds} onChange={(e) => setFpIds(e.target.value)} />
          </Field>
        )}
      </Collapsible>

      {/* ── Collections Grid ────────────────────────────────────────────── */}
      <Collapsible title={t("admin:settings.homepage.collectionsSection")}>
        <Field label={t("admin:settings.homepage.collectionsTitleLabel")}>
          <input className={inputClasses} value={colTitle} onChange={(e) => setColTitle(e.target.value)} placeholder={t("admin:settings.homepage.collectionsTitlePlaceholder")} />
        </Field>
        <Field label={t("admin:settings.homepage.collectionsLimitLabel")}>
          <select className={selectClasses} value={colLimit} onChange={(e) => setColLimit(parseInt(e.target.value, 10) || 4)}>
            {[3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        <Field label={t("admin:settings.homepage.collectionsCategoryIdsLabel")} help={t("admin:settings.homepage.collectionsCategoryIdsHelp")}>
          <input className={inputClasses} value={colIds} onChange={(e) => setColIds(e.target.value)} />
        </Field>
        <Field label={t("admin:settings.homepage.collectionsDisplayModeLabel")}>
          <select className={selectClasses} value={colDisplayMode} onChange={(e) => setColDisplayMode(e.target.value as "grid" | "slider")}>
            <option value="grid">{t("admin:settings.homepage.collectionsDisplayGrid")}</option>
            <option value="slider">{t("admin:settings.homepage.collectionsDisplaySlider")}</option>
          </select>
        </Field>
      </Collapsible>

      {/* ── New Arrivals ────────────────────────────────────────────────── */}
      <Collapsible title={t("admin:settings.homepage.newArrivalsSection")}>
        <Field label={t("admin:settings.homepage.newArrivalsTitleLabel")}>
          <input className={inputClasses} value={naTitle} onChange={(e) => setNaTitle(e.target.value)} placeholder={t("admin:settings.homepage.newArrivalsTitlePlaceholder")} />
        </Field>
        <Field label={t("admin:settings.homepage.newArrivalsLimitLabel")}>
          <select className={selectClasses} value={naLimit} onChange={(e) => setNaLimit(parseInt(e.target.value, 10) || 4)}>
            {[4, 6, 8].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
      </Collapsible>

      {/* ── Testimonials ────────────────────────────────────────────────── */}
      <Collapsible title={t("admin:settings.homepage.testimonialsSection")}>
        <Field label={t("admin:settings.homepage.testimonialsTitleLabel")}>
          <input className={inputClasses} value={testTitle} onChange={(e) => setTestTitle(e.target.value)} placeholder={t("admin:settings.homepage.testimonialsTitlePlaceholder")} />
        </Field>
        <Field label={t("admin:settings.homepage.testimonialsModeLabel")}>
          <select className={selectClasses} value={testMode} onChange={(e) => setTestMode(e.target.value as "auto" | "manual")}>
            <option value="auto">{t("admin:settings.homepage.testimonialsModeAuto")}</option>
            <option value="manual">{t("admin:settings.homepage.testimonialsModeManual")}</option>
          </select>
        </Field>
        {testMode === "manual" && (
          <>
            <div className="flex items-center justify-end">
              <button type="button" onClick={() => { if (testItems.length < 6) setTestItems((p) => [...p, { ...EMPTY_TESTIMONIAL }]); }} disabled={testItems.length >= 6} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded border border-polaris-border text-polaris-text bg-polaris-surface hover:bg-polaris-surface-hovered disabled:opacity-50 transition-colors cursor-pointer">
                <Plus className="h-3.5 w-3.5" /> {t("admin:settings.homepage.addTestimonial")}
              </button>
            </div>
            {testItems.length === 0 && <p className="text-sm text-polaris-text-subdued py-4 text-center">{t("admin:settings.homepage.noTestimonials")}</p>}
            {testItems.map((item, idx) => (
              <div key={idx} className="border border-polaris-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-polaris-text-subdued">{t("admin:settings.homepage.testimonialNumber", { n: idx + 1 })}</span>
                  <button type="button" onClick={() => setTestItems((p) => p.filter((_, i) => i !== idx))} className="text-polaris-critical hover:text-[#BC2200] cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label={t("admin:settings.homepage.testimonialNameLabel")}><input className={inputClasses} value={item.name} onChange={(e) => setTestItems((p) => p.map((t2, i) => i === idx ? { ...t2, name: e.target.value } : t2))} /></Field>
                  <Field label={t("admin:settings.homepage.testimonialLocationLabel")}><input className={inputClasses} value={item.location} onChange={(e) => setTestItems((p) => p.map((t2, i) => i === idx ? { ...t2, location: e.target.value } : t2))} /></Field>
                </div>
                <Field label={t("admin:settings.homepage.testimonialQuoteLabel")}><textarea className={textareaClasses} rows={2} value={item.quote} onChange={(e) => setTestItems((p) => p.map((t2, i) => i === idx ? { ...t2, quote: e.target.value } : t2))} /></Field>
                <Field label={t("admin:settings.homepage.testimonialRatingLabel")}>
                  <select className={selectClasses} value={item.rating} onChange={(e) => setTestItems((p) => p.map((t2, i) => i === idx ? { ...t2, rating: parseInt(e.target.value, 10) || 5 } : t2))}>
                    {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} / 5</option>)}
                  </select>
                </Field>
                <Field label={t("admin:settings.homepage.testimonialAvatarLabel")}>
                  <div className="flex items-center gap-3">
                    {item.avatar && (
                      <div className="relative h-10 w-10 rounded overflow-hidden bg-polaris-bg border border-polaris-border">
                        <Image src={item.avatar.startsWith("/") ? `${BASE_URL}${item.avatar}` : item.avatar} alt="" fill className="object-cover" unoptimized />
                      </div>
                    )}
                    <button type="button" onClick={() => fileInputRefs.current[`testimonial-${idx}`]?.click()} className="px-3 py-1.5 text-xs font-medium rounded border border-polaris-border text-polaris-text bg-polaris-surface hover:bg-polaris-surface-hovered transition-colors cursor-pointer">{t("admin:settings.homepage.uploadImage")}</button>
                    <input ref={(el) => { fileInputRefs.current[`testimonial-${idx}`] = el; }} type="file" accept="image/*" className="hidden" onChange={() => handleImageUpload(`testimonial-${idx}`, (url) => setTestItems((p) => p.map((t2, i) => i === idx ? { ...t2, avatar: url } : t2)))} />
                  </div>
                </Field>
              </div>
            ))}
          </>
        )}
      </Collapsible>

      {/* ── Brand Story ─────────────────────────────────────────────────── */}
      <Collapsible title={t("admin:settings.homepage.brandStorySection")}>
        <Field label={t("admin:settings.homepage.brandStoryTitleLabel")}>
          <input className={inputClasses} value={bsTitle} onChange={(e) => setBsTitle(e.target.value)} placeholder={t("admin:settings.homepage.brandStoryTitlePlaceholder")} />
        </Field>
        <Field label={t("admin:settings.homepage.brandStoryBodyLabel")}>
          <textarea className={textareaClasses} rows={4} value={bsBody} onChange={(e) => setBsBody(e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t("admin:settings.homepage.brandStoryCtaTextLabel")}><input className={inputClasses} value={bsCtaText} onChange={(e) => setBsCtaText(e.target.value)} /></Field>
          <Field label={t("admin:settings.homepage.brandStoryCtaLinkLabel")}><input className={inputClasses} value={bsCtaLink} onChange={(e) => setBsCtaLink(e.target.value)} /></Field>
        </div>
        <Field label={t("admin:settings.homepage.brandStoryImagePositionLabel")}>
          <select className={selectClasses} value={bsPosition} onChange={(e) => setBsPosition(e.target.value as "left" | "right")}>
            <option value="left">{t("admin:settings.homepage.brandStoryImageLeft")}</option>
            <option value="right">{t("admin:settings.homepage.brandStoryImageRight")}</option>
          </select>
        </Field>
        <Field label={t("admin:settings.homepage.brandStoryImageLabel")}>
          <div className="flex items-center gap-3">
            {bsImage && (
              <div className="relative h-16 w-28 rounded overflow-hidden bg-polaris-bg border border-polaris-border">
                <Image src={bsImage.startsWith("/") ? `${BASE_URL}${bsImage}` : bsImage} alt="" fill className="object-cover" unoptimized />
              </div>
            )}
            <button type="button" onClick={() => fileInputRefs.current["brand-story"]?.click()} className="px-3 py-1.5 text-xs font-medium rounded border border-polaris-border text-polaris-text bg-polaris-surface hover:bg-polaris-surface-hovered transition-colors cursor-pointer">{t("admin:settings.homepage.uploadImage")}</button>
            <input ref={(el) => { fileInputRefs.current["brand-story"] = el; }} type="file" accept="image/*" className="hidden" onChange={() => handleImageUpload("brand-story", setBsImage)} />
          </div>
        </Field>
      </Collapsible>

      {/* ── Trust Bar ───────────────────────────────────────────────────── */}
      <Collapsible title={t("admin:settings.homepage.trustBarSection")}>
        <div className="flex items-center justify-end">
          <button type="button" onClick={() => { if (trustItems.length < 5) setTrustItems((p) => [...p, { ...EMPTY_TRUST_ITEM }]); }} disabled={trustItems.length >= 5} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded border border-polaris-border text-polaris-text bg-polaris-surface hover:bg-polaris-surface-hovered disabled:opacity-50 transition-colors cursor-pointer">
            <Plus className="h-3.5 w-3.5" /> {t("admin:settings.homepage.addTrustItem")}
          </button>
        </div>
        {trustItems.length === 0 && <p className="text-sm text-polaris-text-subdued py-4 text-center">{t("admin:settings.homepage.noTrustItems")}</p>}
        {trustItems.map((item, idx) => (
          <div key={idx} className="border border-polaris-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-polaris-text-subdued">{t("admin:settings.homepage.trustItemNumber", { n: idx + 1 })}</span>
              <button type="button" onClick={() => setTrustItems((p) => p.filter((_, i) => i !== idx))} className="text-polaris-critical hover:text-[#BC2200] cursor-pointer"><Trash2 className="h-4 w-4" /></button>
            </div>
            <Field label={t("admin:settings.homepage.trustItemIconLabel")}>
              <select className={selectClasses} value={item.icon} onChange={(e) => setTrustItems((p) => p.map((t2, i) => i === idx ? { ...t2, icon: e.target.value } : t2))}>
                {ICON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label={t("admin:settings.homepage.trustItemTitleLabel")}><input className={inputClasses} value={item.title} onChange={(e) => setTrustItems((p) => p.map((t2, i) => i === idx ? { ...t2, title: e.target.value } : t2))} /></Field>
            <Field label={t("admin:settings.homepage.trustItemDescLabel")}><input className={inputClasses} value={item.description} onChange={(e) => setTrustItems((p) => p.map((t2, i) => i === idx ? { ...t2, description: e.target.value } : t2))} /></Field>
          </div>
        ))}
      </Collapsible>

      {/* ── Newsletter ───────────────────────────────────────────────── */}
      <Collapsible title={t("admin:settings.homepage.newsletterSection")}>
        <Field label={t("admin:settings.homepage.newsletterTitleLabel")}>
          <input className={inputClasses} value={nlTitle} onChange={(e) => setNlTitle(e.target.value)} placeholder={t("admin:settings.homepage.newsletterTitlePlaceholder")} />
        </Field>
        <Field label={t("admin:settings.homepage.newsletterSubtitleLabel")}>
          <input className={inputClasses} value={nlSubtitle} onChange={(e) => setNlSubtitle(e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t("admin:settings.homepage.newsletterPlaceholderLabel")}>
            <input className={inputClasses} value={nlPlaceholder} onChange={(e) => setNlPlaceholder(e.target.value)} />
          </Field>
          <Field label={t("admin:settings.homepage.newsletterButtonLabel")}>
            <input className={inputClasses} value={nlButtonText} onChange={(e) => setNlButtonText(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("admin:settings.homepage.newsletterBgColorLabel")}>
            <div className="flex gap-2 items-center">
              <input type="color" value={nlBgColor} onChange={(e) => setNlBgColor(e.target.value)} className="h-9 w-12 rounded border border-[#C9CCCF] cursor-pointer" />
              <input className={inputClasses} value={nlBgColor} onChange={(e) => setNlBgColor(e.target.value)} />
            </div>
          </Field>
          <Field label={t("admin:settings.homepage.newsletterTextColorLabel")}>
            <div className="flex gap-2 items-center">
              <input type="color" value={nlTextColor} onChange={(e) => setNlTextColor(e.target.value)} className="h-9 w-12 rounded border border-[#C9CCCF] cursor-pointer" />
              <input className={inputClasses} value={nlTextColor} onChange={(e) => setNlTextColor(e.target.value)} />
            </div>
          </Field>
        </div>
      </Collapsible>

      {/* ── Instagram Feed ────────────────────────────────────────────── */}
      <Collapsible title={t("admin:settings.homepage.instagramSection")}>
        <Field label={t("admin:settings.homepage.instagramUsernameLabel")} help={t("admin:settings.homepage.instagramUsernameHelp")}>
          <input className={inputClasses} value={igUsername} onChange={(e) => setIgUsername(e.target.value)} placeholder="shopflow" />
        </Field>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-polaris-text">{t("admin:settings.homepage.instagramImagesLabel")}</span>
          <button type="button" onClick={() => { if (igImages.length < 6) setIgImages((p) => [...p, { ...EMPTY_IG_IMAGE }]); }} disabled={igImages.length >= 6} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded border border-polaris-border text-polaris-text bg-polaris-surface hover:bg-polaris-surface-hovered disabled:opacity-50 transition-colors cursor-pointer">
            <Plus className="h-3.5 w-3.5" /> {t("admin:settings.homepage.addImage")}
          </button>
        </div>
        {igImages.map((img, idx) => (
          <div key={idx} className="border border-polaris-border rounded p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-polaris-text-subdued">{t("admin:settings.homepage.imageNumber", { n: idx + 1 })}</span>
              <button type="button" onClick={() => setIgImages((p) => p.filter((_, i) => i !== idx))} className="text-polaris-critical hover:text-[#BC2200] cursor-pointer"><Trash2 className="h-4 w-4" /></button>
            </div>
            <Field label={t("admin:settings.homepage.instagramImageUrlLabel")}><input className={inputClasses} value={img.url} onChange={(e) => setIgImages((p) => p.map((im, i) => i === idx ? { ...im, url: e.target.value } : im))} /></Field>
            <Field label={t("admin:settings.homepage.instagramImageLinkLabel")}><input className={inputClasses} value={img.link} onChange={(e) => setIgImages((p) => p.map((im, i) => i === idx ? { ...im, link: e.target.value } : im))} /></Field>
          </div>
        ))}
      </Collapsible>

      {/* ── Value Propositions ────────────────────────────────────────── */}
      <Collapsible title={t("admin:settings.homepage.valuePropsSection")}>
        <div className="flex items-center justify-end">
          <button type="button" onClick={() => { if (vpItems.length < 4) setVpItems((p) => [...p, { ...EMPTY_VP_ITEM }]); }} disabled={vpItems.length >= 4} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded border border-polaris-border text-polaris-text bg-polaris-surface hover:bg-polaris-surface-hovered disabled:opacity-50 transition-colors cursor-pointer">
            <Plus className="h-3.5 w-3.5" /> {t("admin:settings.homepage.addValueProp")}
          </button>
        </div>
        {vpItems.length === 0 && <p className="text-sm text-polaris-text-subdued py-4 text-center">{t("admin:settings.homepage.noValueProps")}</p>}
        {vpItems.map((item, idx) => (
          <div key={idx} className="border border-polaris-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-polaris-text-subdued">{t("admin:settings.homepage.valuePropNumber", { n: idx + 1 })}</span>
              <button type="button" onClick={() => setVpItems((p) => p.filter((_, i) => i !== idx))} className="text-polaris-critical hover:text-[#BC2200] cursor-pointer"><Trash2 className="h-4 w-4" /></button>
            </div>
            <Field label={t("admin:settings.homepage.valuePropIconLabel")}>
              <select className={selectClasses} value={item.icon} onChange={(e) => setVpItems((p) => p.map((v, i) => i === idx ? { ...v, icon: e.target.value } : v))}>
                {ICON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label={t("admin:settings.homepage.valuePropTitleLabel")}><input className={inputClasses} value={item.title} onChange={(e) => setVpItems((p) => p.map((v, i) => i === idx ? { ...v, title: e.target.value } : v))} /></Field>
            <Field label={t("admin:settings.homepage.valuePropDescLabel")}><input className={inputClasses} value={item.description} onChange={(e) => setVpItems((p) => p.map((v, i) => i === idx ? { ...v, description: e.target.value } : v))} /></Field>
          </div>
        ))}
      </Collapsible>

      {/* ── Partners ──────────────────────────────────────────────────── */}
      <Collapsible title={t("admin:settings.homepage.partnersSection")}>
        <div className="flex items-center justify-end">
          <button type="button" onClick={() => { if (partnerItems.length < 8) setPartnerItems((p) => [...p, { ...EMPTY_PARTNER }]); }} disabled={partnerItems.length >= 8} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded border border-polaris-border text-polaris-text bg-polaris-surface hover:bg-polaris-surface-hovered disabled:opacity-50 transition-colors cursor-pointer">
            <Plus className="h-3.5 w-3.5" /> {t("admin:settings.homepage.addPartner")}
          </button>
        </div>
        {partnerItems.length === 0 && <p className="text-sm text-polaris-text-subdued py-4 text-center">{t("admin:settings.homepage.noPartners")}</p>}
        {partnerItems.map((item, idx) => (
          <div key={idx} className="border border-polaris-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-polaris-text-subdued">{t("admin:settings.homepage.partnerNumber", { n: idx + 1 })}</span>
              <button type="button" onClick={() => setPartnerItems((p) => p.filter((_, i) => i !== idx))} className="text-polaris-critical hover:text-[#BC2200] cursor-pointer"><Trash2 className="h-4 w-4" /></button>
            </div>
            <Field label={t("admin:settings.homepage.partnerNameLabel")}><input className={inputClasses} value={item.name} onChange={(e) => setPartnerItems((p) => p.map((pi, i) => i === idx ? { ...pi, name: e.target.value } : pi))} /></Field>
            <Field label={t("admin:settings.homepage.partnerLinkLabel")}><input className={inputClasses} value={item.link} onChange={(e) => setPartnerItems((p) => p.map((pi, i) => i === idx ? { ...pi, link: e.target.value } : pi))} /></Field>
            <Field label={t("admin:settings.homepage.partnerImageLabel")}>
              <div className="flex items-center gap-3">
                {item.imageUrl && (
                  <div className="relative h-10 w-24 rounded overflow-hidden bg-polaris-bg border border-polaris-border">
                    <Image src={item.imageUrl.startsWith("/") ? `${BASE_URL}${item.imageUrl}` : item.imageUrl} alt="" fill className="object-contain" unoptimized />
                  </div>
                )}
                <button type="button" onClick={() => fileInputRefs.current[`partner-${idx}`]?.click()} className="px-3 py-1.5 text-xs font-medium rounded border border-polaris-border text-polaris-text bg-polaris-surface hover:bg-polaris-surface-hovered transition-colors cursor-pointer">{t("admin:settings.homepage.uploadImage")}</button>
                <input ref={(el) => { fileInputRefs.current[`partner-${idx}`] = el; }} type="file" accept="image/*" className="hidden" onChange={() => handleImageUpload(`partner-${idx}`, (url) => setPartnerItems((p) => p.map((pi, i) => i === idx ? { ...pi, imageUrl: url } : pi)))} />
              </div>
            </Field>
          </div>
        ))}
      </Collapsible>

      {/* ── Popup / Modal ─────────────────────────────────────────────── */}
      <Collapsible title={t("admin:settings.homepage.popupSection")}>
        <ToggleField id="popup-enabled" label={t("admin:settings.homepage.popupEnabledLabel")} help={t("admin:settings.homepage.popupEnabledHelp")} checked={popupEnabled} onCheckedChange={setPopupEnabled} />
        <Field label={t("admin:settings.homepage.popupTitleLabel")}><input className={inputClasses} value={popupTitle} onChange={(e) => setPopupTitle(e.target.value)} /></Field>
        <Field label={t("admin:settings.homepage.popupBodyLabel")}><textarea className={textareaClasses} rows={3} value={popupBody} onChange={(e) => setPopupBody(e.target.value)} /></Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t("admin:settings.homepage.popupCtaTextLabel")}><input className={inputClasses} value={popupCtaText} onChange={(e) => setPopupCtaText(e.target.value)} /></Field>
          <Field label={t("admin:settings.homepage.popupCtaLinkLabel")}><input className={inputClasses} value={popupCtaLink} onChange={(e) => setPopupCtaLink(e.target.value)} placeholder="/products" /></Field>
        </div>
        <Field label={t("admin:settings.homepage.popupImageLabel")}>
          <div className="flex items-center gap-3">
            {popupImage && (
              <div className="relative h-16 w-28 rounded overflow-hidden bg-polaris-bg border border-polaris-border">
                <Image src={popupImage.startsWith("/") ? `${BASE_URL}${popupImage}` : popupImage} alt="" fill className="object-cover" unoptimized />
              </div>
            )}
            <button type="button" onClick={() => fileInputRefs.current["popup-image"]?.click()} className="px-3 py-1.5 text-xs font-medium rounded border border-polaris-border text-polaris-text bg-polaris-surface hover:bg-polaris-surface-hovered transition-colors cursor-pointer">{t("admin:settings.homepage.uploadImage")}</button>
            <input ref={(el) => { fileInputRefs.current["popup-image"] = el; }} type="file" accept="image/*" className="hidden" onChange={() => handleImageUpload("popup-image", setPopupImage)} />
          </div>
        </Field>
        <Field label={t("admin:settings.homepage.popupTriggerLabel")}>
          <select className={selectClasses} value={popupTrigger} onChange={(e) => setPopupTrigger(e.target.value as "exit" | "timed" | "scroll")}>
            <option value="timed">{t("admin:settings.homepage.popupTriggerTimed")}</option>
            <option value="scroll">{t("admin:settings.homepage.popupTriggerScroll")}</option>
            <option value="exit">{t("admin:settings.homepage.popupTriggerExit")}</option>
          </select>
        </Field>
        {popupTrigger === "timed" && (
          <Field label={t("admin:settings.homepage.popupDelayLabel")} help={t("admin:settings.homepage.popupDelayHelp")}>
            <input type="number" min={1} max={60} className={inputClasses} value={popupDelay} onChange={(e) => setPopupDelay(parseInt(e.target.value, 10) || 5)} />
          </Field>
        )}
        {popupTrigger === "scroll" && (
          <Field label={t("admin:settings.homepage.popupScrollLabel")} help={t("admin:settings.homepage.popupScrollHelp")}>
            <input type="number" min={10} max={100} className={inputClasses} value={popupScrollPercent} onChange={(e) => setPopupScrollPercent(parseInt(e.target.value, 10) || 50)} />
          </Field>
        )}
        <Field label={t("admin:settings.homepage.popupFrequencyLabel")}>
          <select className={selectClasses} value={popupFrequency} onChange={(e) => setPopupFrequency(e.target.value as "once" | "session" | "daily")}>
            <option value="session">{t("admin:settings.homepage.popupFrequencySession")}</option>
            <option value="daily">{t("admin:settings.homepage.popupFrequencyDaily")}</option>
            <option value="once">{t("admin:settings.homepage.popupFrequencyOnce")}</option>
          </select>
        </Field>
      </Collapsible>

      </>)}{/* end dynamic-only panels */}

      {/* ── Save ────────────────────────────────────────────────────────── */}
      <div className={sectionClasses}>
        <SaveButton onClick={handleSave} isSaving={isSaving} t={t} />
      </div>
    </div>
  );
}

// ─── Typography Tab ──────────────────────────────────────────────────────────

const HEADING_FONTS = [
  "", "DM Serif Display", "Playfair Display", "Cormorant Garamond", "Bodoni Moda",
  "Libre Baskerville", "Lora", "Noto Serif", "EB Garamond", "Crimson Text", "Source Serif 4",
];

const BODY_FONTS = [
  "", "DM Sans", "Inter", "Nunito Sans", "Lato", "Open Sans",
  "Raleway", "Montserrat", "Work Sans", "Poppins", "Source Sans 3",
];

function TypographyTab({ settings, onSave, isSaving, t }: TabProps) {
  const defaults: TypographySettings = {
    headingFont: "", bodyFont: "", baseFontSize: 16,
    headingLetterSpacing: 0.18, headingTextTransform: "uppercase",
  };
  const [form, setForm] = useState<TypographySettings>({ ...defaults, ...settings.typography });

  return (
    <div className={cn(sectionClasses, "space-y-6")}>
      {/* Heading Font */}
      <Field label={t("admin:settings.typography.headingFontLabel")} help={t("admin:settings.typography.headingFontHelp")}>
        <select
          className={selectClasses}
          value={form.headingFont}
          onChange={(e) => setForm((prev) => ({ ...prev, headingFont: e.target.value }))}
        >
          <option value="">{t("admin:settings.typography.defaultFont")}</option>
          {HEADING_FONTS.filter(Boolean).map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </Field>

      {/* Body Font */}
      <Field label={t("admin:settings.typography.bodyFontLabel")} help={t("admin:settings.typography.bodyFontHelp")}>
        <select
          className={selectClasses}
          value={form.bodyFont}
          onChange={(e) => setForm((prev) => ({ ...prev, bodyFont: e.target.value }))}
        >
          <option value="">{t("admin:settings.typography.defaultFont")}</option>
          {BODY_FONTS.filter(Boolean).map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </Field>

      {/* Base Font Size */}
      <Field label={t("admin:settings.typography.baseFontSizeLabel")} help={t("admin:settings.typography.baseFontSizeHelp")}>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="14"
            max="20"
            step="1"
            value={form.baseFontSize}
            onChange={(e) => setForm((prev) => ({ ...prev, baseFontSize: parseInt(e.target.value, 10) }))}
            className="flex-1 accent-polaris-primary"
          />
          <span className="text-sm font-medium text-polaris-text w-12 text-right">{form.baseFontSize}px</span>
        </div>
      </Field>

      {/* Heading Letter Spacing */}
      <Field label={t("admin:settings.typography.headingSpacingLabel")} help={t("admin:settings.typography.headingSpacingHelp")}>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="0.3"
            step="0.01"
            value={form.headingLetterSpacing}
            onChange={(e) => setForm((prev) => ({ ...prev, headingLetterSpacing: parseFloat(e.target.value) }))}
            className="flex-1 accent-polaris-primary"
          />
          <span className="text-sm font-medium text-polaris-text w-16 text-right">{form.headingLetterSpacing.toFixed(2)}em</span>
        </div>
      </Field>

      {/* Heading Text Transform */}
      <Field label={t("admin:settings.typography.headingTransformLabel")}>
        <div className="flex gap-3">
          {(["uppercase", "none"] as const).map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, headingTextTransform: val }))}
              className={cn(
                "px-4 py-2 text-sm rounded border transition-colors cursor-pointer",
                form.headingTextTransform === val
                  ? "border-polaris-primary bg-polaris-primary/10 text-polaris-primary font-medium"
                  : "border-polaris-border text-polaris-text-subdued hover:border-polaris-text"
              )}
            >
              {val === "uppercase" ? t("admin:settings.typography.uppercase") : t("admin:settings.typography.none")}
            </button>
          ))}
        </div>
      </Field>

      {/* Live Preview */}
      <div className="border border-polaris-border rounded-lg p-6 bg-polaris-surface">
        <p className="text-xs text-polaris-text-subdued uppercase tracking-wide mb-3">{t("admin:settings.typography.preview")}</p>
        <h3
          className="text-2xl font-medium mb-2"
          style={{
            fontFamily: form.headingFont ? `"${form.headingFont}", serif` : "var(--font-heading), serif",
            letterSpacing: `${form.headingLetterSpacing}em`,
            textTransform: form.headingTextTransform,
          }}
        >
          {t("admin:settings.typography.previewHeading")}
        </h3>
        <p
          className="text-polaris-text-subdued leading-relaxed"
          style={{
            fontFamily: form.bodyFont ? `"${form.bodyFont}", sans-serif` : "var(--font-body), sans-serif",
            fontSize: `${form.baseFontSize}px`,
          }}
        >
          {t("admin:settings.typography.previewBody")}
        </p>
      </div>

      <SaveButton onClick={() => onSave(form)} isSaving={isSaving} t={t} />
    </div>
  );
}

// ─── Colors Tab ──────────────────────────────────────────────────────────────

const COLOR_PRESETS: Record<string, Omit<ColorPaletteSettings, "preset">> = {
  classic: {
    bg: "#FFFFFF", bgAlt: "#F7F5F3", text: "#1C1C1C", textMuted: "#71717A",
    dark: "#1C1C1C", accentText: "#FFFFFF", border: "#E5E5E5", sale: "#DC2626",
  },
  warmIvory: {
    bg: "#FFFDF5", bgAlt: "#F5F0E8", text: "#3D3426", textMuted: "#8C7E6A",
    dark: "#3D3426", accentText: "#FFFDF5", border: "#E8DFD0", sale: "#C73030",
  },
  coolSlate: {
    bg: "#F8FAFC", bgAlt: "#F1F5F9", text: "#1E293B", textMuted: "#64748B",
    dark: "#1E293B", accentText: "#F8FAFC", border: "#E2E8F0", sale: "#EF4444",
  },
  midnight: {
    bg: "#111111", bgAlt: "#1A1A1A", text: "#F5F5F5", textMuted: "#A3A3A3",
    dark: "#F5F5F5", accentText: "#111111", border: "#2E2E2E", sale: "#F87171",
  },
  blushRose: {
    bg: "#FFFBFC", bgAlt: "#FFF1F3", text: "#3D1F25", textMuted: "#9B7078",
    dark: "#3D1F25", accentText: "#FFFBFC", border: "#F5DFE3", sale: "#E11D48",
  },
};

const COLOR_FIELDS: { key: keyof Omit<ColorPaletteSettings, "preset">; labelKey: string }[] = [
  { key: "bg", labelKey: "admin:settings.colors.bgLabel" },
  { key: "bgAlt", labelKey: "admin:settings.colors.bgAltLabel" },
  { key: "text", labelKey: "admin:settings.colors.textLabel" },
  { key: "textMuted", labelKey: "admin:settings.colors.textMutedLabel" },
  { key: "dark", labelKey: "admin:settings.colors.darkLabel" },
  { key: "accentText", labelKey: "admin:settings.colors.accentTextLabel" },
  { key: "border", labelKey: "admin:settings.colors.borderLabel" },
  { key: "sale", labelKey: "admin:settings.colors.saleLabel" },
];

function ColorsTab({ settings, onSave, isSaving, t }: TabProps) {
  const defaults: ColorPaletteSettings = { preset: "classic", ...COLOR_PRESETS.classic };
  const [form, setForm] = useState<ColorPaletteSettings>({ ...defaults, ...settings.colorPalette });

  const applyPreset = (presetKey: string) => {
    const preset = COLOR_PRESETS[presetKey];
    if (preset) {
      setForm({ preset: presetKey, ...preset });
    }
  };

  const setColor = (key: keyof Omit<ColorPaletteSettings, "preset">, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val, preset: "custom" }));
  };

  return (
    <div className={cn(sectionClasses, "space-y-6")}>
      {/* Preset Selector */}
      <div>
        <Label className="text-sm font-medium text-polaris-text mb-3 block">{t("admin:settings.colors.presetLabel")}</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Object.entries(COLOR_PRESETS).map(([key, colors]) => (
            <button
              key={key}
              type="button"
              onClick={() => applyPreset(key)}
              className={cn(
                "relative flex flex-col items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer",
                form.preset === key
                  ? "border-polaris-primary ring-1 ring-polaris-primary"
                  : "border-polaris-border hover:border-polaris-text"
              )}
            >
              {/* Color swatch preview */}
              <div className="flex w-full h-6 rounded overflow-hidden">
                <div style={{ background: colors.bg }} className="flex-1" />
                <div style={{ background: colors.bgAlt }} className="flex-1" />
                <div style={{ background: colors.dark }} className="flex-1" />
                <div style={{ background: colors.text }} className="flex-1" />
                <div style={{ background: colors.sale }} className="flex-1" />
              </div>
              <span className="text-xs text-polaris-text capitalize">{t(`admin:settings.colors.preset_${key}`)}</span>
              {form.preset === key && (
                <Check className="absolute top-1 right-1 w-3.5 h-3.5 text-polaris-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Individual Color Pickers */}
      <div>
        <Label className="text-sm font-medium text-polaris-text mb-3 block">{t("admin:settings.colors.customizeLabel")}</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {COLOR_FIELDS.map(({ key, labelKey }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs text-polaris-text-subdued">{t(labelKey)}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form[key]}
                  onChange={(e) => setColor(key, e.target.value)}
                  className="w-9 h-9 rounded border border-polaris-border cursor-pointer p-0.5"
                />
                <input
                  className={cn(inputClasses, "flex-1 font-mono text-xs uppercase")}
                  value={form[key]}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
                      setForm((prev) => ({ ...prev, [key]: val, preset: "custom" }));
                    }
                  }}
                  maxLength={7}
                  placeholder="#000000"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Preview */}
      <div className="border border-polaris-border rounded-lg overflow-hidden">
        <p className="text-xs text-polaris-text-subdued uppercase tracking-wide px-4 pt-4 mb-3">{t("admin:settings.colors.preview")}</p>
        <div style={{ background: form.bg }} className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div style={{ background: form.dark, color: form.accentText }} className="px-4 py-2 text-sm font-medium">
                {t("admin:settings.colors.previewButton")}
              </div>
              <span style={{ color: form.sale }} className="text-sm font-medium">
                {t("admin:settings.colors.previewSale")}
              </span>
            </div>
            <h3 style={{ color: form.text }} className="text-lg font-medium">{t("admin:settings.colors.previewHeading")}</h3>
            <p style={{ color: form.textMuted }} className="text-sm">{t("admin:settings.colors.previewBody")}</p>
            <div style={{ background: form.bgAlt, borderColor: form.border }} className="p-4 border rounded">
              <p style={{ color: form.text }} className="text-sm">{t("admin:settings.colors.previewCard")}</p>
            </div>
          </div>
        </div>
      </div>

      <SaveButton onClick={() => onSave(form)} isSaving={isSaving} t={t} />
    </div>
  );
}

// ─── Email Templates Tab ───────────────────────────────────────────────────────

function EmailTemplatesTab({ settings, onSave, isSaving, t }: TabProps) {
  const [form, setForm] = useState(settings.emailTemplates ?? {
    orderConfirmationSubject: "",
    orderShippedSubject: "",
    orderDeliveredSubject: "",
    orderCancelledSubject: "",
    welcomeSubject: "",
    verificationSubject: "",
    passwordResetSubject: "",
  });
  const set = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  const fields = [
    { key: "orderConfirmationSubject", label: t("admin:settings.emailTemplates.orderConfirmationLabel") },
    { key: "orderShippedSubject", label: t("admin:settings.emailTemplates.orderShippedLabel") },
    { key: "orderDeliveredSubject", label: t("admin:settings.emailTemplates.orderDeliveredLabel") },
    { key: "orderCancelledSubject", label: t("admin:settings.emailTemplates.orderCancelledLabel") },
    { key: "welcomeSubject", label: t("admin:settings.emailTemplates.welcomeLabel") },
    { key: "verificationSubject", label: t("admin:settings.emailTemplates.verificationLabel") },
    { key: "passwordResetSubject", label: t("admin:settings.emailTemplates.passwordResetLabel") },
  ] as const;

  return (
    <div className={cn(sectionClasses, "space-y-4")}>
      <p className="text-xs text-polaris-text-subdued">{t("admin:settings.emailTemplates.help")}</p>
      {fields.map((field) => (
        <Field key={field.key} label={field.label}>
          <input
            className={inputClasses}
            value={form[field.key as keyof typeof form]}
            onChange={(e) => set(field.key, e.target.value)}
          />
        </Field>
      ))}
      <SaveButton onClick={() => onSave(form)} isSaving={isSaving} t={t} />
    </div>
  );
}

// ─── SMTP Tab ──────────────────────────────────────────────────────────────────

function SmtpTab({ settings, onSave, isSaving, t }: TabProps) {
  const { toast } = useToast();
  const [form, setForm] = useState(settings.smtp ?? {
    host: "",
    port: 587,
    secure: false,
    user: "",
    pass: "",
    fromName: "",
    fromEmail: "",
  });
  const [isTesting, setIsTesting] = useState(false);
  const set = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleTestEmail = async () => {
    setIsTesting(true);
    try {
      const res = await sendTestEmailAPI(form);
      toast({ title: t("admin:settings.smtp.testSuccess", { email: res.data.sentTo }) });
    } catch (err: unknown) {
      logger.error("sendTestEmail failed:", err);
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const msg = axiosErr?.response?.data?.error || t("admin:settings.smtp.testError");
      toast({ title: msg, variant: "destructive" });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className={cn(sectionClasses, "space-y-4")}>
      <p className="text-xs text-polaris-text-subdued">{t("admin:settings.smtp.help")}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t("admin:settings.smtp.hostLabel")}>
          <input className={inputClasses} value={form.host} onChange={(e) => set("host", e.target.value)} placeholder="smtp.gmail.com" />
        </Field>
        <Field label={t("admin:settings.smtp.portLabel")}>
          <input className={inputClasses} type="number" min="1" max="65535" value={form.port} onChange={(e) => setForm((prev) => ({ ...prev, port: parseInt(e.target.value) || 587 }))} />
        </Field>
        <Field label={t("admin:settings.smtp.userLabel")}>
          <input className={inputClasses} value={form.user} onChange={(e) => set("user", e.target.value)} placeholder="user@example.com" />
        </Field>
        <Field label={t("admin:settings.smtp.passLabel")}>
          <input className={inputClasses} type="password" value={form.pass} onChange={(e) => set("pass", e.target.value)} placeholder="••••••••" />
        </Field>
        <Field label={t("admin:settings.smtp.fromNameLabel")}>
          <input className={inputClasses} value={form.fromName} onChange={(e) => set("fromName", e.target.value)} placeholder="ShopFlow" />
        </Field>
        <Field label={t("admin:settings.smtp.fromEmailLabel")}>
          <input className={inputClasses} type="email" value={form.fromEmail} onChange={(e) => set("fromEmail", e.target.value)} placeholder="noreply@example.com" />
        </Field>
      </div>
      <ToggleField
        id="smtp-secure"
        label={t("admin:settings.smtp.secureLabel")}
        help={t("admin:settings.smtp.secureHelp")}
        checked={form.secure}
        onCheckedChange={(val) => setForm((prev) => ({ ...prev, secure: val }))}
      />
      <div className="flex items-center gap-3 pt-4 border-t border-polaris-border">
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium rounded bg-polaris-primary text-white hover:bg-polaris-primary-hovered disabled:opacity-50 transition-colors cursor-pointer"
        >
          {isSaving ? t("common:actions.saving") : t("common:actions.save")}
        </button>
        <button
          type="button"
          onClick={handleTestEmail}
          disabled={isTesting || !form.host}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded border border-polaris-border text-polaris-text bg-polaris-surface hover:bg-polaris-surface-hovered disabled:opacity-50 transition-colors cursor-pointer"
        >
          <Send className="h-3.5 w-3.5" />
          {isTesting ? t("common:actions.loading") : t("admin:settings.smtp.testButton")}
        </button>
      </div>
    </div>
  );
}
