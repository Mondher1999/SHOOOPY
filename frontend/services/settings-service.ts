import axiosInstance from "@/utils/axiosInstance";
import { fetchAPI } from "@/lib/api";
import type { SiteSettings, TestimonialItem, ProductTypeCatalog, NavigationSettings } from "@/types";

type SettingsResponse = { success: true; data: SiteSettings };

export async function getSettingsAPI(): Promise<SettingsResponse> {
  return fetchAPI<SettingsResponse>("/api/settings");
}

export async function updateSettingsAPI(
  payload: Partial<{
    store: Partial<SiteSettings["store"]>;
    orders: Partial<SiteSettings["orders"]>;
    notifications: Partial<SiteSettings["notifications"]>;
    products: Partial<SiteSettings["products"]>;
    social: Partial<SiteSettings["social"]>;
    legal: Partial<SiteSettings["legal"]>;
    seo: Partial<SiteSettings["seo"]>;
    maintenance: Partial<SiteSettings["maintenance"]>;
    homepage: Partial<SiteSettings["homepage"]>;
    navigation: Partial<NavigationSettings>;
    header: Partial<SiteSettings["header"]>;
    footer: Partial<SiteSettings["footer"]>;
    emailTemplates: Partial<SiteSettings["emailTemplates"]>;
    smtp: Partial<SiteSettings["smtp"]>;
    typography: Partial<SiteSettings["typography"]>;
    colorPalette: Partial<SiteSettings["colorPalette"]>;
  }>
): Promise<SettingsResponse> {
  const { data } = await axiosInstance.put<SettingsResponse>("/api/settings", payload);
  return data;
}

export async function uploadSettingsFileAPI(
  file: File,
  field: string
): Promise<{ success: true; data: SiteSettings | { url: string } }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("field", field);
  const { data } = await axiosInstance.post("/api/settings/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function getTopReviewsAPI(): Promise<{ success: true; data: TestimonialItem[] }> {
  return fetchAPI<{ success: true; data: TestimonialItem[] }>("/api/settings/top-reviews");
}

export async function sendTestEmailAPI(
  smtp?: Partial<SiteSettings["smtp"]>
): Promise<{ success: true; data: { messageId: string; sentTo: string } }> {
  const { data } = await axiosInstance.post("/api/settings/test-email", smtp ? { smtp } : {});
  return data;
}

export async function getProductTypeCatalogAPI(): Promise<{ success: true; data: ProductTypeCatalog }> {
  return fetchAPI<{ success: true; data: ProductTypeCatalog }>("/api/settings/product-types-catalog");
}

export async function getEnabledProductTypesAPI(): Promise<{ success: true; data: ProductTypeCatalog }> {
  return fetchAPI<{ success: true; data: ProductTypeCatalog }>("/api/settings/product-types");
}
