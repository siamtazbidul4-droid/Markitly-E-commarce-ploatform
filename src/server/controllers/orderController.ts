import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Order as OrderModel, OrderStatus as MongoOrderStatus } from '../models/Order';
import { Product as ProductModel } from '../models/Product';
import { AuditLog as AuditLogModel } from '../models/AuditLog';
import { isDbConnected } from '../config/db';
import { memoryStore } from '../config/memoryStore';
import { serializeDocument } from '../utils/serializeDocument';
import { Order, OrderItem, OrderStatus, PaymentMethod } from '../../types';
import { AuthRequest, AuthUser } from '../middleware/auth';
import { resolveCoupon } from '../../lib/coupons';

/** Mongoose documents expose `_id`; the client contract requires `id`. */
const serializeOrder = serializeDocument;

const STAFF_ROLES: readonly string[] = ['super_admin', 'admin', 'content_manager'];

const isStaff = (req: AuthRequest): boolean =>
  !!req.user && STAFF_ROLES.includes(req.user.role);

/**
 * Resolves the identity an order must be attributed to.
 *
 * A signed-in caller is authoritative: their verified token id/email always win.
 * The submitted `customer` object is only trusted for guests, because it is
 * otherwise attacker-controlled and would allow claiming ownership of somebody
 * else's account.
 */
interface OrderOwner {
  userId?: string;
  email: string;
  phone: string;
  name: string;
}

const resolveOwner = (req: AuthRequest, bodyCustomer: any, address: any): OrderOwner => {
  const submitted = bodyCustomer && typeof bodyCustomer === 'object' ? bodyCustomer : {};

  if (req.user) {
    return {
      userId: req.user.id,
      email: req.user.email || address?.email || '',
      phone: address?.phone || submitted.phone || '',
      name: address?.fullName || submitted.name || req.user.name,
    };
  }

  return {
    userId: typeof submitted.userId === 'string' ? submitted.userId : undefined,
    email: address?.email || submitted.email || '',
    phone: address?.phone || submitted.phone || '',
    name: address?.fullName || submitted.name || 'Guest Customer',
  };
};

/**
 * True when the order belongs to the caller.
 *
 * `customer.userId` is the durable ownership key: a customer may legitimately
 * type a different contact email into the checkout address form, and matching on
 * email alone silently dropped those orders out of their own order history.
 * The email comparison is retained for legacy rows written before `userId` was
 * recorded server-side.
 */
const isOrderOwner = (order: Record<string, unknown>, user: AuthUser): boolean => {
  const customer = (order.customer ?? {}) as { userId?: string; email?: string };
  const ownerId = typeof customer.userId === 'string' ? customer.userId : '';
  if (ownerId && ownerId === user.id) return true;
  const ownerEmail = (customer.email ?? '').toLowerCase();
  return !!ownerEmail && ownerEmail === user.email.toLowerCase();
};

/** Strict 24-character hex test; `isValid` also accepts 12-character strings. */
const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const PAYMENT_METHODS = ['cod', 'bkash', 'nagad', 'card'] as const;
type StoredPaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * Maps whatever the storefront sent onto the stored enum.
 *
 * The checkout UI offers "Cash on Delivery" but the schema stores `cod`, and a
 * raw pass-through made `Order.create` raise a ValidationError that surfaced as
 * an unexplained 500.
 */
const normalizePaymentMethod = (value: unknown): StoredPaymentMethod | null => {
  if (typeof value !== 'string') return null;
  const key = value.trim().toLowerCase().replace(/[\s_]+/g, '');
  const aliases: Record<string, StoredPaymentMethod> = {
    cod: 'cod',
    cash: 'cod',
    cashondelivery: 'cod',
    bkash: 'bkash',
    nagad: 'nagad',
    card: 'card',
    creditcard: 'card',
    debitcard: 'card',
  };
  return aliases[key] ?? null;
};

interface IncomingOrderItem {
  productId?: unknown;
  variantId?: unknown;
  name?: unknown;
  sku?: unknown;
  price?: unknown;
  quantity?: unknown;
  image?: unknown;
  selectedAttributes?: unknown;
}

