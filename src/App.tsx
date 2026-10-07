import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Loader2 } from 'lucide-react';
import { store } from './store';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { WishlistPage } from './pages/WishlistPage';
import { AccountPage } from './pages/AccountPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { NotificationToastContainer } from './components/common/NotificationToast';
import { ConfirmProvider } from './components/common/ConfirmDialog';
import { CatalogBootstrap } from './components/common/CatalogBootstrap';
import { CustomerSessionBootstrap } from './components/common/CustomerSessionBootstrap';
import { CustomerAuthDialog } from './components/common/CustomerAuthDialog';
import { AdminLoginDialog } from './components/admin/AdminLoginDialog';
import { RequireAdmin } from './components/admin/RequireAdmin';

// The admin console is a large, rarely-visited surface: it is split into its own
// chunk so storefront visitors do not download the whole control center.
const AdminLayout = lazy(() =>
  import('./pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout }))
);
const AdminDashboardPage = lazy(() =>
  import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);
const AdminProductsPage = lazy(() =>
  import('./pages/admin/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage }))
);
const AdminProductCreatePage = lazy(() =>
  import('./pages/admin/AdminProductCreatePage').then((m) => ({ default: m.AdminProductCreatePage }))
);
const AdminProductEditPage = lazy(() =>
  import('./pages/admin/AdminProductEditPage').then((m) => ({ default: m.AdminProductEditPage }))
);
const AdminCategoriesPage = lazy(() =>
  import('./pages/admin/AdminCategoriesPage').then((m) => ({ default: m.AdminCategoriesPage }))
);
const AdminBrandsPage = lazy(() =>
  import('./pages/admin/AdminBrandsPage').then((m) => ({ default: m.AdminBrandsPage }))
);
const AdminCollectionsPage = lazy(() =>
  import('./pages/admin/AdminCollectionsPage').then((m) => ({ default: m.AdminCollectionsPage }))
);
const AdminInventoryPage = lazy(() =>
  import('./pages/admin/AdminInventoryPage').then((m) => ({ default: m.AdminInventoryPage }))
);
const AdminOrdersPage = lazy(() =>
  import('./pages/admin/AdminOrdersPage').then((m) => ({ default: m.AdminOrdersPage }))
);
const AdminOrderDetailPage = lazy(() =>
  import('./pages/admin/AdminOrderDetailPage').then((m) => ({ default: m.AdminOrderDetailPage }))
);
const AdminCouponsPage = lazy(() =>
  import('./pages/admin/AdminCouponsPage').then((m) => ({ default: m.AdminCouponsPage }))
);
const AdminBannersPage = lazy(() =>
  import('./pages/admin/AdminBannersPage').then((m) => ({ default: m.AdminBannersPage }))
);
const AdminCMSPage = lazy(() =>
  import('./pages/admin/AdminCMSPage').then((m) => ({ default: m.AdminCMSPage }))
);
const AdminMediaPage = lazy(() =>
  import('./pages/admin/AdminMediaPage').then((m) => ({ default: m.AdminMediaPage }))
);
const AdminCustomersPage = lazy(() =>
  import('./pages/admin/AdminCustomersPage').then((m) => ({ default: m.AdminCustomersPage }))
);
const AdminReviewsPage = lazy(() =>
  import('./pages/admin/AdminReviewsPage').then((m) => ({ default: m.AdminReviewsPage }))
);
const AdminSettingsPage = lazy(() =>
  import('./pages/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage }))
);
const AdminAuditLogsPage = lazy(() =>
  import('./pages/admin/AdminAuditLogsPage').then((m) => ({ default: m.AdminAuditLogsPage }))
);
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));

const RouteFallback: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
    <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
    <p className="text-xs font-semibold">Loading…</p>
  </div>
);

/** Simple admin screens share one Suspense boundary declaration. */
const ADMIN_ROUTES: { path: string; Component: React.ComponentType }[] = [
  { path: 'categories', Component: AdminCategoriesPage },
  { path: 'brands', Component: AdminBrandsPage },
  { path: 'collections', Component: AdminCollectionsPage },
  { path: 'inventory', Component: AdminInventoryPage },
  { path: 'orders', Component: AdminOrdersPage },
  { path: 'coupons', Component: AdminCouponsPage },
  { path: 'banners', Component: AdminBannersPage },
  { path: 'cms', Component: AdminCMSPage },
  { path: 'media', Component: AdminMediaPage },
  { path: 'customers', Component: AdminCustomersPage },
  { path: 'reviews', Component: AdminReviewsPage },
  { path: 'settings', Component: AdminSettingsPage },
  { path: 'audit-logs', Component: AdminAuditLogsPage },
];

export function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        {/* Application-wide UI surfaces: toasts, confirmations, sign-in. */}
        <ConfirmProvider>
          <CatalogBootstrap />
          <CustomerSessionBootstrap />
          <Routes>
            {/* Public Storefront Layout */}
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="product/:slug" element={<ProductDetailPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="order-success/:orderNumber" element={<OrderSuccessPage />} />
              <Route path="tracking" element={<OrderTrackingPage />} />
              <Route path="wishlist" element={<WishlistPage />} />
              <Route path="account" element={<AccountPage />} />
              <Route path="404" element={<NotFoundPage />} />
            </Route>

            {/* Admin module: every route below requires a server-verified session. */}
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <Suspense fallback={<RouteFallback />}>
                    <AdminLayout />
                  </Suspense>
                </RequireAdmin>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route
                path="dashboard"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <AdminDashboardPage />
                  </Suspense>
                }
              />
              {/* Legacy single-screen overview retained for older bookmarks. */}
              <Route
                path="overview"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <AdminPage />
                  </Suspense>
                }
              />
              <Route
                path="products"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <AdminProductsPage />
                  </Suspense>
                }
              />
              <Route
                path="products/new"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <AdminProductCreatePage />
                  </Suspense>
                }
              />
              {/* Legacy alias kept so historical links never dead-end. */}
              <Route path="products/create" element={<Navigate to="/admin/products" replace />} />
              <Route
                path="products/:id/edit"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <AdminProductEditPage />
                  </Suspense>
                }
              />
              {ADMIN_ROUTES.map(({ path, Component }) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <Suspense fallback={<RouteFallback />}>
                      <Component />
                    </Suspense>
                  }
                />
              ))}
              <Route
                path="orders/:id"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <AdminOrderDetailPage />
                  </Suspense>
                }
              />
            </Route>

            {/* Catch-all 404 */}
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>

          <NotificationToastContainer />
          <CustomerAuthDialog />
          <AdminLoginDialog />
        </ConfirmProvider>
      </BrowserRouter>
    </Provider>
  );
}

export default App;