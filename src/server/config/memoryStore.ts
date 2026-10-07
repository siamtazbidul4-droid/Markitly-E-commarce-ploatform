import {
  initialProducts,
  initialCategories,
  initialBrands,
  initialBanners,
  initialReviews,
  initialAuditLogs,
  initialMediaAssets,
} from '../../services/mockData';
import { Product, Category, Brand, PromotionBanner, Order, AuditLog, MediaAsset, User } from '../../types';

class MemoryStore {
  products: Product[] = JSON.parse(JSON.stringify(initialProducts));
  categories: Category[] = JSON.parse(JSON.stringify(initialCategories));
  brands: Brand[] = JSON.parse(JSON.stringify(initialBrands));
  banners: PromotionBanner[] = JSON.parse(JSON.stringify(initialBanners));
  reviews: Record<string, any[]> = JSON.parse(JSON.stringify(initialReviews));
  auditLogs: AuditLog[] = JSON.parse(JSON.stringify(initialAuditLogs));
  mediaAssets: MediaAsset[] = JSON.parse(JSON.stringify(initialMediaAssets));
  users: User[] = [
    {
      id: 'usr_admin_1',
      name: 'Mahim Haque (Super Admin)',
      email: 'admin@marketly.com',
      role: 'super_admin',
      phone: '+880 1712-345678',
      addresses: [
        {
          fullName: 'Mahim Haque',
          phone: '+880 1712-345678',
          email: 'admin@marketly.com',
          division: 'Dhaka',
          district: 'Dhaka',
          upazila: 'Gulshan',
          union: 'Ward 19',
          streetAddress: 'House 42, Road 11, Block D, Banani',
          postalCode: '1213',
        },
      ],
    },
    {
      id: 'usr_customer_demo',
      name: 'Emily Johnson',
      email: 'customer@marketly.com',
      role: 'customer',
      phone: '+880 1812-987654',
      addresses: [
        {
          fullName: 'Emily Johnson',
          phone: '+880 1812-987654',
          email: 'customer@marketly.com',
          division: 'Dhaka',
          district: 'Dhaka',
          upazila: 'Dhanmondi',
          union: 'Ward 15',
          streetAddress: 'Apartment 4B, Road 7/A, Dhanmondi',
          postalCode: '1209',
        },
      ],
    },
  ];

  orders: Order[] = [
    {
      id: 'ord_1042',
      orderNumber: 'MKT-2026-1042',
      customer: {
        userId: 'usr_customer_demo',
        name: 'Emily Johnson',
        email: 'customer@marketly.com',
        phone: '+880 1812-987654',
      },
      shippingAddress: {
        fullName: 'Emily Johnson',
        phone: '+880 1812-987654',
        email: 'customer@marketly.com',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Dhanmondi',
        union: 'Ward 15',
        streetAddress: 'Apartment 4B, Road 7/A, Dhanmondi',
        postalCode: '1209',
      },
      items: [
        {
          productId: 'prod_smartwatch_1',
          name: 'Ultra Precision Smartwatch OLED Series 9',
          sku: 'SW-900-BLK',
          price: 249.99,
          quantity: 1,
          image: '/src/assets/images/smartwatch_flash_deal_1790933014371.jpg',
        },
      ],
      subtotal: 249.99,
      discount: 0,
      shippingFee: 0,
      total: 249.99,
      paymentMethod: 'bkash',
      paymentStatus: 'Paid',
      orderStatus: 'Shipped',
      statusHistory: [
        { status: 'Pending Payment', timestamp: new Date(Date.now() - 172800000).toISOString() },
        { status: 'Confirmed', timestamp: new Date(Date.now() - 150000000).toISOString() },
        { status: 'Processing', timestamp: new Date(Date.now() - 86400000).toISOString() },
        { status: 'Shipped', timestamp: new Date(Date.now() - 28800000).toISOString(), note: 'Dispatched via Pathao Courier' },
      ],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: 'ord_1043',
      orderNumber: 'MKT-2026-1043',
      customer: {
        name: 'Tanvir Ahmed',
        email: 'tanvir@gmail.com',
        phone: '+880 1911-223344',
      },
      shippingAddress: {
        fullName: 'Tanvir Ahmed',
        phone: '+880 1911-223344',
        email: 'tanvir@gmail.com',
        division: 'Chittagong',
        district: 'Chittagong',
        upazila: 'Panchlaish',
        union: 'Nasirabad',
        streetAddress: 'Plot 12, GEC Circle',
        postalCode: '4000',
      },
      items: [
        {
          productId: 'prod_sneakers_1',
          name: "Men's Air Aerodynamic Running Sneakers",
          sku: 'SNK-AIR-WHT',
          price: 119.99,
          quantity: 1,
          image: '/src/assets/images/sneakers_white_air_1790933024489.jpg',
        },
      ],
      subtotal: 119.99,
      discount: 10,
      shippingFee: 5,
      total: 114.99,
      paymentMethod: 'cod',
      paymentStatus: 'Pending',
      orderStatus: 'Processing',
      statusHistory: [
        { status: 'Confirmed', timestamp: new Date(Date.now() - 36000000).toISOString() },
        { status: 'Processing', timestamp: new Date(Date.now() - 18000000).toISOString() },
      ],
      createdAt: new Date(Date.now() - 36000000).toISOString(),
    },
  ];

  logAudit(actor: string, action: string, resource: string, details: string) {
    const log: AuditLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      actor,
      action,
      resource,
      details,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 200) {
      this.auditLogs = this.auditLogs.slice(0, 200);
    }
    return log;
  }
}

export const memoryStore = new MemoryStore();