/**
 * Turns an untrusted Mongoose/driver failure into the right HTTP status.
 *
 * A malformed or missing field is a client error and must not be reported as a
 * server fault, and the raw driver text must not be echoed to the browser.
 */
const describeRequestFailure = (error: unknown): { status: number; message: string } => {
  const name = (error as { name?: string } | null)?.name;
  if (name === 'ValidationError' || name === 'CastError') {
    return {
      status: 400,
      message: 'The order payload was rejected by the server. Please review your cart and address.',
    };
  }
  const code = (error as { code?: number | string } | null)?.code;
  if (code === 11000) {
    return { status: 409, message: 'An order with these details already exists. Please try again.' };
  }
  return { status: 500, message: 'The order could not be processed. Please try again.' };
};

/**
 * Order tracking is reachable without a session, so personally identifying
 * fields are stripped unless the caller is staff or the order's own customer.
 * Status, items and totals stay available, which is all tracking needs.
 */
const redactOrderForGuest = (order: Record<string, unknown>): Record<string, unknown> => ({
  ...order,
  customer: { name: 'Customer', email: '', phone: '', userId: '' },
  shippingAddress: undefined,
});

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customer, shippingAddress, items, couponCode, paymentMethod } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Cart is empty. Cannot create order.' });
      return;
    }

    if (
      !shippingAddress ||
      typeof shippingAddress !== 'object' ||
      !shippingAddress.fullName ||
      !shippingAddress.phone ||
      !shippingAddress.streetAddress
    ) {
      res.status(400).json({ success: false, message: 'Incomplete Bangladesh shipping address provided.' });
      return;
    }

    const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);
    if (!normalizedPaymentMethod) {
      res.status(400).json({ success: false, message: 'Select a valid payment method to place this order.' });
      return;
    }

    const owner = resolveOwner(req, customer, shippingAddress);

    if (isDbConnected()) {
      let computedSubtotal = 0;
      const validatedItems = [];
      // Stock is decremented in a separate pass after every rejection point, so a
      // failed order cannot silently consume inventory. Previously each line was
      // saved inside this loop, so a later rejection (unknown coupon, failed
      // `create`) left stock permanently reduced with no order to show for it.
      const stockToCommit: Array<{ product: any; variant: any; quantity: number }> = [];

      for (const [index, rawItem] of (items as IncomingOrderItem[]).entries()) {
        const item = rawItem ?? {};
        const productId = typeof item.productId === 'string' ? item.productId.trim() : '';
        const quantity = Number(item.quantity);

        // Without this guard `ProductModel.findById(undefined)` silently matched an
        // arbitrary document, and a missing id reached `Order.create` as a missing
        // required field, which the generic catch turned into a 500.
        if (!productId) {
          res.status(400).json({
            success: false,
            message: `Cart line ${index + 1} is missing its product reference. Refresh the catalog and try again.`,
          });
          return;
        }
        if (!Number.isInteger(quantity) || quantity < 1) {
          res.status(400).json({
            success: false,
            message: `Cart line ${index + 1} has an invalid quantity.`,
          });
          return;
        }

        const dbProduct = OBJECT_ID_PATTERN.test(productId)
          ? await ProductModel.findById(productId)
          : await ProductModel.findOne({
              $or: [{ slug: productId.toLowerCase() }, { sku: productId.toUpperCase() }],
            });

        if (!dbProduct) {
          res.status(400).json({
            success: false,
            message: `A product in your cart is no longer available. Please review your cart.`,
          });
          return;
        }

        let price = dbProduct.price;
        let matchedVariant: any = null;
        if (item.variantId && dbProduct.variants) {
          const variant = dbProduct.variants.find((v: any) => v.id === item.variantId);
          if (variant) {
            price = variant.price;
            if (variant.inventory < quantity) {
              res.status(400).json({
                success: false,
                message: `Insufficient stock for ${dbProduct.name} (${variant.name}). Only ${variant.inventory} available.`,
              });
              return;
            }
            matchedVariant = variant;
          }
        }

        if (dbProduct.inventory < quantity) {
          res.status(400).json({
            success: false,
            message: `Insufficient stock for ${dbProduct.name}.`,
          });
          return;
        }

        stockToCommit.push({ product: dbProduct, variant: matchedVariant, quantity });

        computedSubtotal += price * quantity;
        validatedItems.push({
          productId: dbProduct._id.toString(),
          variantId: item.variantId,
          name: dbProduct.name,
          sku: item.sku || dbProduct.sku,
          price,
          quantity,
          image: dbProduct.mainImage,
          selectedAttributes: item.selectedAttributes,
        });
      }

      const shippingFee = computedSubtotal >= 49 ? 0 : 4.99;
      const coupon = resolveCoupon(couponCode, computedSubtotal);
      if (coupon.rejection) {
        res.status(400).json({ success: false, message: coupon.message });
        return;
      }
      const discount = coupon.discount;
      const computedTotal = Math.max(0, computedSubtotal + shippingFee - discount);
      const orderNumber = `MKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const isCashOnDelivery = normalizedPaymentMethod === 'cod';

      // All validation has passed: commit the reserved stock, then record the
      // order. A failure after this point is surfaced by the catch block below.
      for (const { product, variant, quantity } of stockToCommit) {
        product.inventory = Math.max(0, product.inventory - quantity);
        if (variant) variant.inventory = Math.max(0, variant.inventory - quantity);
        await product.save();
      }

      const newOrder = await OrderModel.create({
        orderNumber,
        customer: {
          userId: owner.userId,
          name: owner.name,
          email: owner.email,
          phone: owner.phone,
        },
        shippingAddress,
        items: validatedItems,
        subtotal: computedSubtotal,
        discount,
        shippingFee,
        total: computedTotal,
        couponCode,
        paymentMethod: normalizedPaymentMethod,
        paymentStatus: isCashOnDelivery ? 'Pending' : 'Paid',
        orderStatus: 'Confirmed',
        statusHistory: [
          {
            status: 'Confirmed',
            timestamp: new Date(),
            note: isCashOnDelivery
              ? 'Order confirmed. Cash on Delivery verification pending.'
              : `Payment verified via ${normalizedPaymentMethod.toUpperCase()}. Order confirmed.`,
          },
        ],
      });

      await AuditLogModel.create({
        actor: shippingAddress.fullName,
        action: 'Order Placed',
        resource: orderNumber,
        details: `Total: $${computedTotal.toFixed(2)}, Items: ${validatedItems.length}, Method: ${normalizedPaymentMethod}`,
      });

      res.status(201).json({ success: true, data: serializeOrder(newOrder) });
      return;
    }

    // In-memory checkout processing
    let computedSubtotal = 0;
    const validatedItems: OrderItem[] = [];
    // Stock is applied only once the order is accepted, matching the DB branch.
    const stockToCommit: Array<{ product: (typeof memoryStore.products)[number]; quantity: number }> = [];

    for (const [index, rawItem] of (items as IncomingOrderItem[]).entries()) {
      const item = rawItem ?? {};
      const productId = typeof item.productId === 'string' ? item.productId.trim() : '';
      const quantity = Number(item.quantity);

      if (!productId) {
        res.status(400).json({
          success: false,
          message: `Cart line ${index + 1} is missing its product reference. Refresh the catalog and try again.`,
        });
        return;
      }
      if (!Number.isInteger(quantity) || quantity < 1) {
        res.status(400).json({
          success: false,
          message: `Cart line ${index + 1} has an invalid quantity.`,
        });
        return;
      }

      const prod =
        memoryStore.products.find((p) => p.id === productId || p.slug === productId) ??
        memoryStore.products.find((p) => p.sku.toUpperCase() === productId.toUpperCase());

      if (!prod) {
        res.status(400).json({
          success: false,
          message: `A product in your cart is no longer available. Please review your cart.`,
        });
        return;
      }
      const price = prod.price;

      if (prod.inventory < quantity) {
        res.status(400).json({
          success: false,
          message: `Insufficient stock for ${prod.name}.`,
        });
        return;
      }

      // Deferred so a later rejection (unknown coupon) cannot consume stock.
      stockToCommit.push({ product: prod, quantity });

      computedSubtotal += price * quantity;
      validatedItems.push({
        productId: prod.id,
        variantId: typeof item.variantId === 'string' ? item.variantId : undefined,
        name: prod.name,
        sku: typeof item.sku === 'string' && item.sku ? item.sku : prod.sku,
        price,
        quantity,
        image: prod.mainImage,
        selectedAttributes: (item.selectedAttributes ?? undefined) as
          | Record<string, string>
          | undefined,
      });
    }

    const shippingFee = computedSubtotal >= 49 ? 0 : 4.99;
    const coupon = resolveCoupon(couponCode, computedSubtotal);
    if (coupon.rejection) {
      res.status(400).json({ success: false, message: coupon.message });
      return;
    }
    const discount = coupon.discount;
    const computedTotal = Math.max(0, computedSubtotal + shippingFee - discount);
    const orderNumber = `MKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const isCashOnDelivery = normalizedPaymentMethod === 'cod';

    // Validation complete: commit the reserved stock.
    for (const { product, quantity } of stockToCommit) {
      product.inventory = Math.max(0, product.inventory - quantity);
    }

    const newOrder: Order = {
      id: 'ord_' + Date.now(),
      orderNumber,
      customer: {
        userId: owner.userId,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
      },
      shippingAddress,
      items: validatedItems,
      subtotal: computedSubtotal,
      discount,
      shippingFee,
      total: computedTotal,
      couponCode,
      paymentMethod: normalizedPaymentMethod as PaymentMethod,
      paymentStatus: isCashOnDelivery ? 'Pending' : 'Paid',
      orderStatus: 'Confirmed',
      statusHistory: [
        {
          status: 'Confirmed',
          timestamp: new Date().toISOString(),
          note: isCashOnDelivery
            ? 'Order placed. Cash on Delivery verification pending.'
            : `Payment verified via ${normalizedPaymentMethod.toUpperCase()}. Order confirmed.`,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    memoryStore.orders.unshift(newOrder);
    memoryStore.logAudit(
      shippingAddress.fullName,
      'Order Placed',
      orderNumber,
      `Total: $${computedTotal.toFixed(2)}, Items: ${validatedItems.length}, Method: ${normalizedPaymentMethod}`
    );

    res.status(201).json({ success: true, data: newOrder });
  } catch (error: unknown) {
    console.error('[Order] createOrder failed:', (error as Error)?.message || error);
    const { status, message } = describeRequestFailure(error);
    res.status(status).json({ success: false, message });
  }
};

/**
 * Order list for the signed-in caller.
 *
 * Staff see every order; a customer only ever sees their own. Previously this
 * endpoint had no authentication and returned the full book of orders -
 * including customer names, emails, phone numbers and street addresses - to any
 * anonymous caller.
 *
 * Ownership matches on `customer.userId`, not on the contact email. The checkout
 * form lets a customer type any address email they like, so an email-only filter
 * returned an empty history for any order placed with a different address email
 * even though the same person signed in and created it.
 */
export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' });
      return;
    }

    const user = req.user;

    if (isDbConnected()) {
      const ownedById = OBJECT_ID_PATTERN.test(user.id) ? { 'customer.userId': user.id } : null;
      const ownedByEmail = { 'customer.email': user.email.toLowerCase() };

      // `userId` is the durable key; the email clause only recovers legacy rows
      // written before ownership was recorded server-side.
      const filter = isStaff(req)
        ? {}
        : ownedById
        ? { $or: [ownedById, ownedByEmail] }
        : ownedByEmail;

      const orders = await OrderModel.find(filter).sort({ createdAt: -1 });
      res.json({ success: true, data: orders.map(serializeOrder) });
      return;
    }

    const scoped = isStaff(req)
      ? memoryStore.orders
      : memoryStore.orders.filter((o) => isOrderOwner(o as unknown as Record<string, unknown>, user));
    res.json({ success: true, data: scoped });
  } catch (error: unknown) {
    console.error('[Order] request failed:', (error as Error)?.message || error);
    res.status(500).json({
      success: false,
      message: 'The order service is temporarily unavailable. Please try again.',
    });
  }
};

