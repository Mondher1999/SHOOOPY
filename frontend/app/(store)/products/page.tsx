import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import ProductListClient from "./ProductListClient";

const description = `Browse all products available at ${SITE_NAME}. Find the best deals with Cash on Delivery.`;

export const metadata: Metadata = {
  title: "All Products",
  description,
  openGraph: {
    title: `All Products | ${SITE_NAME}`,
    description,
    url: `${SITE_URL}/products`,
  },
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  return <ProductListClient />;
}
