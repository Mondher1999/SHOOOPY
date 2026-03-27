import type { Metadata } from "next";
import ShippingPolicyClient from "./ShippingPolicyClient";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description: "Learn about our shipping methods, delivery times, and shipping costs.",
  alternates: { canonical: "/shipping-policy" },
};

export default function ShippingPolicyPage() {
  return <ShippingPolicyClient />;
}