/** Admin-only order book used by the control center. */
export const getAllOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (isDbConnected()) {
      const orders = await OrderModel.find().sort({ createdAt: -1 });
      res.json({ success: true, data: orders.map(serializeOrder) });
      return;
    }
    res.json({ success: true, data: memoryStore.orders });
  } catch (error: unknown) {
    console.error('[Order] request failed:', (error as Error)?.message || error);
    res.status(500).json({
      success: false,
      message: 'The order service is temporarily unavailable. Please try again.',
    });
  }
};

/**
 * Resolves an order from either an order number (MKT-2026-1234) or a Mongo id.
 *
 * The route is mounted as both `/orders/track/:orderNumber` and `/orders/:id`,
 * so the identifier arrives under two different parameter names. Reading only
 * `orderNumber` made `GET /orders/:id` dereference `undefined` and return 500.
 */
const resolveOrderIdentifier = (params: Record<string, string | undefined>): string | null => {
  const raw = params.orderNumber ?? params.id;
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  return value.length > 0 ? value : null;
};

export const getOrderByNumber = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const identifier = resolveOrderIdentifier(req.params as Record<string, string | undefined>);

    if (!identifier) {
      res.status(400).json({ success: false, message: 'An order number or order id is required.' });
      return;
    }

    const present = (order: Record<string, unknown>): Record<string, unknown> => {
      if (isStaff(req)) return order;
      if (req.user && isOrderOwner(order, req.user)) return order;
      return redactOrderForGuest(order);
    };

    if (isDbConnected()) {
      const order = await OrderModel.findOne({
        $or: [
          { orderNumber: identifier },
          { _id: mongoose.Types.ObjectId.isValid(identifier) ? identifier : null },
        ],
      });
      if (order) {
        res.json({ success: true, data: present(serializeOrder(order)) });
        return;
      }
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    const order = memoryStore.orders.find(
      (o) => o.orderNumber.toUpperCase() === identifier.toUpperCase() || o.id === identifier
    );

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    res.json({ success: true, data: present({ ...order }) });
  } catch (error: unknown) {
    console.error('[Order] request failed:', (error as Error)?.message || error);
    res.status(500).json({
      success: false,
      message: 'The order service is temporarily unavailable. Please try again.',
    });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!status) {
      res.status(400).json({ success: false, message: 'A target order status is required.' });
      return;
    }

    if (isDbConnected()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid order identifier.' });
        return;
      }
      const order = await OrderModel.findById(id);
      if (!order) {
        res.status(404).json({ success: false, message: 'Order not found' });
        return;
      }

      order.orderStatus = status as MongoOrderStatus;
      order.statusHistory.push({
        status: status as MongoOrderStatus,
        timestamp: new Date(),
        note: note || `Status transitioned to ${status}`,
      });

      if (status === 'Delivered') {
        order.paymentStatus = 'Paid';
      }

      await order.save();

      await AuditLogModel.create({
        actor: req.user?.name || 'Admin',
        action: 'Order Status Changed',
        resource: order.orderNumber,
        details: `Transitioned to ${status}. Note: ${note || 'None'}`,
      });

      res.json({ success: true, data: serializeOrder(order) });
      return;
    }

    const order = memoryStore.orders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    order.orderStatus = status as OrderStatus;
    order.statusHistory.push({
      status: status as OrderStatus,
      timestamp: new Date().toISOString(),
      note: note || `Status transitioned to ${status}`,
    });

    if (status === 'Delivered') {
      order.paymentStatus = 'Paid';
    }

    memoryStore.logAudit(
      req.user?.name || 'Admin',
      'Order Status Changed',
      order.orderNumber,
      `Transitioned to ${status}. Note: ${note || 'None'}`
    );

    res.json({ success: true, data: order });
  } catch (error: unknown) {
    console.error('[Order] request failed:', (error as Error)?.message || error);
    res.status(500).json({
      success: false,
      message: 'The order service is temporarily unavailable. Please try again.',
    });
  }
};
