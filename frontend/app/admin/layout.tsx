"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Admin layout — redirects non-admin users, renders admin sidebar + topbar + content.
 * Dark mode is scoped here via .admin-polaris.dark — never leaks to the store.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/auth/login");
      } else if (user.role !== "admin") {
        router.replace("/dashboard/profile");
      }
    }
  }, [isLoading, user, router]);

  const rootClass = cn("admin-polaris flex min-h-screen", theme === "dark" && "dark");

  if (isLoading) {
    return (
      <div className={rootClass}>
        <aside className="hidden lg:flex w-60 flex-col bg-polaris-nav-bg p-4 gap-2">
          <Skeleton className="h-8 w-32 mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </aside>
        <div className="flex-1 flex flex-col">
          <Skeleton className="h-14 w-full" />
          <main className="flex-1 p-6 bg-background">
            <Skeleton className="h-8 w-48 mb-6" />
            <Skeleton className="h-64 w-full" />
          </main>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  return (
    <div className={rootClass}>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-auto">
        <AdminTopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 lg:p-5 p-4 overflow-auto bg-background">
          <div className="max-w-[1200px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
