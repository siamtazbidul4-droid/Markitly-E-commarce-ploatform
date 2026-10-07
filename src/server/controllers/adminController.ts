import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Banner as BannerModel } from '../models/Banner';
import { Media as MediaModel } from '../models/Media';
import { AuditLog as AuditLogModel } from '../models/AuditLog';
import { Order as OrderModel } from '../models/Order';
import { Product as ProductModel } from '../models/Product';
import { User as UserModel } from '../models/User';
import { isDbConnected } from '../config/db';
import { memoryStore } from '../config/memoryStore';
import { serializeDocument } from '../utils/serializeDocument';
import { AuthRequest } from '../middleware/auth';
import { MediaAsset } from '../../types';

// Banner Controller
export const getBanners = async (req: Request, res: Response): Promise<void> => {
  try {
    if (isDbConnected()) {
      let banners = await BannerModel.find({ active: true });
      if (banners.length === 0) banners = memoryStore.banners as any;
      res.json({ success: true, data: banners.map(serializeDocument) });
      return;
    }
    const banners = memoryStore.banners.filter((b) => b.active);
    res.json({ success: true, data: banners });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBanner = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(404).json({ success: false, message: 'Banner not found' });
        return;
      }
      const updated = await BannerModel.findByIdAndUpdate(id, req.body, { returnDocument: 'after' });
      if (!updated) {
        res.status(404).json({ success: false, message: 'Banner not found' });
        return;
      }
      await AuditLogModel.create({
        actor: req.user?.name || 'Admin',
        action: 'Banner Updated',
        resource: updated.title,
        details: `Modified banner placement`,
      });
      res.json({ success: true, data: serializeDocument(updated) });
      return;
    }

    const idx = memoryStore.banners.findIndex((b) => b.id === id);
    if (idx !== -1) {
      memoryStore.banners[idx] = { ...memoryStore.banners[idx], ...req.body };
      memoryStore.logAudit(
        req.user?.name || 'Admin',
        'Banner Updated',
        memoryStore.banners[idx].title,
        'Modified banner content'
      );
      res.json({ success: true, data: memoryStore.banners[idx] });
      return;
    }

    res.status(404).json({ success: false, message: 'Banner not found' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Media Controller
export const getMediaAssets = async (req: Request, res: Response): Promise<void> => {
  try {
    if (isDbConnected()) {
      let media = await MediaModel.find().sort({ createdAt: -1 });
      if (media.length === 0) media = memoryStore.mediaAssets as any;
      res.json({ success: true, data: media.map(serializeDocument) });
      return;
    }
    res.json({ success: true, data: memoryStore.mediaAssets });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createMediaAsset = async (req: any, res: Response): Promise<void> => {
  try {
    const { name, url, format, size, dimensions, folder } = req.body;

    // Backend is authoritative on upload validation: the client-side checks are
    // convenience only. Only self-contained image data URLs or https references
    // are accepted - a `blob:` URL from the submitting tab would be permanently
    // broken for everyone else, and a non-image payload would be executable
    // material in an authenticated-only endpoint, which must never happen.
    if (typeof url !== 'string' || url.length === 0) {
      res.status(400).json({ success: false, message: 'A media URL is required.' });
      return;
    }
    if (url.length > 7_500_000) {
      // ~5 MB file = ~6.8 MB base64; the bound blocks oversized payloads.
      res.status(413).json({ success: false, message: 'Images must be 5 MB or smaller.' });
      return;
    }
    if (!/^data:image\/(jpeg|png|webp|gif);/i.test(url) && !/^https:\/\//i.test(url)) {
      res
        .status(400)
        .json({ success: false, message: 'Only JPEG, PNG, WebP or GIF images are supported.' });
      return;
    }

    if (isDbConnected()) {
      const asset = await MediaModel.create({
        name,
        url,
        format: format || 'JPG',
        size: size || 150000,
        dimensions: dimensions || '1200x1200',
        folder: folder || 'Storefront',
      });
      await AuditLogModel.create({
        actor: req.user?.name || 'Admin',
        action: 'Media Asset Uploaded',
        resource: asset.name,
        details: `Size: ${(asset.size / 1024).toFixed(1)} KB`,
      });
      res.status(201).json({ success: true, data: serializeDocument(asset) });
      return;
    }

    const newAsset: MediaAsset = {
      id: 'media_' + Date.now(),
      name,
      url,
      format: format || 'JPG',
      size: size || 150000,
      dimensions: dimensions || '1200x1200',
      folder: folder || 'Storefront',
      uploadedAt: new Date().toISOString(),
    };
    memoryStore.mediaAssets.unshift(newAsset);
    memoryStore.logAudit(
      req.user?.name || 'Admin',
      'Media Asset Uploaded',
      newAsset.name,
      `Size: ${(newAsset.size / 1024).toFixed(1)} KB`
    );

    res.status(201).json({ success: true, data: newAsset });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMediaAsset = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      await MediaModel.findByIdAndDelete(id);
      res.json({ success: true, message: 'Media removed' });
      return;
    }

    const idx = memoryStore.mediaAssets.findIndex((m) => m.id === id);
    if (idx !== -1) {
      const removed = memoryStore.mediaAssets.splice(idx, 1)[0];
      memoryStore.logAudit(
        req.user?.name || 'Admin',
        'Media Removed',
        removed.name,
        `Deleted media asset ${removed.name}`
      );
    }
    res.json({ success: true, message: 'Media removed' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin Controller
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    if (isDbConnected()) {
      const orders = await OrderModel.find();
      const products = await ProductModel.find();
      // Counted by role: the dashboard labels this tile "Registered Customers",
      // and it previously reported every account, inflating the figure by each
      // staff/administrator user.
      const customers = await UserModel.countDocuments({ role: 'customer' });

      const totalRevenue = orders.reduce((sum, o) => sum + (o.paymentStatus === 'Paid' ? o.total : 0), 0);
      const totalStock = products.reduce((sum, p) => sum + p.inventory, 0);

      res.json({
        success: true,
        data: {
          totalRevenue,
          orderCount: orders.length,
          productCount: products.length,
          userCount: customers,
          totalStock,
        },
      });
      return;
    }

    const orders = memoryStore.orders;
    const products = memoryStore.products;
    const customers = memoryStore.users.filter((u) => u.role === 'customer');

    const totalRevenue = orders.reduce((sum, o) => sum + (o.paymentStatus === 'Paid' ? o.total : 0), 0);
    const totalStock = products.reduce((sum, p) => sum + p.inventory, 0);

    res.json({
      success: true,
      data: {
        totalRevenue,
        orderCount: orders.length,
        productCount: products.length,
        userCount: customers.length,
        totalStock,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    if (isDbConnected()) {
      const logs = await AuditLogModel.find().sort({ createdAt: -1 }).limit(50);
      res.json({
        success: true,
        data: logs.map((log) => ({
          id: String(log._id),
          actor: log.actor,
          action: log.action,
          resource: log.resource,
          details: log.details,
          ipAddress: log.ipAddress,
          timestamp: new Date(log.createdAt).toISOString(),
        })),
      });
      return;
    }
    res.json({ success: true, data: memoryStore.auditLogs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Customer Controller
export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    if (isDbConnected()) {
      const customers = await UserModel.find({ role: 'customer' })
        .select('-password')
        .sort({ createdAt: -1 });
      res.json({
        success: true,
        data: customers.map((u) => ({
          id: String(u._id),
          name: u.name,
          email: u.email,
          role: u.role,
          phone: u.phone,
          avatar: u.avatar,
          addresses: u.addresses,
          createdAt: new Date(u.createdAt).toISOString(),
        })),
      });
      return;
    }
    const customers = memoryStore.users.filter((u) => u.role === 'customer');
    res.json({ success: true, data: customers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Inventory Controller
export const getInventorySummary = async (req: Request, res: Response): Promise<void> => {
  try {
    if (isDbConnected()) {
      const products = await ProductModel.find().select('name sku inventory category variants price');
      res.json({
        success: true,
        data: products.map((p) => ({
          ...(p.toJSON() as Record<string, unknown>),
          id: String(p._id),
        })),
      });
      return;
    }
    const products = memoryStore.products.map((p) => ({
      _id: p.id,
      id: p.id,
      name: p.name,
      sku: p.sku,
      inventory: p.inventory,
      category: p.category,
      variants: p.variants,
      price: p.price,
    }));
    res.json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adjustStock = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, variantId, quantityChange, newQuantity, reason } = req.body;

    if (!productId || (newQuantity === undefined && quantityChange === undefined)) {
      res.status(400).json({
        success: false,
        message: 'A productId and either newQuantity or quantityChange are required.',
      });
      return;
    }

    if (isDbConnected()) {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        res.status(400).json({ success: false, message: 'Invalid product identifier.' });
        return;
      }
      const product = await ProductModel.findById(productId);
      if (!product) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }

      if (variantId && product.variants) {
        const v = product.variants.find((variant: any) => variant.id === variantId);
        if (v) {
          v.inventory = newQuantity !== undefined ? newQuantity : Math.max(0, v.inventory + quantityChange);
        }
      } else {
        product.inventory = newQuantity !== undefined ? newQuantity : Math.max(0, product.inventory + quantityChange);
      }

      await product.save();
      await AuditLogModel.create({
        actor: req.user?.name || 'Admin',
        action: 'Inventory Adjusted',
        resource: product.name,
        details: `Stock updated. Reason: ${reason || 'Manual Count Adjustment'}`,
      });

      res.json({ success: true, data: { ...(product.toJSON() as Record<string, unknown>), id: String(product._id) } });
      return;
    }

    const prod = memoryStore.products.find((p) => p.id === productId);
    if (!prod) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    if (variantId && prod.variants) {
      const v = prod.variants.find((variant: any) => variant.id === variantId);
      if (v) {
        v.inventory = newQuantity !== undefined ? newQuantity : Math.max(0, v.inventory + quantityChange);
      }
    } else {
      prod.inventory = newQuantity !== undefined ? newQuantity : Math.max(0, prod.inventory + quantityChange);
    }

    memoryStore.logAudit(
      req.user?.name || 'Admin',
      'Inventory Adjusted',
      prod.name,
      `Stock updated to ${prod.inventory}. Reason: ${reason || 'Manual Count Adjustment'}`
    );

    res.json({ success: true, data: prod });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
