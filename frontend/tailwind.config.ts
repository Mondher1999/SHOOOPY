import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        heading: ["var(--font-heading)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /* ── Polaris admin tokens ───────────────────────────────
           These reference CSS custom properties defined in globals.css
           under .admin-polaris / .dark .admin-polaris so they
           automatically switch between light and dark mode.          */
        polaris: {
          bg: "var(--polaris-bg)",
          surface: "var(--polaris-surface)",
          "surface-hovered": "var(--polaris-surface-hovered)",
          text: "var(--polaris-text)",
          "text-subdued": "var(--polaris-text-subdued)",
          icon: "var(--polaris-icon)",
          "icon-subdued": "var(--polaris-icon-subdued)",
          border: "var(--polaris-border)",
          "border-hovered": "var(--polaris-border-hovered)",
          "border-subdued": "var(--polaris-border-subdued)",
          primary: "var(--polaris-primary)",
          "primary-hovered": "var(--polaris-primary-hovered)",
          "primary-pressed": "var(--polaris-primary-pressed)",
          success: "var(--polaris-success)",
          "success-light": "var(--polaris-success-light)",
          critical: "var(--polaris-critical)",
          "critical-light": "var(--polaris-critical-light)",
          warning: "var(--polaris-warning)",
          "warning-light": "var(--polaris-warning-light)",
          info: "var(--polaris-info)",
          "info-light": "var(--polaris-info-light)",
          highlight: "var(--polaris-highlight)",
          "nav-bg": "var(--polaris-nav-bg)",
          "nav-item-hover": "var(--polaris-nav-item-hover)",
          "nav-item-active": "var(--polaris-nav-item-active)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        polaris: "0 0 0 1px rgba(63, 63, 68, 0.05), 0 1px 3px 0 rgba(63, 63, 68, 0.15)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
