import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import CategoriesListClient from "./CategoriesListClient";

const description = `Browse all product categories at ${SITE_NAME}. Find what you need with Cash on Delivery.`;

export const metadata: Metadata = {
  title: "All Categories",
  description,
  openGraph: {
    title: `All Categories | ${SITE_NAME}`,
    description,
    url: `${SITE_URL}/categories`,
  },
  alternates: { canonical: "/categories" },
};

export default function CategoriesPage() {
  return <CategoriesListClient />;
}
