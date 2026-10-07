import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectAdminUser } from '../../store/slices/authSlice';
import { hydrateAdminOrders } from '../../store/slices/orderSlice';
import { adminSignOutThunk } from '../../store/thunks/authThunks';
import { addNotification } from '../../store/slices/uiSlice';
import { useConfirm } from '../../components/common/ConfirmDialog';
import { api, ApiError } from '../../services/api';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Image as ImageIcon,
  ScrollText,
  Sliders,
  Tag,
  Users,
  Star,
  Settings,
  Archive,
  FolderTree,
  ShoppingBag as StorefrontIcon,
  LogOut,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    title: 'Core',
    items: [{ label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Products', path: '/admin/products', icon: Package },
      { label: 'Categories', path: '/admin/categories', icon: Layers },
      { label: 'Brands', path: '/admin/brands', icon: Tag },
      { label: 'Collections', path: '/admin/collections', icon: FolderTree },
      { label: 'Inventory', path: '/admin/inventory', icon: Archive },
    ],
  },
  {
    title: 'Sales & Fulfillment',
    items: [
      { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
      { label: 'Coupons', path: '/admin/coupons', icon: Tag },
    ],
  },
  {
    title: 'Content & CMS',
    items: [
      { label: 'Banners', path: '/admin/banners', icon: Sliders },
      { label: 'Homepage CMS', path: '/admin/cms', icon: Sliders },
      { label: 'Media Library', path: '/admin/media', icon: ImageIcon },
    ],
  },
  {
    title: 'Customers & Social',
    items: [
      { label: 'Customers', path: '/admin/customers', icon: Users },
      { label: 'Reviews', path: '/admin/reviews', icon: Star },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Store Settings', path: '/admin/settings', icon: Settings },
      { label: 'Audit Logs', path: '/admin/audit-logs', icon: ScrollText },
    ],
  },
];

export const AdminLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const confirmAction = useConfirm();
  const adminUser = useAppSelector(selectAdminUser);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dbInfo, setDbInfo] = useState<{ mode: string; status: string }>({
    mode: 'connecting',
    status: 'healthy',
  });

  useEffect(() => {
    api.getHealth().then((h) => {
      if (h && h.database) {
        setDbInfo({
          mode: h.database.mode === 'mongodb_atlas' ? 'MongoDB Atlas Live' : 'In-Memory Fallback',
          status: h.status,
        });
      }
    });
  }, []);

  // The admin console is staff-only, so the full order book is loaded here
  // rather than in the anonymous catalog bootstrap. It is stored in its own
  // slice field so a customer's own order history cannot overwrite it.
  useEffect(() => {
    let cancelled = false;

    api
      .getAllOrders()
      .then((orders) => {
        if (!cancelled) dispatch(hydrateAdminOrders(orders));
      })
      .catch((err) => {
        if (cancelled) return;
        dispatch(
          addNotification({
            type: 'error',
            title: 'Orders Unavailable',
            message:
              err instanceof ApiError ? err.message : 'The order list could not be loaded.',
            duration: 4500,
          })
        );
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  // Close the mobile sidebar when the viewport grows into the desktop layout.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handle = (e: MediaQueryListEvent) => {
      if (e.matches) setSidebarOpen(false);
    };
    mq.addEventListener('change', handle);
    return () => mq.removeEventListener('change', handle);
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  const handleSignOut = async () => {
    const confirmed = await confirmAction({
      title: 'End administrator session',
      message:
        'You will be returned to the storefront and this device will need to sign in again.',
      confirmText: 'Sign out',
      variant: 'warning',
    });
    if (!confirmed) return;
    dispatch(adminSignOutThunk());
    dispatch(
      addNotification({
        type: 'info',
        title: 'Signed Out',
        message: 'Your administrator session has ended.',
        duration: 3000,
      })
    );
    navigate('/');
  };

  const displayName = adminUser?.name || 'Administrator';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            aria-label={sidebarOpen ? 'Close admin sidebar' : 'Open admin sidebar'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/admin/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/30 shrink-0">
              M
            </div>
            <div className="flex flex-col leading-none min-w-0">
              <span className="font-display font-extrabold text-sm sm:text-base tracking-tight text-white truncate">
                Marketly Control Center
              </span>
              <span className="hidden sm:block text-[10px] text-blue-400 font-medium">
                Single-Vendor Enterprise
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
            <span>{dbInfo.mode}</span>
          </div>

          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            <StorefrontIcon className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Storefront</span>
            <ExternalLink className="w-3 h-3 text-slate-400" aria-hidden="true" />
          </Link>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {initial}
            </div>
            <div className="hidden md:block text-left text-xs leading-tight max-w-[140px]">
              <p className="font-bold text-white truncate">{displayName}</p>
              <p className="text-[10px] text-slate-400 capitalize truncate">
                {(adminUser?.role || 'super_admin').replace('_', ' ')}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
              title="Sign Out"
              aria-label="Sign out of the admin console"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Body: Sidebar + Content */}
      <div className="flex-1 flex">
        {/* Mobile sidebar scrim */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 top-14 z-30 bg-slate-950/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar Navigation
            Desktop: a compact, bounded column (w-56) - never a full-height panel
            that squeezes the main content. Its long nav list scrolls internally
            with a subtle scrollbar; the storefront link stays pinned at the
            bottom. Mobile: an off-canvas drawer, unchanged. */}
        <aside
          className={`fixed z-40 top-14 bottom-0 left-0 w-[16rem] max-w-[85vw] bg-white border-r border-slate-200/80 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:top-auto lg:bottom-auto lg:w-56 lg:max-w-none lg:static lg:z-auto lg:inset-auto lg:shrink-0 flex flex-col ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav
            aria-label="Admin sections"
            className="overflow-y-auto p-3 sm:p-4 space-y-5 grow admin-sidebar-scroll"
          >
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">
                  {group.title}
                </span>
                <div className="mt-1 space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`
                        }
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span className="truncate">{item.label}</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" aria-hidden="true" />
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/60 shrink-0">
            <Link
              to="/"
              className="w-full py-2.5 px-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <StorefrontIcon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Back to Storefront</span>
            </Link>
          </div>
        </aside>

        {/* Content Outlet */}
        <main className="grow min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};