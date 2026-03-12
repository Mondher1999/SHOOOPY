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

export interface CategoryAncestor {
  id: string;
  name: string;
  slug: string;
}

export interface CategoryWithAncestors extends Category {
  ancestors: CategoryAncestor[];
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
  couponCode: string;
  discountAmount: number;
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

// ─── Settings ──────────────────────────────────────────────────────────────

export interface StoreSettings {
  name: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  currency: string;
  timezone: string;
  logo: string;
  logoEnabled: boolean;
  favicon: string;
  showcaseMode: boolean;
}

export interface OrderSettings {
  defaultShippingCost: number;
  minimumOrderAmount: number;
  freeShippingThreshold: number;
  autoCancelPendingDays: number;
}

export interface NotificationSettings {
  orderConfirmation: boolean;
  orderStatusUpdate: boolean;
  welcomeEmail: boolean;
  adminNewOrder: boolean;
  adminLowStock: boolean;
  adminNotificationEmail: string;
}

export interface ProductSettings {
  lowStockThreshold: number;
  maxImagesPerProduct: number;
  reviewsEnabled: boolean;
  defaultSortOrder: "newest" | "price_asc" | "price_desc" | "rating";
}

export interface SocialSettings {
  facebook: string;
  instagram: string;
  twitter: string;
  tiktok: string;
  youtube: string;
  whatsapp: string;
}

export interface LegalSettings {
  termsAndConditions: string;
  privacyPolicy: string;
  returnPolicy: string;
  shippingPolicy: string;
}

export interface SEOSettings {
  metaTitleTemplate: string;
  metaDescription: string;
  googleAnalyticsId: string;
  facebookPixelId: string;
}

export interface MaintenanceSettings {
  enabled: boolean;
  message: string;
}

export interface HomepageSlide {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  type: "image" | "video";
  videoUrl: string;
  posterUrl: string;
}

// Dynamic template section keys
export type DynamicSectionKey =
  | "hero"
  | "valuePropositions"
  | "collections"
  | "featuredProducts"
  | "promoBanner"
  | "newArrivals"
  | "testimonials"
  | "brandStory"
  | "instagram"
  | "trustBar"
  | "newsletter"
  | "partners"
  | "recentlyViewed";

// Classic template section keys
export type ClassicSectionKey =
  | "hero"
  | "trustBadges"
  | "trendingCategories"
  | "topSelling"
  | "promoBanner"
  | "newArrivals"
  | "welcome"
  | "aboutUs"
  | "brand"
  | "gallery"
  | "seoHeadline"
  | "partners";

// Bold template section keys
export type BoldSectionKey =
  | "hero"
  | "categories"
  | "featuredProducts"
  | "promoBanner"
  | "newArrivals"
  | "socialProof"
  | "newsletter";

// Artisan template section keys
export type ArtisanSectionKey =
  | "hero"
  | "categories"
  | "featuredProducts"
  | "promoBanner"
  | "newArrivals"
  | "craftStory"
  | "newsletter";

// Magazine template section keys
export type MagazineSectionKey =
  | "hero"
  | "categories"
  | "featuredProducts"
  | "promoBanner"
  | "newArrivals"
  | "editorial"
  | "newsletter";

// Union of all possible section keys (used in settings storage)
export type HomepageSectionKey =
  | DynamicSectionKey
  | ClassicSectionKey
  | BoldSectionKey
  | ArtisanSectionKey
  | MagazineSectionKey;

// Template ID — open string so new themes can be registered without type changes
export type HomepageTemplate = string;

// Theme configuration — registered in THEMES map (HomepageSections.tsx)
export interface ThemeConfig {
  /** Display name shown in admin gallery */
  label: string;
  /** Short description shown under the theme card */
  description: string;
  /** Path to preview thumbnail (optional — shows placeholder if absent) */
  thumbnail?: string;
  /** Whether this theme's sections read content from admin settings */
  editable: boolean;
  /** Default section order for this theme */
  defaultOrder: HomepageSectionKey[];
  /** Map of section key → React component */
  components: Partial<Record<HomepageSectionKey, React.ComponentType>>;
  /** Sections that default to hidden (e.g., seoHeadline, gallery) */
  defaultHidden?: HomepageSectionKey[];
}

export interface AnnouncementSettings {
  enabled: boolean;
  text: string;
  link: string;
  bgColor: string;
  textColor: string;
  dismissible: boolean;
}

export interface PromoBannerSettings {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  countdownEnd: string | null;
}

export interface FeaturedProductsSettings {
  title: string;
  mode: "auto" | "manual";
  sortBy: "newest" | "bestseller" | "rating";
  limit: number;
  productIds: string[];
}

export interface CollectionsSettings {
  title: string;
  limit: number;
  categoryIds: string[];
  displayMode: "grid" | "slider";
}

export interface NewArrivalsSettings {
  title: string;
  limit: number;
}

export interface TestimonialItem {
  name: string;
  quote: string;
  location: string;
  rating: number;
  avatar: string;
}

export interface TestimonialsSettings {
  title: string;
  mode: "auto" | "manual";
  items: TestimonialItem[];
}

export interface BrandStorySettings {
  title: string;
  body: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  imagePosition: "left" | "right";
}

export interface TrustBarItem {
  icon: string;
  title: string;
  description: string;
}

export interface TrustBarSettings {
  items: TrustBarItem[];
}

export interface NewsletterSettings {
  title: string;
  subtitle: string;
  placeholder: string;
  buttonText: string;
  bgColor: string;
  textColor: string;
}

export interface InstagramImage {
  url: string;
  link: string;
}

export interface InstagramSettings {
  username: string;
  images: InstagramImage[];
}

export interface ValuePropositionItem {
  icon: string;
  title: string;
  description: string;
}

export interface ValuePropositionsSettings {
  items: ValuePropositionItem[];
}

export interface PartnerItem {
  imageUrl: string;
  link: string;
  name: string;
}

export interface PartnersSettings {
  items: PartnerItem[];
}

export interface PopupSettings {
  enabled: boolean;
  title: string;
  body: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  trigger: "exit" | "timed" | "scroll";
  delay: number;
  scrollPercent: number;
  frequency: "once" | "session" | "daily";
}

export interface HomepageSettings {
  template?: HomepageTemplate;
  mode: "dynamic" | "hardcoded";
  sections: Record<HomepageSectionKey, boolean>;
  sectionOrder: HomepageSectionKey[];
  slides: HomepageSlide[];
  announcement: AnnouncementSettings;
  promoBanner: PromoBannerSettings;
  featuredProducts: FeaturedProductsSettings;
  collections: CollectionsSettings;
  newArrivals: NewArrivalsSettings;
  testimonials: TestimonialsSettings;
  brandStory: BrandStorySettings;
  trustBar: TrustBarSettings;
  newsletter: NewsletterSettings;
  instagram: InstagramSettings;
  valuePropositions: ValuePropositionsSettings;
  partners: PartnersSettings;
  popup: PopupSettings;
  announcementText: string;
}

export interface TypographySettings {
  headingFont: string;
  bodyFont: string;
  baseFontSize: number;
  headingLetterSpacing: number;
  headingTextTransform: "uppercase" | "none";
}

export interface ColorPaletteSettings {
  preset: string;
  bg: string;
  bgAlt: string;
  text: string;
  textMuted: string;
  dark: string;
  accentText: string;
  border: string;
  sale: string;
}

export interface EmailTemplateSettings {
  orderConfirmationSubject: string;
  orderShippedSubject: string;
  orderDeliveredSubject: string;
  orderCancelledSubject: string;
  welcomeSubject: string;
  verificationSubject: string;
  passwordResetSubject: string;
}

export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

// ─── Header Settings ────────────────────────────────────────────────────
export type HeaderVariant = "classic" | "minimal" | "centered" | "bold" | "elegant" | "zen" | "playful" | "tech" | "artisan" | "magazine";

export interface HeaderSettings {
  enabled: boolean;
  variant: HeaderVariant;
  mode: "dynamic" | "hardcoded";
}

// ─── Footer Settings ────────────────────────────────────────────────────
export type FooterVariant = "luxury" | "minimal" | "columns" | "bold" | "elegant" | "zen" | "playful" | "tech" | "artisan" | "magazine";

export interface FooterSettings {
  enabled: boolean;
  variant: FooterVariant;
  mode: "dynamic" | "hardcoded";
}

export interface SiteSettings {
  id: string;
  store: StoreSettings;
  orders: OrderSettings;
  notifications: NotificationSettings;
  products: ProductSettings;
  social: SocialSettings;
  legal: LegalSettings;
  seo: SEOSettings;
  maintenance: MaintenanceSettings;
  homepage: HomepageSettings;
  header: HeaderSettings;
  footer: FooterSettings;
  emailTemplates: EmailTemplateSettings;
  smtp: SmtpSettings;
  typography: TypographySettings;
  colorPalette: ColorPaletteSettings;
  createdAt: string;
  updatedAt: string;
}

// ─── Coupon ─────────────────────────────────────────────────────────────────

export interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  maxDiscount: number;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Contact ────────────────────────────────────────────────────────────────

export interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied";
  createdAt: string;
  updatedAt: string;
}

