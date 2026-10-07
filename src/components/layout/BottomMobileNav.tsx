import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectWishlistCount } from '../../store/slices/wishlistSlice';
import { openMobileMenu } from '../../store/slices/uiSlice';
import { Home, Grid, Tag, Heart, User } from 'lucide-react';

export const BottomMobileNav: React.FC = () => {
  const wishlistCount = useAppSelector(selectWishlistCount);
  const dispatch = useAppDispatch();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Home */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
              isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span className="text-[11px] font-medium mt-0.5">Home</span>
        </NavLink>

        {/* Categories */}
        <button
          onClick={() => dispatch(openMobileMenu())}
          className="flex flex-col items-center py-1 px-3 rounded-lg text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <Grid className="w-5 h-5" />
          <span className="text-[11px] font-medium mt-0.5">Categories</span>
        </button>

        {/* Deals */}
        <NavLink
          to="/shop?deals=true"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
              isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <Tag className="w-5 h-5" />
          <span className="text-[11px] font-medium mt-0.5">Deals</span>
        </NavLink>

        {/* Wishlist */}
        <NavLink
          to="/wishlist"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-3 rounded-lg transition-colors relative ${
              isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <div className="relative">
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-3.5 h-3.5 px-0.5 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium mt-0.5">Wishlist</span>
        </NavLink>

        {/* Account */}
        <NavLink
          to="/account"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
              isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <User className="w-5 h-5" />
          <span className="text-[11px] font-medium mt-0.5">Account</span>
        </NavLink>
      </div>
    </nav>
  );
};
