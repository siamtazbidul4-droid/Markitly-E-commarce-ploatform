import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck, Truck, RefreshCw, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-16 pb-20 md:pb-8">
      {/* Brand Trust Bar */}
      <div className="border-b border-slate-100 bg-slate-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Free Shipping</h4>
                <p className="text-xs text-slate-500 mt-0.5">On orders over $49 across Bangladesh</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Easy Returns</h4>
                <p className="text-xs text-slate-500 mt-0.5">30-day hassle-free return policy</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Secure Payment</h4>
                <p className="text-xs text-slate-500 mt-0.5">100% protected with bKash, Nagad & Cards</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-display font-extrabold text-xl text-slate-900 tracking-tight">
                  Marketly
                </span>
                <span className="text-[10px] font-medium text-slate-500">
                  Shop Smart, Live Better
                </span>
              </div>
            </Link>
            <p className="text-sm text-slate-600 max-w-sm leading-relaxed">
              Curated luxury consumer products spanning high-end fashion, precision watches, modern computing, and technology accessories. Official single-vendor store.
            </p>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Gulshan-2, Dhaka 1212, Bangladesh</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                <span>+880 9612-MARKET (+880 9612-627538)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <span>concierge@marketly.com</span>
              </div>
            </div>
          </div>

          {/* Quick Shop */}
          <div>
            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Categories
            </h5>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/shop?category=Fashion" className="hover:text-blue-600 transition-colors">
                  Fashion & Apparel
                </Link>
              </li>
              <li>
                <Link to="/shop?category=Watches" className="hover:text-blue-600 transition-colors">
                  Watches & Timepieces
                </Link>
              </li>
              <li>
                <Link to="/shop?category=Computing" className="hover:text-blue-600 transition-colors">
                  Laptops & Desktops
                </Link>
              </li>
              <li>
                <Link to="/shop?category=Electronics" className="hover:text-blue-600 transition-colors">
                  Audio & Electronics
                </Link>
              </li>
              <li>
                <Link to="/shop?category=Home+Decor" className="hover:text-blue-600 transition-colors">
                  Home & Living
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Customer Care
            </h5>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/tracking" className="hover:text-blue-600 transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link to="/account" className="hover:text-blue-600 transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-blue-600 transition-colors">
                  Saved Wishlist
                </Link>
              </li>
              <li>
                <Link to="/shop?deals=true" className="hover:text-blue-600 transition-colors">
                  Flash Deals
                </Link>
              </li>
              <li>
                <span className="text-slate-400">Bangladesh Delivery Policy</span>
              </li>
            </ul>
          </div>

          {/* Business & Admin */}
          <div>
            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Merchant Portal
            </h5>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/admin" className="font-semibold text-blue-600 hover:text-blue-700">
                  Admin Dashboard
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-blue-600 transition-colors">
                  Catalog & Products
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-blue-600 transition-colors">
                  Order Management
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-blue-600 transition-colors">
                  CMS Banners
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-blue-600 transition-colors">
                  Audit Logs
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & payment icons */}
        <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Marketly Inc. All rights reserved. Single-Vendor Luxury E-Commerce Platform.</p>
          <div className="flex items-center gap-3 font-medium text-slate-600">
            <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-bold text-pink-600">bKash</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-bold text-amber-600">Nagad</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-bold text-blue-600">VISA</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-bold text-rose-600">Mastercard</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-bold text-emerald-600">Cash on Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
