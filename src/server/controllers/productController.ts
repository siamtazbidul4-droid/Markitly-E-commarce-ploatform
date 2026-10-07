import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { AuditLog } from '../models/AuditLog';
import { isDbConnected } from '../config/db';
import { memoryStore } from '../config/memoryStore';
import { serializeDocument } from '../utils/serializeDocument';
import { Product as ProductType } from '../../types';

/**
 * Mongo documents expose `_id`, while the client product model is keyed on
 * `id`. Normalising here keeps a single product shape across API and client and
 * makes the identifier returned on create reusable for later edit/delete calls.
 */
const serializeProduct = serializeDocument;

/**
 * Escapes regex metacharacters before a term reaches `$regex`.
 *
 * The storefront search box forwards raw keystrokes, so an unescaped `(` or `*`
 * turns a perfectly ordinary query into an invalid expression and the whole
 * request fails with a 500. Anchored, case-insensitive substring matching is the
 * behaviour the catalog already had via the in-memory fallback.
 */
const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Strict 24-character hex test.
 *
 * `mongoose.Types.ObjectId.isValid` also accepts any 12-character string, which
 * would then throw a CastError inside the query and surface as a 500.
 */
const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

/**
 * Parses a query-string integer, falling back when the value is absent or junk.
 * `Product.limit(NaN)` throws inside Mongoose, which surfaced as a 500.
 */
