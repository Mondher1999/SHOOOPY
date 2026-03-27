import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { ClientProviders } from "@/components/providers/ClientProviders";
import { Toaster } from "@/components/ui/toaster";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const DEFAULT_DESCRIPTION = "Shop online with Cash on Delivery. Browse products, add to cart, and pay when your order arrives.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Cash on Delivery Shopping`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    url: SITE_URL,
    title: `${SITE_NAME} — Cash on Delivery Shopping`,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Cash on Delivery Shopping`,
    description: DEFAULT_DESCRIPTION,
    images: [`${SITE_URL}/og-default.jpg`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const lang = cookieStore.get("shopflow_language")?.value || "fr";

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ClientProviders lang={lang}>
          {children}
          <Toaster />
        </ClientProviders>
      </body>
    </html>
  );
}
