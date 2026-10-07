import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { Brand } from '../models/Brand';
import { Banner } from '../models/Banner';
import { User } from '../models/User';
import { Order } from '../models/Order';
import { Review } from '../models/Review';
import { Media } from '../models/Media';
import { AuditLog } from '../models/AuditLog';
import {
  initialProducts,
  initialCategories,
  initialBrands,
  initialBanners,
  initialReviews,
  initialAuditLogs,
  initialMediaAssets,
} from '../../services/mockData';

export const seedDatabaseIfEmpty = async () => {
  // If MongoDB is not connected (e.g. running in high-performance memory fallback mode), skip Mongoose seeding
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  try {
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log('🌱 Seeding initial Marketly luxury catalog into database...');

      // Seed Categories
      await Category.deleteMany({});
      await Category.insertMany(initialCategories);

      // Seed Brands
      await Brand.deleteMany({});
      await Brand.insertMany(initialBrands);

      // Seed Products
      await Product.deleteMany({});
      await Product.insertMany(initialProducts);

      // Seed Banners
      await Banner.deleteMany({});
      await Banner.insertMany(initialBanners);

      // Seed Admin User
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@marketly.com';
      const existingAdmin = await User.findOne({ email: adminEmail });
      if (!existingAdmin) {
        await User.create({
          name: 'Mahim Haque (Super Admin)',
          email: adminEmail,
          password: process.env.ADMIN_PASSWORD || 'Marketly@2026!',
          role: 'super_admin',
          phone: '+880 1712-345678',
          addresses: [
            {
              fullName: 'Mahim Haque',
              phone: '+880 1712-345678',
              email: adminEmail,
              division: 'Dhaka',
              district: 'Dhaka',
              upazila: 'Gulshan',
              union: 'Ward 19',
              streetAddress: 'House 42, Road 11, Block D, Banani',
              postalCode: '1213',
            },
          ],
        });
      }

      // Seed Reviews
      await Review.deleteMany({});
      for (const [prodId, revList] of Object.entries(initialReviews)) {
        await Review.insertMany(revList);
      }

      // Seed Media
      await Media.deleteMany({});
      await Media.insertMany(initialMediaAssets);

      // Seed Audit Logs
      await AuditLog.deleteMany({});
      await AuditLog.insertMany(initialAuditLogs);

      console.log('✅ Database successfully seeded with luxury catalog and admin controls.');
    }
  } catch (error: any) {
    console.warn(`Seed notice: ${error.message}`);
  }
};
