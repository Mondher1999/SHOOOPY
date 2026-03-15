import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en_auth from "./locales/en/auth.json";
import en_common from "./locales/en/common.json";
import en_dashboard from "./locales/en/dashboard.json";
import en_products from "./locales/en/products.json";
import en_categories from "./locales/en/categories.json";
import en_cart from "./locales/en/cart.json";
import en_checkout from "./locales/en/checkout.json";
import en_orders from "./locales/en/orders.json";
import en_reviews from "./locales/en/reviews.json";
import en_wishlist from "./locales/en/wishlist.json";
import en_admin from "./locales/en/admin.json";

import fr_auth from "./locales/fr/auth.json";
import fr_common from "./locales/fr/common.json";
import fr_dashboard from "./locales/fr/dashboard.json";
import fr_products from "./locales/fr/products.json";
import fr_categories from "./locales/fr/categories.json";
import fr_cart from "./locales/fr/cart.json";
import fr_checkout from "./locales/fr/checkout.json";
import fr_orders from "./locales/fr/orders.json";
import fr_reviews from "./locales/fr/reviews.json";
import fr_wishlist from "./locales/fr/wishlist.json";
import fr_admin from "./locales/fr/admin.json";

// Guard against re-initialization in Next.js hot reload
// Always start with "en" so SSR and initial client render match (no hydration mismatch).
// ClientProviders switches to the stored language after mount.
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: {
        auth: en_auth,
        common: en_common,
        dashboard: en_dashboard,
        products: en_products,
        categories: en_categories,
        cart: en_cart,
        checkout: en_checkout,
        orders: en_orders,
        reviews: en_reviews,
        wishlist: en_wishlist,
        admin: en_admin,
      },
      fr: {
        auth: fr_auth,
        common: fr_common,
        dashboard: fr_dashboard,
        products: fr_products,
        categories: fr_categories,
        cart: fr_cart,
        checkout: fr_checkout,
        orders: fr_orders,
        reviews: fr_reviews,
        wishlist: fr_wishlist,
        admin: fr_admin,
      },
    },
    lng: "en",
    fallbackLng: "en",
    defaultNS: "common",
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

  // Persist language changes to localStorage
  i18n.on("languageChanged", (lng: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("shopflow_language", lng);
      document.documentElement.lang = lng;
    }
  });
}

export default i18n;
