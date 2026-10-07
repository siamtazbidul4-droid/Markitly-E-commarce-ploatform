import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectCartItems,
  selectCartSubtotal,
  selectCartShippingFee,
  selectCartTotal,
  clearCart,
} from '../store/slices/cartSlice';
import { createOrder } from '../store/slices/orderSlice';
import { selectCurrentUser, selectSavedAddresses } from '../store/slices/authSlice';
import { addNotification } from '../store/slices/uiSlice';
import { BangladeshAddress, PaymentMethod } from '../types';
import { api, ApiError } from '../services/api';
import { BangladeshLocationFields } from '../components/common/BangladeshLocationFields';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);
  const shippingFee = useAppSelector(selectCartShippingFee);
  const total = useAppSelector(selectCartTotal);
  const couponCode = useAppSelector((state) => state.cart.couponCode);
  const discountAmount = useAppSelector((state) => state.cart.discountAmount);
  const currentUser = useAppSelector(selectCurrentUser);
  const savedAddresses = useAppSelector(selectSavedAddresses);

  // Address Form State
  //
  // Every location field starts empty: the previous implementation pre-selected
  // a hard-coded Dhaka/Gulshan/"Ward 19"/1212 combination that was never verified
  // against the real hierarchy, so a customer could submit an order to an address
  // that does not exist.
  const [address, setAddress] = useState<BangladeshAddress>(
    savedAddresses[0] || {
      fullName: currentUser?.name || '',
      phone: currentUser?.phone || '',
      email: currentUser?.email || '',
      division: '',
      district: '',
      upazila: '',
      union: '',
      streetAddress: '',
      postalCode: '',
    }
  );

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash');
  const [bkashNumber, setBkashNumber] = useState('');
  const [nagadNumber, setNagadNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address.fullName || !address.phone || !address.streetAddress) {
      dispatch(
        addNotification({
          type: 'warning',
          title: 'Missing Address',
          message: 'Please complete all required shipping address fields.',
          duration: 3500,
        })
      );
      return;
    }

    // The whole Division -> District -> Upazila chain must be chosen. The union is
    // the only optional level (some upazilas are served directly by a city
    // corporation rather than a union council).
    if (!address.division || !address.district || !address.upazila) {
      dispatch(
        addNotification({
          type: 'warning',
          title: 'Select Delivery Location',
          message: 'Choose a Division, District and Upazila for this delivery.',
          duration: 3500,
        })
      );
      return;
    }

    if (cartItems.length === 0) {
      navigate('/shop');
      return;
    }

    setIsProcessing(true);

    try {
      const orderPayload = {
        // `userId` is deliberately omitted: the server derives ownership from the
        // session token it already verified, so a hand-crafted payload cannot
        // attach this order to another account.
        customer: {
          name: address.fullName,
          email: address.email,
          phone: address.phone,
        },
        shippingAddress: address,
        items: cartItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          sku: item.sku,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          selectedAttributes: item.selectedAttributes,
        })),
        couponCode: couponCode || undefined,
        paymentMethod,
      };

      // The server is the single authority for pricing, stock and order numbers.
      // There is deliberately no client-side fallback order: fabricating one would
      // report success for an order that was never persisted, and it previously
      // masked real checkout failures such as a rejected payload.
      const createdOrder = await api.createOrder(orderPayload);

      dispatch(createOrder(createdOrder));
      dispatch(clearCart());
      setIsProcessing(false);

      dispatch(
        addNotification({
          type: 'success',
          title: 'Order Placed Successfully!',
          message: `Order #${createdOrder.orderNumber} is confirmed and preparing for dispatch.`,
          duration: 5000,
        })
      );

      navigate(`/order-success/${createdOrder.orderNumber}`);
    } catch (err) {
      const apiError = err as ApiError;
      setIsProcessing(false);
      dispatch(
        addNotification({
          type: 'error',
          title: 'Order Failed',
          message:
            apiError instanceof ApiError
              ? apiError.message
              : 'Your order could not be placed. Please try again.',
          duration: 4500,
        })
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Page Title */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
          Secure Checkout
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Complete your delivery details and choose your preferred payment method.
        </p>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Delivery Address & Payment Method (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* 1. Customer Information & Bangladesh Structured Address */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h2 className="font-display font-bold text-lg text-slate-900">
                Delivery Address (Bangladesh)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={address.fullName}
                  onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number (Active for SMS/Delivery) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+880 1XXX-XXXXXX"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address (For receipt & tracking updates) *
                </label>
                <input
                  type="email"
                  required
                  value={address.email}
                  onChange={(e) => setAddress({ ...address, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Bangladesh Structured Geographic Hierarchy */}
              <BangladeshLocationFields
                idPrefix="checkout"
                value={{
                  division: address.division,
                  district: address.district,
                  upazila: address.upazila,
                  union: address.union || '',
                }}
                onChange={(next) =>
                  setAddress((prev) => ({ ...prev, ...next }))
                }
              />

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Street Address & House Details *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="House number, Road number, Apartment/Floor details"
                  value={address.streetAddress}
                  onChange={(e) => setAddress({ ...address, streetAddress: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          {/* 2. Payment Architecture */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h2 className="font-display font-bold text-lg text-slate-900">
                Payment Method
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* bKash */}
              <div
                onClick={() => setPaymentMethod('bkash')}
                className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'bkash'
                    ? 'border-pink-600 bg-pink-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pink-600 text-white font-bold flex items-center justify-center text-xs">
                    bK
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">bKash Payment</h4>
                    <p className="text-[11px] text-slate-500">Fast mobile wallet transfer</p>
                  </div>
                </div>
                {paymentMethod === 'bkash' && (
                  <CheckCircle2 className="w-5 h-5 text-pink-600" />
                )}
              </div>

              {/* Nagad */}
              <div
                onClick={() => setPaymentMethod('nagad')}
                className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'nagad'
                    ? 'border-amber-600 bg-amber-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-600 text-white font-bold flex items-center justify-center text-xs">
                    NG
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Nagad Payment</h4>
                    <p className="text-[11px] text-slate-500">Post Office Digital Wallet</p>
                  </div>
                </div>
                {paymentMethod === 'nagad' && (
                  <CheckCircle2 className="w-5 h-5 text-amber-600" />
                )}
              </div>

              {/* Card */}
              <div
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'card'
                    ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Credit / Debit Card</h4>
                    <p className="text-[11px] text-slate-500">Visa, Mastercard, Amex</p>
                  </div>
                </div>
                {paymentMethod === 'card' && (
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                )}
              </div>

              {/* Cash on Delivery */}
              <div
                onClick={() => setPaymentMethod('cod')}
                className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Cash on Delivery</h4>
                    <p className="text-[11px] text-slate-500">Pay when order arrives</p>
                  </div>
                </div>
                {paymentMethod === 'cod' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                )}
              </div>
            </div>

            {/* Provider fields */}
            {paymentMethod === 'bkash' && (
              <div className="p-4 bg-pink-50/70 border border-pink-100 rounded-2xl space-y-2">
                <span className="text-xs font-semibold text-pink-900">
                  Enter your bKash Mobile Account Number:
                </span>
                <input
                  type="text"
                  placeholder="017XXXXXXXX"
                  value={bkashNumber}
                  onChange={(e) => setBkashNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-pink-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-600"
                />
                <p className="text-[11px] text-pink-700">
                  A secure bKash OTP verification prompt will be sent to your device.
                </p>
              </div>
            )}

            {paymentMethod === 'nagad' && (
              <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-2xl space-y-2">
                <span className="text-xs font-semibold text-amber-900">
                  Enter your Nagad Mobile Account Number:
                </span>
                <input
                  type="text"
                  placeholder="018XXXXXXXX"
                  value={nagadNumber}
                  onChange={(e) => setNagadNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Snapshot Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6 sticky top-24">
            <h3 className="font-display font-bold text-lg text-slate-900">
              Order Review ({cartItems.length} items)
            </h3>

            {/* Items Snapshot */}
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1">
              {cartItems.map((item) => (
                <div key={item.id} className="py-3 flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 object-contain rounded-xl bg-slate-50 border p-1"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 truncate">{item.name}</h5>
                    <p className="text-[11px] text-slate-500">
                      Qty: {item.quantity} · ${item.price.toFixed(2)} each
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-900 tabular-nums">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculation Totals */}
            <div className="space-y-2.5 text-sm text-slate-600 pt-3 border-t border-slate-100">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Delivery Fee</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {shippingFee === 0 ? (
                    <span className="text-emerald-600 font-bold">FREE</span>
                  ) : (
                    `$${shippingFee.toFixed(2)}`
                  )}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold text-xs">
                  <span>Coupon Discount ({couponCode})</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-black text-slate-900 pt-3 border-t border-slate-100">
                <span>Total Payable</span>
                <span className="text-blue-600 tabular-nums">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Place Order CTA */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>
                {isProcessing
                  ? 'Authorizing Order...'
                  : `Place Order · $${total.toFixed(2)}`}
              </span>
              {!isProcessing && <ArrowRight className="w-4 h-4" />}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Bank-level 256-bit SSL encrypted checkout</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
