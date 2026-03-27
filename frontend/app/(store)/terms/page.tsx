import type { Metadata } from "next";
import TermsClient from "./TermsClient";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Read our terms and conditions for using our services and placing orders.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <TermsClient />;
}
