import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Category } from '../models/Category';
import { Brand } from '../models/Brand';
import { AuditLog } from '../models/AuditLog';
import { isDbConnected } from '../config/db';
import { memoryStore } from '../config/memoryStore';
import { serializeDocument } from '../utils/serializeDocument';
import { Category as CategoryType } from '../../types';
import { AuthRequest } from '../middleware/auth';

/** Mongoose documents expose `_id`; the client contract requires `id`. */
const serialize = serializeDocument;

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    if (isDbConnected()) {
      let categories = await Category.find().sort({ itemCount: -1 });
      if (categories.length === 0) categories = memoryStore.categories as any;
      res.json({ success: true, data: categories.map(serialize) });
      return;
    }
    res.json({ success: true, data: memoryStore.categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, image, iconName } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ success: false, message: 'Category name is required' });
      return;
    }
    const slug = slugify(name);

    if (isDbConnected()) {
      const existing = await Category.findOne({ $or: [{ name }, { slug }] });
      if (existing) {
        res.status(409).json({ success: false, message: 'A category with that name already exists.' });
        return;
      }
      const category = await Category.create({
        name: name.trim(),
        slug,
        image,
        iconName: iconName || 'Shirt',
        itemCount: 0,
        featured: true,
      });
      await AuditLog.create({
        actor: req.user?.name || 'Admin',
        action: 'Category Created',
        resource: 'Catalog',
        details: `Created category ${category.name}`,
      });
      res.status(201).json({ success: true, data: serialize(category) });
      return;
    }

    if (memoryStore.categories.some((c) => c.slug === slug)) {
      res.status(409).json({ success: false, message: 'A category with that name already exists.' });
      return;
    }

    const newCat: CategoryType = {
      id: 'cat_' + Date.now(),
      name: name.trim(),
      slug,
      image,
      iconName: iconName || 'Shirt',
      itemCount: 0,
      featured: true,
    };
    memoryStore.categories.push(newCat);
    memoryStore.logAudit(
      req.user?.name || 'Admin',
      'Category Created',
      'Catalog',
      `Created category ${newCat.name}`
    );

    res.status(201).json({ success: true, data: newCat });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid category identifier.' });
        return;
      }
      const deleted = await Category.findByIdAndDelete(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Category not found.' });
        return;
      }
      await AuditLog.create({
        actor: req.user?.name || 'Admin',
        action: 'Category Deleted',
        resource: 'Catalog',
        details: `Removed category ${deleted.name}`,
      });
      res.json({ success: true, message: 'Category deleted' });
      return;
    }

    const idx = memoryStore.categories.findIndex((c) => c.id === id);
    if (idx === -1) {
      res.status(404).json({ success: false, message: 'Category not found.' });
      return;
    }
    const removed = memoryStore.categories.splice(idx, 1)[0];
    memoryStore.logAudit(
      req.user?.name || 'Admin',
      'Category Deleted',
      'Catalog',
      `Removed category ${removed.name}`
    );
    res.json({ success: true, message: 'Category deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBrands = async (req: Request, res: Response): Promise<void> => {
  try {
    if (isDbConnected()) {
      let brands = await Brand.find().sort({ name: 1 });
      if (brands.length === 0) brands = memoryStore.brands as any;
      res.json({ success: true, data: brands.map(serialize) });
      return;
    }
    res.json({ success: true, data: memoryStore.brands });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createBrand = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, logo, description } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ success: false, message: 'Brand name is required' });
      return;
    }
    const slug = slugify(name);

    if (isDbConnected()) {
      const existing = await Brand.findOne({ $or: [{ name: name.trim() }, { slug }] });
      if (existing) {
        res.status(409).json({ success: false, message: 'A brand with that name already exists.' });
        return;
      }
      const brand = await Brand.create({ name: name.trim(), slug, logo, description });
      await AuditLog.create({
        actor: req.user?.name || 'Admin',
        action: 'Brand Created',
        resource: 'Catalog',
        details: `Created brand ${brand.name}`,
      });
      res.status(201).json({ success: true, data: serialize(brand) });
      return;
    }

    if (memoryStore.brands.some((b) => b.slug === slug)) {
      res.status(409).json({ success: false, message: 'A brand with that name already exists.' });
      return;
    }

    const newBrand = {
      id: 'brand_' + Date.now(),
      name: name.trim(),
      slug,
      logo,
      description,
    };
    memoryStore.brands.push(newBrand as (typeof memoryStore.brands)[number]);
    memoryStore.logAudit(
      req.user?.name || 'Admin',
      'Brand Created',
      'Catalog',
      `Created brand ${newBrand.name}`
    );
    res.status(201).json({ success: true, data: newBrand });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBrand = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid brand identifier.' });
        return;
      }
      const deleted = await Brand.findByIdAndDelete(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Brand not found.' });
        return;
      }
      await AuditLog.create({
        actor: req.user?.name || 'Admin',
        action: 'Brand Deleted',
        resource: 'Catalog',
        details: `Removed brand ${deleted.name}`,
      });
      res.json({ success: true, message: 'Brand deleted' });
      return;
    }

    const idx = memoryStore.brands.findIndex((b) => b.id === id);
    if (idx === -1) {
      res.status(404).json({ success: false, message: 'Brand not found.' });
      return;
    }
    const removed = memoryStore.brands.splice(idx, 1)[0];
    memoryStore.logAudit(
      req.user?.name || 'Admin',
      'Brand Deleted',
      'Catalog',
      `Removed brand ${removed.name}`
    );
    res.json({ success: true, message: 'Brand deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
