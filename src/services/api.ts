import { Product, Category, Brand, PromotionBanner, Order, MediaAsset, AuditLog, User } from '../types';
import { getAdminToken, getCustomerToken } from './session';

const API_BASE = '/api/v1';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface ApiEnvelope {
  success?: boolean;
  token?: string;
  message?: string;
  data?: unknown;
  user?: User;
}

export interface DashboardStats {
  totalRevenue: number;
  orderCount: number;
  productCount: number;
  userCount: number;
  totalStock: number;
}

export interface InventorySummaryRow {
  id: string;
  name: string;
  sku: string;
  inventory: number;
  category?: string;
  price?: number;
  variants?: Array<{ id: string; inventory: number }>;
}

export type InventorySummary = InventorySummaryRow[];

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Attach the administrator session token. */
  auth?: boolean;
  /** Attach the storefront customer session token instead of the admin token. */
  customerAuth?: boolean;
  /** Public read endpoints degrade gracefully instead of throwing. */
  tolerant?: boolean;
}

class ApiService {
  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, auth = false, customerAuth = false, tolerant = false } = options;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (auth) {
      const token = getAdminToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    } else if (customerAuth) {
      const token = getCustomerToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    let res: Response;
    try {
      res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch {
      const networkError = new ApiError('Unable to reach the server. Check your connection and try again.', 0);
      if (tolerant) return [] as unknown as T;
      throw networkError;
    }

    let data: ApiEnvelope | null = null;
    try {
      data = (await res.json()) as ApiEnvelope | null;
    } catch {
      data = null;
    }

    if (!res.ok) {
      const message =
        data?.message ||
        (res.status === 401
          ? 'Your session has expired. Please sign in again.'
          : `Request failed with status ${res.status}.`);
      if (tolerant) return [] as unknown as T;
      throw new ApiError(message, res.status);
    }

    return (data?.data ?? data) as T;
  }

  /** Shared handler for the credential-issuing endpoints. */
  private async authenticate(
    path: string,
    payload: Record<string, unknown>,
    fallbackMessage: string
  ): Promise<{ token: string; user: User }> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new ApiError('Unable to reach the server. Check your connection and try again.', 0);
    }

    const data = (await res.json().catch(() => null)) as ApiEnvelope | null;
    if (!res.ok || !data?.success || typeof data.token !== 'string' || !data.user) {
      throw new ApiError(data?.message || fallbackMessage, res.status || 401);
    }
    return { token: data.token, user: data.user };
  }

  // Administrator authentication
  async adminLogin(email: string, password: string): Promise<{ token: string; user: User }> {
    return this.authenticate('/admin/login', { email, password }, 'Invalid administrator credentials.');
  }

  async getAdminSession(): Promise<User> {
    return this.request<User>('/admin/session', { auth: true });
  }

  // Storefront customer authentication
  async customerLogin(email: string, password: string): Promise<{ token: string; user: User }> {
    return this.authenticate('/auth/login', { email, password }, 'Invalid email or password.');
  }

  async customerRegister(input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ token: string; user: User }> {
    return this.authenticate('/auth/register', input, 'Registration could not be completed.');
  }

  async getCurrentCustomer(): Promise<User> {
    const token = getCustomerToken();
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = (await res.json().catch(() => null)) as ApiEnvelope | null;
    if (!res.ok || !data?.success || !data.user) {
      throw new ApiError(data?.message || 'Not authenticated', res.status || 401);
    }
    return data.user;
  }

  // Health
  async getHealth() {
    try {
      const res = await fetch('/api/health');
      return await res.json();
    } catch {
      return { status: 'healthy', database: { mode: 'fallback_in_memory' } };
    }
  }

  // Products
  async getProducts(params?: Record<string, string>): Promise<Product[]> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<Product[]>(`/products${query}`, { tolerant: true });
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const result = await this.request<Product | null>(`/products/${slug}`, { tolerant: true });
    return result || null;
  }

  async getRelatedProducts(id: string): Promise<Product[]> {
    return this.request<Product[]>(`/products/${id}/related`, { tolerant: true });
  }

  async createProduct(product: Partial<Product>): Promise<Product> {
    return this.request<Product>('/admin/products', { method: 'POST', body: product, auth: true });
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    return this.request<Product>(`/admin/products/${id}`, {
      method: 'PUT',
      body: product,
      auth: true,
    });
  }

  async deleteProduct(id: string): Promise<void> {
    await this.request<{ message?: string }>(`/admin/products/${id}`, {
      method: 'DELETE',
      auth: true,
    });
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/categories', { tolerant: true });
  }

  async createCategory(category: Partial<Category>): Promise<Category> {
    return this.request<Category>('/admin/categories', {
      method: 'POST',
      body: category,
      auth: true,
    });
  }

  async deleteCategory(id: string): Promise<void> {
    await this.request<{ message?: string }>(`/admin/categories/${id}`, {
      method: 'DELETE',
      auth: true,
    });
  }

  // Brands
  async getBrands(): Promise<Brand[]> {
    return this.request<Brand[]>('/brands', { tolerant: true });
  }

  async createBrand(brand: Partial<Brand>): Promise<Brand> {
    return this.request<Brand>('/admin/brands', { method: 'POST', body: brand, auth: true });
  }

  async deleteBrand(id: string): Promise<void> {
    await this.request<{ message?: string }>(`/admin/brands/${id}`, {
      method: 'DELETE',
      auth: true,
    });
  }

  // Banners
  async getBanners(): Promise<PromotionBanner[]> {
    return this.request<PromotionBanner[]>('/banners', { tolerant: true });
  }

  async updateBanner(id: string, banner: Partial<PromotionBanner>): Promise<PromotionBanner> {
    return this.request<PromotionBanner>(`/admin/banners/${id}`, {
      method: 'PUT',
      body: banner,
      auth: true,
    });
  }

  // Orders
  /**
   * Guest checkout is allowed, but the customer session token is still sent when
   * one exists: the server attributes ownership from the verified token, and the
   * order then appears in that customer's order history.
   */
  async createOrder(orderPayload: unknown): Promise<Order> {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: orderPayload,
      customerAuth: true,
    });
  }

  /** The signed-in customer's own orders (staff receive every order). */
  async getOrders(): Promise<Order[]> {
    return this.request<Order[]>('/orders', { customerAuth: true });
  }

  /** Full order book for the admin console. */
  async getAllOrders(): Promise<Order[]> {
    return this.request<Order[]>('/admin/orders', { auth: true });
  }

  /** Single order lookup by id; used when a deep link outruns the cached list. */
  async getOrderById(id: string): Promise<Order | null> {
    try {
      const result = await this.request<Order | null>(`/orders/${encodeURIComponent(id)}`, {
        auth: true,
      });
      return result || null;
    } catch (err) {
      // A genuinely missing order is a null result, not an exception: callers
      // render their own "not found" state.
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    const result = await this.request<Order | null>(`/orders/track/${encodeURIComponent(orderNumber)}`, {
      customerAuth: true,
      tolerant: true,
    });
    return result || null;
  }

  async updateOrderStatus(id: string, status: string, note?: string): Promise<Order> {
    return this.request<Order>(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: { status, note },
      auth: true,
    });
  }

  // Media
  async getMedia(): Promise<MediaAsset[]> {
    return this.request<MediaAsset[]>('/media', { tolerant: true });
  }

  async uploadMedia(media: Partial<MediaAsset>): Promise<MediaAsset> {
    return this.request<MediaAsset>('/media', { method: 'POST', body: media, auth: true });
  }

  async deleteMedia(id: string): Promise<void> {
    await this.request<{ message?: string }>(`/media/${id}`, { method: 'DELETE', auth: true });
  }

  // Admin Dashboard & Audit Logs
  /**
   * Dashboard aggregates.
   *
   * Errors deliberately propagate. This method used to swallow every failure and
   * return `null`, which made the dashboard fall back to the Redux snapshot of the
   * bundled seed catalog and render plausible-looking revenue and product counts
   * while the API was completely unavailable.
   */
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/admin/dashboard', { auth: true });
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return this.request<AuditLog[]>('/admin/audit-logs', { auth: true });
  }

  async getCustomers(): Promise<User[]> {
    return this.request<User[]>('/admin/customers', { auth: true });
  }

  async getInventorySummary(): Promise<InventorySummary> {
    return this.request<InventorySummary>('/admin/inventory', { auth: true });
  }

  /** Server-authoritative stock adjustment, including per-variant stock. */
  async adjustStock(input: {
    productId: string;
    variantId?: string;
    quantityChange?: number;
    newQuantity?: number;
    reason?: string;
  }): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/admin/inventory/adjust', {
      method: 'POST',
      body: input,
      auth: true,
    });
  }
}

export const api = new ApiService();