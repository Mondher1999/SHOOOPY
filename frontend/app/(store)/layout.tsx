import { Header } from "@/components/layout/Header";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <footer className="border-t py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} ShopFlow. Cash on Delivery only.
        </div>
      </footer>
    </div>
  );
}
