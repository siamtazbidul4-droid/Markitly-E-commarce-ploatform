export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName?: string;
  image?: string;
  itemCount: number;
  featured?: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  attributes: Record<string, string>; // e.g. { size: 'M', color: 'Midnight Black' }
  price: number;
  compareAtPrice?: number;
  inventory: number;
  image?: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  approved?: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  category: string; // e.g. 'Fashion', 'Electronics', 'Beauty', 'Home', 'Grocery', 'Sports'
  subcategory?: string;
  brand: string;
  price: number;
  compareAtPrice?: number;
  discountPercent?: number;
  rating: number;
  reviewCount: number;
  mainImage: string;
  galleryImages: string[];
  variants: ProductVariant[];
  inventory: number;
  tags?: string[];
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isFlashDeal?: boolean;
  specifications: Record<string, string>;
  materials?: string;
  careInstructions?: string;
  shippingInfo?: string;
  returnPolicy?: string;
  createdAt: string;
}

export interface CartItem {
  id: string; // unique cart line id, e.g. `${productId}-${variantId}`
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  image: string;
  selectedAttributes?: Record<string, string>;
  maxStock: number;
}

export interface BangladeshAddress {
  fullName: string;
  phone: string;
  email: string;
  division: string;
  district: string;
  upazila: string;
  union?: string;
  streetAddress: string;
  postalCode?: string;
}

export type PaymentMethod = 'cod' | 'bkash' | 'nagad' | 'card';

export type OrderStatus =
  | 'Pending Payment'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Refunded';

export interface OrderItem {
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image: string;
  selectedAttributes?: Record<string, string>;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: {
    userId?: string;
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: BangladeshAddress;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  couponCode?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  orderStatus: OrderStatus;
  statusHistory: {
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }[];
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'content_manager' | 'customer';
  phone?: string;
  avatar?: string;
  addresses?: BangladeshAddress[];
}

export interface PromotionBanner {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  ctaText: string;
  ctaLink: string;
  image: string;
  bgColor?: string;
  textColor?: string;
  active: boolean;
  position: 'hero' | 'flash_deal' | 'promotional_dual_left' | 'promotional_dual_right' | 'announcement';
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  resource: string;
  details: string;
  timestamp: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  url: string;
  format: string;
  size: number;
  dimensions?: string;
  uploadedAt: string;
  folder?: string;
}
