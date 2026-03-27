import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review your cart items before checkout.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/cart" },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
