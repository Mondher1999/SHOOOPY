import type { Metadata } from "next";
import RefundPolicyClient from "./RefundPolicyClient";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Learn about our return and refund policies, including eligibility and process.",
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  return <RefundPolicyClient />;
}
