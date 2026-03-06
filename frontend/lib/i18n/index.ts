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

// Guard against re-initialization in Next.js hot reload
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
    },
    lng: "en",
    fallbackLng: "en",
    defaultNS: "common",
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });
}

export default i18n;
