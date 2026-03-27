import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your order has been placed successfully.",
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
