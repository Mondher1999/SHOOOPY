import type { Metadata } from "next";
import { serverFetchCategoryBySlug, serverFetchSettings } from "@/lib/server-api";
import { breadcrumbSchema, JsonLd, SITE_URL, SITE_NAME } from "@/lib/seo";
import CategoryDetailClient from "./CategoryDetailClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await serverFetchCategoryBySlug(slug);
  if (!category) return { title: "Category Not Found", robots: { index: false } };

  const settings = await serverFetchSettings();
  const storeName = settings?.store?.name || SITE_NAME;
  const description = category.description?.slice(0, 160) || `Browse ${category.name} products at ${storeName}.`;
  const image = category.image ? `${API_URL}${category.image}` : undefined;

  return {
    title: category.name,
    description,
    openGraph: {
      title: category.name,
      description,
      url: `${SITE_URL}/categories/${category.slug}`,
      type: "website",
      siteName: storeName,
      images: image
        ? [{ url: image, alt: category.name }]
        : [{ url: `${SITE_URL}/og-default.jpg`, alt: storeName }],
    },
    alternates: {
      canonical: `/categories/${category.slug}`,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await serverFetchCategoryBySlug(slug);

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Categories", url: "/categories" },
    ...(category?.ancestors?.map((a: { name: string; slug: string }) => ({ name: a.name, url: `/categories/${a.slug}` })) ?? []),
    ...(category ? [{ name: category.name }] : []),
  ];

  return (
    <>
      {category && <JsonLd data={breadcrumbSchema(breadcrumbItems)} />}
      <CategoryDetailClient initialCategory={category} />
    </>
  );
}
