import mongoose, { Schema, Document } from 'mongoose';

export interface IProductVariant {
  id: string;
  sku: string;
  name: string;
  attributes: Record<string, string>;
  price: number;
  compareAtPrice?: number;
  inventory: number;
  image?: string;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  category: string;
  subcategory?: string;
  brand: string;
  price: number;
  compareAtPrice?: number;
  discountPercent?: number;
  rating: number;
  reviewCount: number;
  mainImage: string;
  galleryImages: string[];
  variants: IProductVariant[];
  inventory: number;
  tags: string[];
  isFeatured: boolean;
  isBestSeller: boolean;
  isFlashDeal: boolean;
  specifications: Record<string, string>;
  materials?: string;
  careInstructions?: string;
  shippingInfo?: string;
  returnPolicy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    id: { type: String, required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    attributes: { type: Map, of: String, default: {} },
    price: { type: Number, required: true },
    compareAtPrice: { type: Number },
    inventory: { type: Number, required: true, default: 0 },
    image: { type: String },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    shortDescription: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    subcategory: { type: String },
    brand: { type: String, required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    discountPercent: { type: Number, min: 0, max: 100 },
    rating: { type: Number, default: 5.0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    mainImage: { type: String, required: true },
    galleryImages: [{ type: String }],
    variants: [ProductVariantSchema],
    inventory: { type: Number, required: true, default: 0, min: 0 },
    tags: [{ type: String }],
    isFeatured: { type: Boolean, default: false, index: true },
    isBestSeller: { type: Boolean, default: false, index: true },
    isFlashDeal: { type: Boolean, default: false, index: true },
    specifications: { type: Map, of: String, default: {} },
    materials: { type: String },
    careInstructions: { type: String },
    shippingInfo: { type: String },
    returnPolicy: { type: String },
  },
  { timestamps: true }
);

// Full text search index
ProductSchema.index({ name: 'text', description: 'text', brand: 'text', category: 'text' });

export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
