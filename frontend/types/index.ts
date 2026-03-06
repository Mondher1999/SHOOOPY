// ─── Category ─────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parent: string | Category | null;
  image: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryNode extends Omit<Category, "parent"> {
  parent: string | null;
  children: CategoryNode[];
}

// ─── Product ──────────────────────────────────────────────────────────────────

export interface ProductVendor {
  id: string;
  name: string;
  email: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ProductRatings {
  average: number;
  count: number;
}

/** Structured image object produced by the image processing pipeline */
export interface ProductImage {
  /** Original uploaded file URL (served from /uploads/products/{id}/) */
  original: string;
  /** 150×150 webp thumbnail */
  thumbnail: string;
  /** 600×600 webp medium */
  medium: string;
  /** 1200×1200 webp large */
  large: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  category: ProductCategory | null;
  images: ProductImage[];
  stock: number;
  sku: string | null;
  vendor: ProductVendor;
  ratings: ProductRatings;
  isActive: boolean;
  attributes: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  images: ProductImage[];
  stock: number;
  price: number;
  isActive: boolean;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
  /** Price snapshot at the time the item was added */
  price: number;
}

export interface Cart {
  id: string;
  user: string;
  items: CartItem[];
  totalPrice: number;
  updatedAt: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ─── Query params for product listing ────────────────────────────────────────

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  rating?: number;
  sort?: "price_asc" | "price_desc" | "rating" | "newest";
  search?: string;
}
