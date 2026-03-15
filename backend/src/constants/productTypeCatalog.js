/**
 * Product Type Catalog — predefined product types with attribute definitions.
 * Admin selects which types they sell; products inherit dynamic attribute fields.
 *
 * Attribute types:
 *   "multi-select" — multiple options selectable (e.g., available sizes)
 *   "select"       — single option dropdown
 *   "text"         — free text input
 *   "number"       — numeric input with optional unit
 *   "boolean"      — yes/no toggle
 */

const PRODUCT_TYPE_CATALOG = {
  // ─── 1. Clothing ─────────────────────────────────────────────────────────────
  clothing: {
    label: "Clothing",
    icon: "Shirt",
    attributes: [
      {
        key: "size",
        label: "Size",
        type: "multi-select",
        options: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"],
        required: false,
      },
      {
        key: "color",
        label: "Color",
        type: "multi-select",
        options: [
          "Black", "White", "Red", "Blue", "Green", "Yellow", "Pink",
          "Purple", "Orange", "Brown", "Gray", "Navy", "Beige", "Burgundy", "Olive",
        ],
        required: false,
      },
      {
        key: "material",
        label: "Material",
        type: "select",
        options: [
          "Cotton", "Polyester", "Silk", "Wool", "Linen", "Denim",
          "Leather", "Nylon", "Cashmere", "Velvet", "Fleece", "Viscose",
        ],
        required: false,
      },
      {
        key: "gender",
        label: "Gender",
        type: "select",
        options: ["Men", "Women", "Unisex", "Kids", "Boys", "Girls"],
        required: false,
      },
      {
        key: "fit",
        label: "Fit",
        type: "select",
        options: ["Regular", "Slim", "Loose", "Oversized", "Relaxed"],
        required: false,
      },
    ],
  },

  // ─── 2. Shoes ────────────────────────────────────────────────────────────────
  shoes: {
    label: "Shoes",
    icon: "Footprints",
    attributes: [
      {
        key: "shoeSize",
        label: "Shoe Size (EU)",
        type: "multi-select",
        options: [
          "35", "36", "37", "38", "39", "40", "41", "42",
          "43", "44", "45", "46", "47", "48",
        ],
        required: false,
      },
      {
        key: "color",
        label: "Color",
        type: "multi-select",
        options: [
          "Black", "White", "Red", "Blue", "Green", "Brown",
          "Gray", "Navy", "Beige", "Pink", "Multi",
        ],
        required: false,
      },
      {
        key: "material",
        label: "Material",
        type: "select",
        options: ["Leather", "Suede", "Canvas", "Synthetic", "Mesh", "Rubber", "Textile"],
        required: false,
      },
      {
        key: "gender",
        label: "Gender",
        type: "select",
        options: ["Men", "Women", "Unisex", "Kids", "Boys", "Girls"],
        required: false,
      },
      {
        key: "style",
        label: "Style",
        type: "select",
        options: [
          "Sneakers", "Boots", "Sandals", "Loafers", "Heels",
          "Flats", "Running", "Formal", "Casual", "Slippers",
        ],
        required: false,
      },
    ],
  },

  // ─── 3. Electronics ──────────────────────────────────────────────────────────
  electronics: {
    label: "Electronics",
    icon: "Smartphone",
    attributes: [
      {
        key: "storage",
        label: "Storage",
        type: "select",
        options: ["16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "2TB"],
        required: false,
      },
      {
        key: "ram",
        label: "RAM",
        type: "select",
        options: ["2GB", "4GB", "6GB", "8GB", "12GB", "16GB", "32GB", "64GB"],
        required: false,
      },
      {
        key: "color",
        label: "Color",
        type: "multi-select",
        options: ["Black", "White", "Silver", "Gold", "Blue", "Red", "Green", "Gray"],
        required: false,
      },
      {
        key: "screenSize",
        label: "Screen Size",
        type: "text",
        unit: "inches",
        required: false,
      },
      {
        key: "batteryCapacity",
        label: "Battery Capacity",
        type: "number",
        unit: "mAh",
        required: false,
      },
      {
        key: "connectivity",
        label: "Connectivity",
        type: "multi-select",
        options: ["WiFi", "Bluetooth", "USB-C", "NFC", "5G", "4G LTE", "HDMI", "Lightning"],
        required: false,
      },
    ],
  },

  // ─── 4. Jewelry ──────────────────────────────────────────────────────────────
  jewelry: {
    label: "Jewelry",
    icon: "Gem",
    attributes: [
      {
        key: "ringSize",
        label: "Ring Size",
        type: "multi-select",
        options: [
          "44", "46", "48", "50", "52", "54", "56",
          "58", "60", "62", "64", "66", "68", "70", "72",
        ],
        required: false,
      },
      {
        key: "necklaceLength",
        label: "Necklace Length",
        type: "select",
        options: ["40cm", "45cm", "50cm", "55cm", "60cm", "70cm", "80cm", "90cm"],
        required: false,
      },
      {
        key: "material",
        label: "Material",
        type: "select",
        options: ["Gold", "Silver", "Platinum", "Stainless Steel", "Titanium", "Rose Gold", "White Gold", "Brass"],
        required: false,
      },
      {
        key: "gemstone",
        label: "Gemstone",
        type: "select",
        options: ["Diamond", "Ruby", "Sapphire", "Emerald", "Amethyst", "Pearl", "Topaz", "Opal", "None"],
        required: false,
      },
      {
        key: "weight",
        label: "Weight",
        type: "number",
        unit: "g",
        required: false,
      },
    ],
  },

  // ─── 5. Bags ─────────────────────────────────────────────────────────────────
  bags: {
    label: "Bags",
    icon: "ShoppingBag",
    attributes: [
      {
        key: "size",
        label: "Size",
        type: "select",
        options: ["Small", "Medium", "Large", "XL"],
        required: false,
      },
      {
        key: "color",
        label: "Color",
        type: "multi-select",
        options: [
          "Black", "White", "Brown", "Tan", "Red", "Blue",
          "Navy", "Gray", "Beige", "Pink", "Green",
        ],
        required: false,
      },
      {
        key: "material",
        label: "Material",
        type: "select",
        options: ["Leather", "Canvas", "Nylon", "Faux Leather", "Fabric", "Polyester", "Cotton"],
        required: false,
      },
      {
        key: "style",
        label: "Style",
        type: "select",
        options: ["Backpack", "Tote", "Crossbody", "Clutch", "Messenger", "Duffel", "Wallet", "Satchel"],
        required: false,
      },
    ],
  },

  // ─── 6. Beauty ───────────────────────────────────────────────────────────────
  beauty: {
    label: "Beauty & Cosmetics",
    icon: "Sparkles",
    attributes: [
      {
        key: "volume",
        label: "Volume",
        type: "number",
        unit: "ml",
        required: false,
      },
      {
        key: "shade",
        label: "Shade / Tint",
        type: "text",
        required: false,
      },
      {
        key: "skinType",
        label: "Skin Type",
        type: "select",
        options: ["Normal", "Dry", "Oily", "Combination", "Sensitive", "All"],
        required: false,
      },
      {
        key: "beautyCategory",
        label: "Category",
        type: "select",
        options: ["Skincare", "Makeup", "Hair Care", "Fragrance", "Body Care", "Nail Care"],
        required: false,
      },
    ],
  },

  // ─── 7. Watches ──────────────────────────────────────────────────────────────
  watches: {
    label: "Watches",
    icon: "Watch",
    attributes: [
      {
        key: "caseSize",
        label: "Case Size",
        type: "number",
        unit: "mm",
        required: false,
      },
      {
        key: "bandMaterial",
        label: "Band Material",
        type: "select",
        options: ["Leather", "Stainless Steel", "Silicone", "Nylon", "Titanium", "Ceramic", "Rubber"],
        required: false,
      },
      {
        key: "movement",
        label: "Movement",
        type: "select",
        options: ["Quartz", "Automatic", "Mechanical", "Digital", "Solar"],
        required: false,
      },
      {
        key: "waterResistance",
        label: "Water Resistance",
        type: "select",
        options: ["30m", "50m", "100m", "200m", "300m", "None"],
        required: false,
      },
      {
        key: "color",
        label: "Color",
        type: "multi-select",
        options: ["Black", "Silver", "Gold", "Rose Gold", "Blue", "White", "Green", "Brown"],
        required: false,
      },
    ],
  },

  // ─── 8. Eyewear ──────────────────────────────────────────────────────────────
  eyewear: {
    label: "Eyewear",
    icon: "Glasses",
    attributes: [
      {
        key: "frameSize",
        label: "Frame Size",
        type: "select",
        options: ["Small", "Medium", "Large"],
        required: false,
      },
      {
        key: "frameShape",
        label: "Frame Shape",
        type: "select",
        options: ["Round", "Square", "Rectangle", "Aviator", "Cat Eye", "Oval", "Wayfarer"],
        required: false,
      },
      {
        key: "frameMaterial",
        label: "Frame Material",
        type: "select",
        options: ["Metal", "Plastic", "Titanium", "Wood", "Acetate", "Carbon Fiber"],
        required: false,
      },
      {
        key: "lensType",
        label: "Lens Type",
        type: "select",
        options: ["Prescription", "Sunglasses", "Blue Light", "Reading", "Photochromic"],
        required: false,
      },
      {
        key: "color",
        label: "Color",
        type: "multi-select",
        options: ["Black", "Brown", "Gold", "Silver", "Tortoise", "Blue", "Clear", "Red"],
        required: false,
      },
    ],
  },

  // ─── 9. Furniture ────────────────────────────────────────────────────────────
  furniture: {
    label: "Furniture",
    icon: "Armchair",
    attributes: [
      {
        key: "dimensions",
        label: "Dimensions (L x W x H)",
        type: "text",
        unit: "cm",
        required: false,
      },
      {
        key: "color",
        label: "Color",
        type: "multi-select",
        options: ["Black", "White", "Brown", "Gray", "Beige", "Walnut", "Oak", "Natural"],
        required: false,
      },
      {
        key: "material",
        label: "Material",
        type: "select",
        options: ["Wood", "Metal", "Glass", "Plastic", "Fabric", "Leather", "Rattan", "Marble", "MDF"],
        required: false,
      },
      {
        key: "furnitureStyle",
        label: "Style",
        type: "select",
        options: ["Modern", "Classic", "Industrial", "Scandinavian", "Rustic", "Minimalist", "Mid-Century"],
        required: false,
      },
      {
        key: "assemblyRequired",
        label: "Assembly Required",
        type: "boolean",
        required: false,
      },
    ],
  },

  // ─── 10. Food & Beverages ────────────────────────────────────────────────────
  food: {
    label: "Food & Beverages",
    icon: "UtensilsCrossed",
    attributes: [
      {
        key: "weight",
        label: "Weight",
        type: "text",
        unit: "g/kg",
        required: false,
      },
      {
        key: "flavor",
        label: "Flavor / Variant",
        type: "text",
        required: false,
      },
      {
        key: "dietary",
        label: "Dietary",
        type: "multi-select",
        options: ["Vegan", "Vegetarian", "Gluten-Free", "Organic", "Halal", "Kosher", "Sugar-Free", "Dairy-Free", "Keto"],
        required: false,
      },
      {
        key: "shelfLife",
        label: "Shelf Life",
        type: "text",
        required: false,
      },
    ],
  },

  // ─── 11. Books ───────────────────────────────────────────────────────────────
  books: {
    label: "Books",
    icon: "BookOpen",
    attributes: [
      {
        key: "format",
        label: "Format",
        type: "select",
        options: ["Paperback", "Hardcover", "eBook", "Audiobook"],
        required: false,
      },
      {
        key: "language",
        label: "Language",
        type: "text",
        required: false,
      },
      {
        key: "pages",
        label: "Pages",
        type: "number",
        required: false,
      },
      {
        key: "isbn",
        label: "ISBN",
        type: "text",
        required: false,
      },
    ],
  },

  // ─── 12. Toys ────────────────────────────────────────────────────────────────
  toys: {
    label: "Toys & Games",
    icon: "Puzzle",
    attributes: [
      {
        key: "ageRange",
        label: "Age Range",
        type: "select",
        options: ["0-2", "3-5", "6-8", "9-12", "13+", "All Ages"],
        required: false,
      },
      {
        key: "color",
        label: "Color",
        type: "multi-select",
        options: ["Red", "Blue", "Green", "Yellow", "Pink", "Purple", "Multi", "Black", "White"],
        required: false,
      },
      {
        key: "material",
        label: "Material",
        type: "select",
        options: ["Plastic", "Wood", "Fabric", "Metal", "Silicone", "Cardboard"],
        required: false,
      },
      {
        key: "batteryRequired",
        label: "Battery Required",
        type: "boolean",
        required: false,
      },
    ],
  },

  // ─── 13. Sports & Fitness ────────────────────────────────────────────────────
  sports: {
    label: "Sports & Fitness",
    icon: "Dumbbell",
    attributes: [
      {
        key: "size",
        label: "Size",
        type: "multi-select",
        options: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"],
        required: false,
      },
      {
        key: "color",
        label: "Color",
        type: "multi-select",
        options: ["Black", "White", "Red", "Blue", "Green", "Gray", "Navy", "Orange", "Yellow"],
        required: false,
      },
      {
        key: "sport",
        label: "Sport",
        type: "select",
        options: [
          "Running", "Football", "Basketball", "Tennis", "Swimming",
          "Cycling", "Yoga", "Gym", "Hiking", "Boxing", "Golf",
        ],
        required: false,
      },
      {
        key: "gender",
        label: "Gender",
        type: "select",
        options: ["Men", "Women", "Unisex", "Kids"],
        required: false,
      },
    ],
  },

  // ─── 14. Automotive ──────────────────────────────────────────────────────────
  automotive: {
    label: "Automotive & Parts",
    icon: "Car",
    attributes: [
      {
        key: "compatibility",
        label: "Compatibility (Make/Model)",
        type: "text",
        required: false,
      },
      {
        key: "material",
        label: "Material",
        type: "select",
        options: ["Metal", "Plastic", "Rubber", "Carbon Fiber", "Aluminum", "Stainless Steel"],
        required: false,
      },
      {
        key: "color",
        label: "Color",
        type: "multi-select",
        options: ["Black", "Silver", "Chrome", "Red", "Blue", "White", "Carbon"],
        required: false,
      },
      {
        key: "yearRange",
        label: "Year Range",
        type: "text",
        required: false,
      },
    ],
  },

  // ─── 15. Handmade & Crafts ───────────────────────────────────────────────────
  handmade: {
    label: "Handmade & Crafts",
    icon: "Scissors",
    attributes: [
      {
        key: "dimensions",
        label: "Dimensions",
        type: "text",
        required: false,
      },
      {
        key: "color",
        label: "Color",
        type: "multi-select",
        options: [
          "Natural", "White", "Black", "Red", "Blue", "Green",
          "Brown", "Gold", "Silver", "Multi",
        ],
        required: false,
      },
      {
        key: "material",
        label: "Material",
        type: "text",
        required: false,
      },
      {
        key: "customizable",
        label: "Customizable",
        type: "boolean",
        required: false,
      },
      {
        key: "madeToOrder",
        label: "Made to Order",
        type: "boolean",
        required: false,
      },
    ],
  },

  // ─── 16. Home Decor ──────────────────────────────────────────────────────────
  home_decor: {
    label: "Home Decor",
    icon: "Lamp",
    attributes: [
      {
        key: "dimensions",
        label: "Dimensions",
        type: "text",
        unit: "cm",
        required: false,
      },
      {
        key: "color",
        label: "Color",
        type: "multi-select",
        options: [
          "Black", "White", "Gray", "Beige", "Brown", "Gold",
          "Silver", "Green", "Blue", "Natural", "Multi",
        ],
        required: false,
      },
      {
        key: "material",
        label: "Material",
        type: "select",
        options: ["Ceramic", "Glass", "Wood", "Metal", "Fabric", "Rattan", "Marble", "Resin", "Paper"],
        required: false,
      },
      {
        key: "decorStyle",
        label: "Style",
        type: "select",
        options: ["Modern", "Bohemian", "Classic", "Industrial", "Minimalist", "Coastal", "Farmhouse", "Art Deco"],
        required: false,
      },
      {
        key: "room",
        label: "Room",
        type: "select",
        options: ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Office", "Outdoor", "Dining Room"],
        required: false,
      },
    ],
  },

  // ─── 17. Pet Supplies ────────────────────────────────────────────────────────
  pet_supplies: {
    label: "Pet Supplies",
    icon: "PawPrint",
    attributes: [
      {
        key: "petType",
        label: "Pet Type",
        type: "select",
        options: ["Dog", "Cat", "Bird", "Fish", "Hamster", "Rabbit", "Reptile", "Other"],
        required: false,
      },
      {
        key: "size",
        label: "Size",
        type: "select",
        options: ["XS", "S", "M", "L", "XL"],
        required: false,
      },
      {
        key: "color",
        label: "Color",
        type: "multi-select",
        options: ["Black", "Blue", "Red", "Pink", "Green", "Brown", "Gray", "Multi"],
        required: false,
      },
      {
        key: "material",
        label: "Material",
        type: "select",
        options: ["Nylon", "Leather", "Cotton", "Rubber", "Plush", "Silicone", "Stainless Steel"],
        required: false,
      },
      {
        key: "petAge",
        label: "Pet Age",
        type: "select",
        options: ["Puppy/Kitten", "Adult", "Senior"],
        required: false,
      },
    ],
  },

  // ─── 18. Stationery & Office ─────────────────────────────────────────────────
  stationery: {
    label: "Stationery & Office",
    icon: "PenLine",
    attributes: [
      {
        key: "paperSize",
        label: "Size",
        type: "select",
        options: ["A4", "A5", "B5", "Letter", "Pocket", "A3"],
        required: false,
      },
      {
        key: "color",
        label: "Color",
        type: "multi-select",
        options: ["Black", "Blue", "Red", "Green", "White", "Pink", "Yellow", "Multi"],
        required: false,
      },
      {
        key: "pages",
        label: "Pages / Sheets",
        type: "number",
        required: false,
      },
      {
        key: "material",
        label: "Material",
        type: "select",
        options: ["Paper", "Cardboard", "Recycled", "Plastic", "Leather", "Cork"],
        required: false,
      },
    ],
  },

  // ─── 19. Musical Instruments ─────────────────────────────────────────────────
  musical_instruments: {
    label: "Musical Instruments",
    icon: "Music",
    attributes: [
      {
        key: "instrumentType",
        label: "Instrument Type",
        type: "select",
        options: ["String", "Wind", "Percussion", "Keyboard", "Electronic", "Brass"],
        required: false,
      },
      {
        key: "material",
        label: "Material",
        type: "select",
        options: ["Wood", "Metal", "Plastic", "Carbon Fiber", "Brass", "Composite"],
        required: false,
      },
      {
        key: "skillLevel",
        label: "Skill Level",
        type: "select",
        options: ["Beginner", "Intermediate", "Advanced", "Professional"],
        required: false,
      },
      {
        key: "color",
        label: "Color",
        type: "multi-select",
        options: ["Black", "Natural", "White", "Red", "Blue", "Sunburst", "Brown"],
        required: false,
      },
    ],
  },

  // ─── 20. Garden & Outdoor ────────────────────────────────────────────────────
  garden: {
    label: "Garden & Outdoor",
    icon: "Flower2",
    attributes: [
      {
        key: "size",
        label: "Size",
        type: "text",
        required: false,
      },
      {
        key: "color",
        label: "Color",
        type: "multi-select",
        options: ["Green", "Brown", "Terracotta", "Black", "White", "Gray", "Multi", "Natural"],
        required: false,
      },
      {
        key: "material",
        label: "Material",
        type: "select",
        options: ["Ceramic", "Plastic", "Terracotta", "Metal", "Wood", "Concrete", "Resin"],
        required: false,
      },
      {
        key: "gardenType",
        label: "Type",
        type: "select",
        options: ["Seeds", "Tools", "Pots", "Soil", "Fertilizer", "Decoration", "Furniture", "Lighting"],
        required: false,
      },
      {
        key: "season",
        label: "Season",
        type: "multi-select",
        options: ["Spring", "Summer", "Fall", "Winter", "All Season"],
        required: false,
      },
    ],
  },

  // ─── 21. Frames (Cadres) ──────────────────────────────────────────────────
  frames: {
    label: "Frames",
    icon: "Frame",
    attributes: [
      {
        key: "frameSize",
        label: "Frame Size",
        type: "select",
        options: ["10x15cm", "13x18cm", "15x20cm", "20x25cm", "20x30cm", "21x29.7cm (A4)", "24x30cm", "30x40cm", "40x50cm", "40x60cm", "50x70cm", "60x80cm", "70x100cm"],
        required: false,
      },
      {
        key: "color",
        label: "Color",
        type: "multi-select",
        options: [
          "Black", "White", "Natural Wood", "Walnut", "Oak", "Gold",
          "Silver", "Brown", "Gray", "Beige", "Cherry", "Mahogany",
        ],
        required: false,
      },
      {
        key: "material",
        label: "Material",
        type: "select",
        options: ["Wood", "Aluminum", "Plastic", "MDF", "Bamboo", "Metal", "Acrylic", "Composite"],
        required: false,
      },
      {
        key: "frameStyle",
        label: "Style",
        type: "select",
        options: ["Classic", "Modern", "Rustic", "Baroque", "Minimalist", "Vintage", "Industrial", "Floating"],
        required: false,
      },
      {
        key: "glassType",
        label: "Glass Type",
        type: "select",
        options: ["Standard Glass", "Anti-Reflective Glass", "Plexiglass", "UV-Protective Glass", "No Glass"],
        required: false,
      },
      {
        key: "orientation",
        label: "Orientation",
        type: "select",
        options: ["Portrait", "Landscape", "Square", "Multi-Photo"],
        required: false,
      },
    ],
  },
};

/** Get all valid type keys */
export function getProductTypeKeys() {
  return Object.keys(PRODUCT_TYPE_CATALOG);
}

/** Validate that a key exists in the catalog */
export function isValidProductType(key) {
  return key in PRODUCT_TYPE_CATALOG;
}

/** Get a single type config by key */
export function getProductType(key) {
  return PRODUCT_TYPE_CATALOG[key] || null;
}

export default PRODUCT_TYPE_CATALOG;
