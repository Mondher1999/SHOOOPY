"use client";

import { useSettings } from "@/contexts/SettingsContext";

export default function MaintenancePage() {
  const { settings } = useSettings();
  const storeName = settings?.store?.name || "ShopFlow";
  const message = settings?.maintenance?.message || "We're currently performing maintenance. Please check back soon.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold mb-4">{storeName}</h1>
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="text-5xl mb-4" aria-hidden="true">🔧</div>
          <h2 className="text-xl font-semibold mb-3">Under Maintenance</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">{message}</p>
        </div>
      </div>
    </div>
  );
}