const toPositiveInt = (value: unknown, fallback: number, max: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), 1), max);
};

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, brand, search, minPrice, maxPrice, sortBy, sale, deals, bestseller } = req.query;
    const limit = toPositiveInt(req.query.limit, 50, 200);
    const page = toPositiveInt(req.query.page, 1, 10000);

    if (isDbConnected()) {
      const query: any = {};

      // Each independently optional criterion becomes its own `$and` clause.
      // Sharing a single `$or` between the search term and the flash-deal filter
      // made the later filter silently overwrite the search term, so
      // `/products?search=watch&deals=true` returned every deal instead of
      // matching deals.
      const clauses: any[] = [];

      if (category) clauses.push({ category: new RegExp(`^${escapeRegex(String(category))}$`, 'i') });
      if (brand) clauses.push({ brand: new RegExp(`^${escapeRegex(String(brand))}$`, 'i') });
      if (search) {
        const pattern = new RegExp(escapeRegex(String(search).trim()), 'i');
        clauses.push({
          $or: [
            { name: pattern },
            { description: pattern },
            { brand: pattern },
            { category: pattern },
            { sku: pattern },
          ],
        });
      }
      if (minPrice || maxPrice) {
        const price: Record<string, number> = {};
        if (minPrice) price.$gte = Number(minPrice);
        if (maxPrice) price.$lte = Number(maxPrice);
        clauses.push({ price });
      }
      if (sale === 'true') clauses.push({ discountPercent: { $gt: 0 } });
      if (deals === 'true') clauses.push({ $or: [{ isFlashDeal: true }, { discountPercent: { $gt: 0 } }] });
      if (bestseller === 'true') clauses.push({ isBestSeller: true });

      if (clauses.length > 0) query.$and = clauses;

      let sort: any = { createdAt: -1 };
      if (sortBy === 'price-low') sort = { price: 1 };
      else if (sortBy === 'price-high') sort = { price: -1 };
      else if (sortBy === 'rating') sort = { rating: -1 };
      else if (sortBy === 'featured') sort = { isFeatured: -1, createdAt: -1 };

      const items = await Product.find(query)
        .sort(sort)
        .limit(limit)
        .skip((page - 1) * limit);
      const total = await Product.countDocuments(query);

      res.json({
        success: true,
        data: items.map(serializeProduct),
        meta: { total: total || items.length, page, limit },
      });
      return;
    }

    // In-memory fallback
    let items = [...memoryStore.products];

    if (category) {
      const catLower = String(category).toLowerCase();
      items = items.filter((p) => p.category.toLowerCase() === catLower);
    }
    if (brand) {
      const brandLower = String(brand).toLowerCase();
      items = items.filter((p) => p.brand.toLowerCase() === brandLower);
    }
    if (search) {
      const term = String(search).toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.brand.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term)
      );
    }
    if (minPrice) items = items.filter((p) => p.price >= Number(minPrice));
    if (maxPrice) items = items.filter((p) => p.price <= Number(maxPrice));
    if (sale === 'true') items = items.filter((p) => p.discountPercent && p.discountPercent > 0);
    if (deals === 'true') items = items.filter((p) => p.isFlashDeal || (p.discountPercent && p.discountPercent > 0));
    if (bestseller === 'true') items = items.filter((p) => p.isBestSeller);

    if (sortBy === 'price-low') items.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') items.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') items.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'featured') items.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));

    const total = items.length;
    const startIndex = (page - 1) * limit;
    const paginated = items.slice(startIndex, startIndex + limit);

    res.json({
      success: true,
      data: paginated,
      meta: { total, page: Number(page), limit: Number(limit) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    if (isDbConnected()) {
      const product = await Product.findOne({
        $or: [
          { slug: slug.toLowerCase() },
          { _id: OBJECT_ID_PATTERN.test(slug) ? slug : null },
          { sku: slug.toUpperCase() },
        ],
      });
      if (product) {
        res.json({ success: true, data: serializeProduct(product) });
        return;
      }
    }

    const memoryProduct = memoryStore.products.find(
      (p) => p.slug === slug || p.id === slug || p.sku.toUpperCase() === slug.toUpperCase()
    );

    if (!memoryProduct) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    res.json({ success: true, data: memoryProduct });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRelatedProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      // `findById` casts its argument, so a slug (or any non-ObjectId) raised a
      // CastError and answered 500 instead of falling through to the lookup below.
      const current = OBJECT_ID_PATTERN.test(id)
        ? await Product.findById(id)
        : await Product.findOne({ $or: [{ slug: id.toLowerCase() }, { sku: id.toUpperCase() }] });
      if (current) {
        const related = await Product.find({
          _id: { $ne: current._id },
          $or: [{ category: current.category }, { brand: current.brand }],
        }).limit(4);
        res.json({ success: true, data: related.map(serializeProduct) });
        return;
      }
    }

    const current = memoryStore.products.find((p) => p.id === id || p.slug === id);
    const related = memoryStore.products
      .filter((p) => p.id !== id && (current ? p.category === current.category || p.brand === current.brand : true))
      .slice(0, 4);

    res.json({ success: true, data: related });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createProduct = async (req: any, res: Response): Promise<void> => {
  try {
    const data = req.body;
    if (!data.name || !data.price || !data.category) {
      res.status(400).json({ success: false, message: 'Name, price, and category are required.' });
      return;
    }

    const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const sku = data.sku || 'MKT-' + Math.floor(1000 + Math.random() * 9000);

    if (isDbConnected()) {
      const product = await Product.create({
        ...data,
        slug,
        sku,
        inventory: Number(data.inventory) || 0,
        price: Number(data.price),
        compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : undefined,
      });

      await AuditLog.create({
        actor: req.user?.name || 'Admin',
        action: 'Product Created',
        resource: product.name,
        details: `SKU: ${product.sku}, Stock: ${product.inventory}, Price: $${product.price}`,
      });

      res.status(201).json({ success: true, data: serializeProduct(product) });
      return;
    }

    const newProd: ProductType = {
      ...data,
      id: 'prod_' + Date.now(),
      slug,
      sku,
      inventory: Number(data.inventory) || 0,
      price: Number(data.price),
      compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : undefined,
      rating: 5.0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
    };

    memoryStore.products.unshift(newProd);
    memoryStore.logAudit(
      req.user?.name || 'Admin',
      'Product Created',
      newProd.name,
      `SKU: ${newProd.sku}, Stock: ${newProd.inventory}, Price: $${newProd.price}`
    );

    res.status(201).json({ success: true, data: newProd });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }
      const product = await Product.findByIdAndUpdate(id, req.body, { returnDocument: 'after', runValidators: true });
      if (!product) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }
      await AuditLog.create({
        actor: req.user?.name || 'Admin',
        action: 'Product Updated',
        resource: product.name,
        details: `Stock: ${product.inventory}, Price: $${product.price}`,
      });
      res.json({ success: true, data: serializeProduct(product) });
      return;
    }

    const index = memoryStore.products.findIndex((p) => p.id === id);
    if (index === -1) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    memoryStore.products[index] = {
      ...memoryStore.products[index],
      ...req.body,
    };

    memoryStore.logAudit(
      req.user?.name || 'Admin',
      'Product Updated',
      memoryStore.products[index].name,
      `Stock: ${memoryStore.products[index].inventory}, Price: $${memoryStore.products[index].price}`
    );

    res.json({ success: true, data: memoryStore.products[index] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }
      const product = await Product.findByIdAndDelete(id);
      if (product) {
        await AuditLog.create({
          actor: req.user?.name || 'Admin',
          action: 'Product Archived/Deleted',
          resource: product.name,
          details: `Removed product ID ${id}`,
        });
      }
      res.json({ success: true, message: 'Product removed successfully' });
      return;
    }

    const index = memoryStore.products.findIndex((p) => p.id === id);
    if (index !== -1) {
      const removed = memoryStore.products.splice(index, 1)[0];
      memoryStore.logAudit(
        req.user?.name || 'Admin',
        'Product Archived/Deleted',
        removed.name,
        `Removed product ID ${id}`
      );
    }

    res.json({ success: true, message: 'Product removed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
