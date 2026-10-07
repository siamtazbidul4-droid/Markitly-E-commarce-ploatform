import mongoose, { Schema, Document } from 'mongoose';

export interface IBanner extends Document {
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

const BannerSchema = new Schema<IBanner>(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    badge: { type: String },
    ctaText: { type: String, required: true },
    ctaLink: { type: String, required: true },
    image: { type: String, required: true },
    bgColor: { type: String },
    textColor: { type: String },
    active: { type: Boolean, default: true, index: true },
    position: {
      type: String,
      enum: ['hero', 'flash_deal', 'promotional_dual_left', 'promotional_dual_right', 'announcement'],
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const Banner = mongoose.models.Banner || mongoose.model<IBanner>('Banner', BannerSchema);
