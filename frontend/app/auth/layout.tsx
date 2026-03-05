import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ShopFlow — Sign in",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
