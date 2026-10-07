import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  closeMobileMenu,
  openCustomerAuth,
  selectIsMobileMenuOpen,
} from '../../store/slices/uiSlice';
import { selectAllCategories } from '../../store/slices/productSlice';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { customerSignOut } from '../../store/thunks/authThunks';
import {
  X,
  ShoppingBag,
  Heart,
  User,
  Package,
  ArrowRight,
  LogOut,
  LogIn,
} from 'lucide-react';

export const MobileDrawer: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isOpen = useAppSelector(selectIsMobileMenuOpen);
  const categories = useAppSelector(selectAllCategories);
  const user = useAppSelector(selectCurrentUser);

  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Escape closes the drawer and focus returns to the trigger when it unmounts.
  useEffect(() => {
    if (!isOpen) return;

    closeButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch(closeMobileMenu());
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, dispatch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => dispatch(closeMobileMenu())}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <ShoppingBag className="w-5 h-5" />
            </span>
            <span className="font-display font-bold text-lg text-slate-900">Marketly</span>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => dispatch(closeMobileMenu())}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* User preview banner */}
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0"
              aria-hidden="true"
            >
              {user ? user.name.charAt(0).toUpperCase() : 'G'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {user ? user.name : 'Welcome, Guest'}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {user ? user.email : 'Sign in to access your orders'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Explore Catalog
            </h4>
            <div className="space-y-1">
              <Link
                to="/shop"
                onClick={() => dispatch(closeMobileMenu())}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600"
              >
                <span>All Products</span>
                <ArrowRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/shop?category=${encodeURIComponent(cat.name)}`}
                  onClick={() => dispatch(closeMobileMenu())}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="text-xs text-slate-400 shrink-0 ml-2">
                    {typeof cat.itemCount === 'number' ? `(${cat.itemCount.toLocaleString()})` : ''}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Customer Services
            </h4>
            <div className="space-y-1">
              <Link
                to="/tracking"
                onClick={() => dispatch(closeMobileMenu())}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
              >
                <Package className="w-4 h-4 text-blue-600" aria-hidden="true" />
                <span>Track Order</span>
              </Link>
              <Link
                to="/wishlist"
                onClick={() => dispatch(closeMobileMenu())}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
              >
                <Heart className="w-4 h-4 text-rose-500" aria-hidden="true" />
                <span>My Wishlist</span>
              </Link>
              <Link
                to="/account"
                onClick={() => dispatch(closeMobileMenu())}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
              >
                <User className="w-4 h-4 text-slate-500" aria-hidden="true" />
                <span>Account & Addresses</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100">
          {user ? (
            <button
              type="button"
              onClick={() => {
                dispatch(customerSignOut());
                dispatch(closeMobileMenu());
                navigate('/');
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                dispatch(closeMobileMenu());
                dispatch(openCustomerAuth());
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};