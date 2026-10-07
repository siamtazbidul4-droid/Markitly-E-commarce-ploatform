import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectUniqueCartLinesCount } from '../../store/slices/cartSlice';
import { selectWishlistCount } from '../../store/slices/wishlistSlice';
import { openMobileMenu, openCartDrawer, setSearchQuery } from '../../store/slices/uiSlice';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { SearchAutocomplete } from '../common/SearchAutocomplete';
import {
  Menu,
  ShoppingBag,
  Heart,
  User as UserIcon,
} from 'lucide-react';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const uniqueCartLines = useAppSelector(selectUniqueCartLinesCount);
  const wishlistCount = useAppSelector(selectWishlistCount);
  const currentUser = useAppSelector(selectCurrentUser);

  const [localSearch, setLocalSearch] = useState('');

  const runSearch = (term: string) => {
    dispatch(setSearchQuery(term));
    navigate(`/shop?search=${encodeURIComponent(term)}`);
  };

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-40 transition-shadow">
      {/* Top Navbar Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Left: Mobile Menu + Logo */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => dispatch(openMobileMenu())}
              className="p-2 -ml-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Brand Logo & Tagline (derived from reference image) */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">
                  Marketly
                </span>
                <span className="text-[10px] sm:text-xs font-medium text-slate-500 tracking-wide">
                  Shop Smart, Live Better
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <SearchAutocomplete
              value={localSearch}
              onChange={setLocalSearch}
              onSubmit={runSearch}
              shape="pill"
              label="Search products"
            />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link to="/shop" className="hover:text-blue-600 transition-colors">
              All Products
            </Link>
            <Link to="/shop?category=Fashion" className="hover:text-blue-600 transition-colors">
              Fashion
            </Link>
            <Link to="/shop?category=Watches" className="hover:text-blue-600 transition-colors">
              Watches
            </Link>
            <Link to="/shop?category=Computing" className="hover:text-blue-600 transition-colors">
              Computing
            </Link>
            <Link to="/tracking" className="hover:text-blue-600 transition-colors">
              Track Order
            </Link>
          </nav>

          {/* Right Action Icons (User, Wishlist, Cart) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Account Icon */}
            <Link
              to="/account"
              className="p-2 text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-colors relative"
              aria-label="My Account"
            >
              <UserIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              {currentUser && (
                <span className="absolute bottom-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />
              )}
            </Link>

            {/* Wishlist Icon with Badge */}
            <Link
              to="/wishlist"
              className="p-2 text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-colors relative"
              aria-label={`Wishlist with ${wishlistCount} items`}
            >
              <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Icon with Unique Cart Lines Badge */}
            {/* CRITICAL: navbar badge represents UNIQUE CART LINES, NOT total quantity! */}
            <button
              id="navbar-cart-button"
              onClick={() => dispatch(openCartDrawer())}
              className="p-2 text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all duration-200 relative group cursor-pointer"
              aria-label={`Cart with ${uniqueCartLines} unique items`}
            >
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-105 transition-transform" />
              {uniqueCartLines > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {uniqueCartLines}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar (Directly below Header row, matching reference image) */}
        <div className="pb-3 md:hidden">
          <SearchAutocomplete
            value={localSearch}
            onChange={setLocalSearch}
            onSubmit={runSearch}
            shape="rounded"
            label="Search products"
          />
        </div>
      </div>
    </header>
  );
};