// ─── FAQ ────────────────────────────────────────────────────────────────────

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

// ─── View Props (Controller/View split) ──────────────────────────────────────

export type ViewMode = "grid" | "list";
export type SortValue = NonNullable<ProductQueryParams["sort"]>;

export interface FilterState {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  rating?: number;
}

export interface ProductListViewProps {
  products: Product[];
  pagination: PaginationInfo | null;
  categories: CategoryNode[];
  loading: boolean;
  error: string | null;
  view: ViewMode;
  sort: SortValue | undefined;
  filters: FilterState;
  onViewChange: (view: ViewMode) => void;
  onSortChange: (sort: SortValue) => void;
  onFiltersChange: (filters: FilterState) => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
}

export interface CategoriesListViewProps {
  categories: Category[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export interface CategoryDetailViewProps {
  category: CategoryWithAncestors | null;
  subcategories: Category[];
  products: Product[];
  pagination: PaginationInfo | null;
  loading: boolean;
  catLoading: boolean;
  error: string | null;
  sort: SortValue | undefined;
  page: number;
  slug: string;
  onSortChange: (sort: SortValue) => void;
  onPageChange: (page: number) => void;
}

export interface ProductDetailViewProps {
  product: Product;
  isShowcase: boolean;
  adding: boolean;
  onAddToCart: () => void;
}
