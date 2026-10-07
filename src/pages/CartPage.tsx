import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectCartItems,
  selectCartSubtotal,
  selectCartShippingFee,
  selectCartTotal,
  selectUniqueCartLinesCount,
  updateQuantity,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
} from '../store/slices/cartSlice';
import { addNotification } from '../store/slices/uiSlice';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Tag,
  ShieldCheck,
  Truck,
  ArrowLeft,
} from 'lucide-react';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const uniqueLinesCount = useAppSelector(selectUniqueCartLinesCount);
  const subtotal = useAppSelector(selectCartSubtotal);
  const shippingFee = useAppSelector(selectCartShippingFee);
  const total = useAppSelector(selectCartTotal);
  const couponCode = useAppSelector((state) => state.cart.couponCode);
  const discountAmount = useAppSelector((state) => state.cart.discountAmount);

  const [inputCoupon, setInputCoupon] = useState('');

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = inputCoupon.trim().toUpperCase();
    if (code === 'SUMMER60' || code === 'MARKETLY20') {
      const discount = subtotal * 0.2; // 20% off
      dispatch(applyCoupon({ code, discount }));
      dispatch(
        addNotification({
          type: 'success',
          title: 'Coupon Applied!',
          message: `Saved $${discount.toFixed(2)} with code ${code}.`,
          duration: 3000,
        })
      );
      setInputCoupon('');
    } else if (code === 'SAVE10') {
      const discount = 10;
      dispatch(applyCoupon({ code, discount }));
      dispatch(
        addNotification({
          type: 'success',
          title: 'Coupon Applied!',
          message: `Saved $10.00 with code ${code}.`,
          duration: 3000,
        })
      );
      setInputCoupon('');
    } else {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Invalid Coupon',
          message: 'Try code "MARKETLY20" or "SAVE10".',
          duration: 3000,
        })
      );
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="font-display font-bold text-2xl text-slate-900">Your Cart is Empty</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-2 mb-8">
          Looks like you haven't added any products to your shopping bag yet.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Explore Catalog</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            You have <strong className="text-slate-900">{uniqueLinesCount}</strong> unique line item
            {uniqueLinesCount > 1 ? 's' : ''} in your cart.
          </p>
        </div>
        <button
          onClick={() => dispatch(clearCart())}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline transition-colors cursor-pointer"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items Table / List (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs divide-y divide-slate-100">
          {items.map((item) => (
            <div key={item.id} className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Image & Title */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 p-2 shrink-0 flex items-center justify-center">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain mix-blend-multiply"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base text-slate-900 truncate">
                    {item.name}
                  </h3>
                  {item.selectedAttributes && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {Object.entries(item.selectedAttributes)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' · ')}
                    </p>
                  )}
                  <span className="text-xs font-mono text-slate-400 mt-1 block">
                    SKU: {item.sku}
                  </span>
                </div>
              </div>

              {/* Steppers & Total */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0">
                {/* Stepper */}
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  <button
                    onClick={() =>
                      dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))
                    }
                    className="p-1.5 px-3 text-slate-600 hover:bg-white transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-bold text-slate-900 tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))
                    }
                    className="p-1.5 px-3 text-slate-600 hover:bg-white transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Line Total */}
                <div className="text-right min-w-[80px]">
                  <span className="font-display font-bold text-sm sm:text-base text-slate-900 tabular-nums">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                  <p className="text-[11px] text-slate-400 tabular-nums">
                    ${item.price.toFixed(2)} each
                  </p>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => dispatch(removeFromCart(item.id))}
                  className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Coupon (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <h3 className="font-display font-bold text-lg text-slate-900">Order Summary</h3>

            {/* Calculations */}
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Shipping Fee</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {shippingFee === 0 ? (
                    <span className="text-emerald-600 font-bold">FREE</span>
                  ) : (
                    `$${shippingFee.toFixed(2)}`
                  )}
                </span>
              </div>

              {couponCode && (
                <div className="flex justify-between items-center text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Coupon: {couponCode}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>-${discountAmount.toFixed(2)}</span>
                    <button
                      onClick={() => dispatch(removeCoupon())}
                      className="text-emerald-900 hover:text-rose-600"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between text-lg font-black text-slate-900 pt-3 border-t border-slate-100">
                <span>Total Amount</span>
                <span className="text-blue-600 tabular-nums">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Coupon Application Form */}
            {!couponCode && (
              <form onSubmit={handleApplyCoupon} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={inputCoupon}
                  onChange={(e) => setInputCoupon(e.target.value)}
                  placeholder="Coupon code (e.g. MARKETLY20)"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </form>
            )}

            {/* Checkout CTA */}
            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Trust badge */}
            <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safe & Secure Bank-Grade Encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
