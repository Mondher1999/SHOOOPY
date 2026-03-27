import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { serverFetchProduct, serverFetchSettings } from "@/lib/server-api";
import { productSchema, breadcrumbSchema, JsonLd, SITE_URL, SITE_NAME } from "@/lib/seo";
import ProductDetailClient from "./ProductDetailClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await serverFetchProduct(slug);
  if (!product) return { title: "Product Not Found", robots: { index: false } };

  const settings = await serverFetchSettings();
  const storeName = settings?.store?.name || SITE_NAME;
  const image = product.images[0]
    ? `${API_URL}${product.images[0].large || product.images[0].original}`
    : undefined;
  const description = product.description?.slice(0, 160) || `Buy ${product.name} at ${storeName}. Cash on delivery available.`;

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      url: `${SITE_URL}/products/${product.slug}`,
      images: image ? [{ url: image, alt: product.name }] : [],
      type: "article",
      siteName: storeName,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: image ? [image] : [],
    },
    alternates: {
      canonical: `/products/${product.slug}`,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await serverFetchProduct(slug);
  if (!product) notFound();

  const settings = await serverFetchSettings();
  const storeName = settings?.store?.name || SITE_NAME;
  const currency = settings?.store?.currency || "USD";

  return (
    <>
      <JsonLd data={productSchema(product, storeName, currency)} />
      <JsonLd data={breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Products", url: "/products" },
        ...(product.category ? [{ name: product.category.name, url: `/categories/${product.category.slug}` }] : []),
        { name: product.name },
      ])} />
      <ProductDetailClient initialProduct={product} />
    </>
  );
}
