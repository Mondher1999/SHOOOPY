"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Admin layout — redirects non-admin users.
 * Auth check is done client-side since tokens live in localStorage.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/auth/login");
      } else if (user.role !== "admin") {
        router.replace("/dashboard/profile");
      }
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  return <>{children}</>;
}
