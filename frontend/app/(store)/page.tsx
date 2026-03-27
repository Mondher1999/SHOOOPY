import type { Metadata } from "next";
import { serverFetchSettings } from "@/lib/server-api";
import { organizationSchema, websiteSchema, JsonLd, SITE_NAME, SITE_URL } from "@/lib/seo";
import { HomepageSections } from "@/components/home/HomepageSections";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await serverFetchSettings();
  const storeName = settings?.store?.name || SITE_NAME;
  const description = settings?.store?.description || "Shop online with Cash on Delivery. Browse products, add to cart, and pay when your order arrives.";

  return {
    title: { absolute: storeName },
    description,
    openGraph: {
      title: storeName,
      description,
      url: SITE_URL,
      images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: storeName }],
    },
    twitter: {
      card: "summary_large_image",
      title: storeName,
      description,
      images: [`${SITE_URL}/og-default.jpg`],
    },
    alternates: { canonical: "/" },
  };
}

export default async function HomePage() {
  const settings = await serverFetchSettings();
  const storeName = settings?.store?.name || SITE_NAME;

  return (
    <>
      <JsonLd data={organizationSchema(storeName, settings?.social)} />
      <JsonLd data={websiteSchema(storeName)} />
      <HomepageSections />
    </>
  );
}
