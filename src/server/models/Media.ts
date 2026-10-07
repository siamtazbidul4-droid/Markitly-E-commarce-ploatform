import mongoose, { Schema, Document } from 'mongoose';

export interface IMedia extends Document {
  name: string;
  url: string;
  publicId?: string;
  format: string;
  size: number;
  dimensions?: string;
  folder?: string;
  createdAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String },
    format: { type: String, default: 'JPG' },
    size: { type: Number, required: true },
    dimensions: { type: String },
    folder: { type: String, default: 'Storefront' },
  },
  { timestamps: true }
);

export const Media = mongoose.models.Media || mongoose.model<IMedia>('Media', MediaSchema);
