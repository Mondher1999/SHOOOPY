import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order with Cash on Delivery.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/checkout" },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
