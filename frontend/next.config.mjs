import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["recharts", "lucide-react", "date-fns", "framer-motion"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5001",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_API_HOSTNAME || "localhost",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
