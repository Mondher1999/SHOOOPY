/**
 * Shared color mapping for visual swatch dots across buyer and admin UIs.
 * Used by VariantSelector, SelectedOptionsSummary, CartDrawer, admin ProductForm, etc.
 */

export const COLOR_MAP: Record<string, string> = {
  // Core colors
  Black: "#000", White: "#fff", Red: "#ef4444", Blue: "#3b82f6",
  Green: "#22c55e", Yellow: "#eab308", Pink: "#ec4899", Purple: "#a855f7",
  Orange: "#f97316", Brown: "#92400e", Gray: "#6b7280", Navy: "#1e3a5f",
  Beige: "#d4c5a9", Burgundy: "#800020", Olive: "#808000", Silver: "#c0c0c0",
  Gold: "#d4af37", "Rose Gold": "#b76e79", Coral: "#ff7f50", Teal: "#008080",
  Ivory: "#fffff0", Cream: "#fffdd0", Khaki: "#c3b091", Maroon: "#800000",
  Mint: "#98ff98", Lavender: "#e6e6fa", Turquoise: "#40e0d0", Peach: "#ffcba4",
  Magenta: "#ff00ff", Indigo: "#4b0082", Cyan: "#00bcd4", Charcoal: "#36454f",
  // Wood / Material tones
  "Natural Wood": "#deb887", Walnut: "#5c4033", Oak: "#c8a951",
  Cherry: "#de3163", Mahogany: "#c04000", Tan: "#d2b48c",
  Natural: "#deb887", Terracotta: "#e2725b", Bamboo: "#e3d19f",
  // Metallic
  Chrome: "#dcdcdc", Carbon: "#2d2d2d", Bronze: "#cd7f32",
  Copper: "#b87333", Platinum: "#e5e4e2", "Brushed Steel": "#8e8e8e",
  // Special
  Multi: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
  Tortoise: "#8b4513", Clear: "transparent", Camo: "#556b2f",
  Sunburst: "linear-gradient(135deg, #d4af37, #92400e)",
  "Matte Black": "#28282b", "Glossy Black": "#0a0a0a",
};

/** Check if an attribute key represents a color attribute */
export function isColorAttr(key: string): boolean {
  return key.toLowerCase() === "color";
}

/** Get CSS background value for a color name, or undefined if not mapped */
export function getColorValue(colorName: string): string | undefined {
  return COLOR_MAP[colorName];
}
