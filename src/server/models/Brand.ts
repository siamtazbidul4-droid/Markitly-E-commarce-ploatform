import mongoose, { Schema, Document } from 'mongoose';

export interface IBrand extends Document {
  name: string;
  slug: string;
  logo?: string;
  description?: string;
}

const BrandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logo: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

export const Brand = mongoose.models.Brand || mongoose.model<IBrand>('Brand', BrandSchema);
