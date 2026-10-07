import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import {
  getProducts,
  getProductBySlug,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController';
import {
  getCategories,
  createCategory,
  deleteCategory,
  getBrands,
  createBrand,
  deleteBrand,
} from '../controllers/categoryController';
import {
  createOrder,
  getOrders,
  getAllOrders,
  getOrderByNumber,
  updateOrderStatus,
} from '../controllers/orderController';
import {
  getBanners,
  updateBanner,
  getMediaAssets,
  createMediaAsset,
  deleteMediaAsset,
  getDashboardStats,
  getAuditLogs,
  getCustomers,
  getInventorySummary,
  adjustStock,
} from '../controllers/adminController';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth';
import { adminLogin, getAdminSession } from '../controllers/adminAuthController';
import { dbStatus } from '../config/db';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Marketly Luxury Single-Vendor Commerce API',
    database: {
      connected: dbStatus.connected,
      mode: dbStatus.mode,
      host: dbStatus.host || 'Atlas-Managed',
    },
    version: '1.0.0',
  });
});

// Administrator Authentication Routes
// Credentials are verified server-side against ADMIN_EMAIL / ADMIN_PASSWORD.
router.post('/v1/admin/login', adminLogin);
router.get('/v1/admin/session', authenticate, requireRole(['super_admin', 'admin']), getAdminSession);

// Authentication Routes
router.post('/v1/auth/register', register);
router.post('/v1/auth/login', login);
router.get('/v1/auth/me', authenticate, getMe);

// Public Catalog Routes
router.get('/v1/products', getProducts);
router.get('/v1/products/:slug', getProductBySlug);
router.get('/v1/products/:id/related', getRelatedProducts);

router.get('/v1/categories', getCategories);
router.get('/v1/brands', getBrands);
router.get('/v1/banners', getBanners);

// Order & Checkout Routes
// Guest checkout stays supported, so the session is optional here. It must still
// be parsed when present: without it `req.user` was always undefined and the
// order was attributed to whatever email the request body claimed, which is both
// spoofable and unreliable for later order-history lookups.
router.post('/v1/orders', optionalAuth, createOrder);
// Tracking stays reachable by order number for guests, but the controller
// redacts personally identifying fields unless the caller is staff or the owner.
router.get('/v1/orders/track/:orderNumber', optionalAuth, getOrderByNumber);
router.get('/v1/orders/:id', optionalAuth, getOrderByNumber);
// Scoped to the caller: staff see everything, customers only their own orders.
router.get('/v1/orders', authenticate, getOrders);

// Media Routes
router.get('/v1/media', getMediaAssets);
router.post('/v1/media', authenticate, requireRole(['super_admin', 'admin', 'content_manager']), createMediaAsset);
router.delete('/v1/media/:id', authenticate, requireRole(['super_admin', 'admin', 'content_manager']), deleteMediaAsset);

// Admin Control Center Routes
router.post('/v1/admin/products', authenticate, requireRole(['super_admin', 'admin', 'content_manager']), createProduct);
router.put('/v1/admin/products/:id', authenticate, requireRole(['super_admin', 'admin', 'content_manager']), updateProduct);
router.delete('/v1/admin/products/:id', authenticate, requireRole(['super_admin', 'admin']), deleteProduct);

router.post('/v1/admin/categories', authenticate, requireRole(['super_admin', 'admin', 'content_manager']), createCategory);
router.delete('/v1/admin/categories/:id', authenticate, requireRole(['super_admin', 'admin']), deleteCategory);

router.post('/v1/admin/brands', authenticate, requireRole(['super_admin', 'admin', 'content_manager']), createBrand);
router.delete('/v1/admin/brands/:id', authenticate, requireRole(['super_admin', 'admin']), deleteBrand);

router.put('/v1/admin/banners/:id', authenticate, requireRole(['super_admin', 'admin', 'content_manager']), updateBanner);
router.put('/v1/admin/orders/:id/status', authenticate, requireRole(['super_admin', 'admin']), updateOrderStatus);
router.get('/v1/admin/orders', authenticate, requireRole(['super_admin', 'admin']), getAllOrders);

router.get('/v1/admin/dashboard', authenticate, requireRole(['super_admin', 'admin']), getDashboardStats);
router.get('/v1/admin/audit-logs', authenticate, requireRole(['super_admin', 'admin']), getAuditLogs);
router.get('/v1/admin/customers', authenticate, requireRole(['super_admin', 'admin']), getCustomers);
router.get('/v1/admin/inventory', authenticate, requireRole(['super_admin', 'admin', 'content_manager']), getInventorySummary);
router.post('/v1/admin/inventory/adjust', authenticate, requireRole(['super_admin', 'admin']), adjustStock);

export default router;
