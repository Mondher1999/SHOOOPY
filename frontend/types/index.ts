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

// ─── Address ──────────────────────────────────────────────────────────────────

export interface Address {
  id: string;
  user: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  label: "home" | "work" | "other";
  createdAt: string;
  updatedAt: string;
}

export type AddressFormData = Omit<Address, "id" | "user" | "isDefault" | "createdAt" | "updatedAt">;

// ─── Order ────────────────────────────────────────────────────────────────────

export interface OrderItem {
  product: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

export interface OrderShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  label: string;
}

export interface OrderStatusHistory {
  status: string;
  date: string;
  note: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  user: string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: OrderShippingAddress;
  paymentMethod: "COD";
  status: OrderStatus;
  totalPrice: number;
  shippingCost: number;
  notes: string;
  statusHistory: OrderStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ─── Admin Order Types ───────────────────────────────────────────────────────

export interface AdminOrder extends Omit<Order, "user"> {
  user: { _id: string; name: string; email: string };
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: Partial<Record<OrderStatus, number>>;
  dailyRevenue: { date: string; revenue: number; orders: number }[];
}

// ─── Review ──────────────────────────────────────────────────────────────────

export interface ReviewUser {
  id: string;
  name: string;
  avatar: string | null;
}

export interface Review {
  id: string;
  user: ReviewUser;
  product: string;
  order: string;
  rating: number;
  title: string;
  comment: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RatingDistributionItem {
  rating: number;
  count: number;
}

export interface ReviewsResponse {
  reviews: Review[];
  ratingDistribution: RatingDistributionItem[];
  pagination: PaginationInfo;
}

export interface ReviewEligibility {
  canReview: boolean;
  hasDeliveredOrder: boolean;
  existingReview: Review | null;
}

// ─── Wishlist ────────────────────────────────────────────────────────────────

export interface WishlistItem {
  product: Product;
  addedAt: string;
}

export interface Wishlist {
  id: string;
  user: string;
  items: WishlistItem[];
  updatedAt: string;
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  ordersToday: number;
  revenueToday: number;
  newUsersThisMonth: number;
  ordersByStatus: Partial<Record<OrderStatus, number>>;
}

export interface DashboardRevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface DashboardTopProduct {
  productId: string;
  name: string;
  image: string;
  totalSold: number;
  totalRevenue: number;
}

export interface DashboardLowStockProduct {
  _id: string;
  name: string;
  slug: string;
  stock: number;
  images: { thumbnail: string }[];
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
