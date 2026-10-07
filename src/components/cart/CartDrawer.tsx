import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectCartItems,
  selectCartSubtotal,
  selectCartShippingFee,
  selectCartTotal,
  selectUniqueCartLinesCount,
  updateQuantity,
  removeFromCart,
} from '../../store/slices/cartSlice';
import { closeCartDrawer, selectIsCartDrawerOpen } from '../../store/slices/uiSlice';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectIsCartDrawerOpen);
  const items = useAppSelector(selectCartItems);
  const uniqueLinesCount = useAppSelector(selectUniqueCartLinesCount);
  const subtotal = useAppSelector(selectCartSubtotal);
  const shippingFee = useAppSelector(selectCartShippingFee);
  const total = useAppSelector(selectCartTotal);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => dispatch(closeCartDrawer())}
        aria-hidden="true"
      />

      {/* Slide-over surface */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <h3 className="font-display font-bold text-lg text-slate-900">
              Shopping Cart ({uniqueLinesCount})
            </h3>
          </div>
          <button
            onClick={() => dispatch(closeCartDrawer())}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close cart drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="px-6 py-2.5 bg-blue-50/70 border-b border-blue-100 text-xs text-blue-900 flex items-center justify-between">
          {subtotal >= 49 ? (
            <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              You unlocked Free Standard Shipping!
            </span>
          ) : (
            <span>
              Add <strong className="font-bold">${(49 - subtotal).toFixed(2)}</strong> more for{' '}
              <strong>Free Shipping</strong>
            </span>
          )}
          <span className="font-semibold text-blue-600">${subtotal.toFixed(2)} / $49</span>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-slate-100">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="text-base font-semibold text-slate-800">Your cart is empty</h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1 mb-6">
                Explore our curated luxury products across fashion, watches, computing and more.
              </p>
              <button
                onClick={() => {
                  dispatch(closeCartDrawer());
                  navigate('/shop');
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Browse Products
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="py-4 flex gap-4">
                <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center p-1">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-slate-900 truncate">
                        {item.name}
                      </h4>
                      <button
                        onClick={() => dispatch(removeFromCart(item.id))}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {item.selectedAttributes && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {Object.entries(item.selectedAttributes)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' · ')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-bold text-slate-900 tabular-nums">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>

                    {/* Quantity Stepper */}
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                      <button
                        onClick={() =>
                          dispatch(
                            updateQuantity({ id: item.id, quantity: item.quantity - 1 })
                          )
                        }
                        className="p-1 px-2 text-slate-600 hover:bg-white hover:text-blue-600 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs font-semibold text-slate-800 tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          dispatch(
                            updateQuantity({ id: item.id, quantity: item.quantity + 1 })
                          )
                        }
                        className="p-1 px-2 text-slate-600 hover:bg-white hover:text-blue-600 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Calculations & CTA */}
        {items.length > 0 && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-3">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {shippingFee === 0 ? (
                    <span className="text-emerald-600 font-bold">FREE</span>
                  ) : (
                    `$${shippingFee.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Estimated Total</span>
                <span className="text-blue-600 tabular-nums">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  dispatch(closeCartDrawer());
                  navigate('/checkout');
                }}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  dispatch(closeCartDrawer());
                  navigate('/cart');
                }}
                className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors text-center"
              >
                View Full Cart & Apply Coupons
              </button>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Secure Checkout · 30-Day Guaranteed Returns</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
