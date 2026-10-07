import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { selectOrderByNumber } from '../store/slices/orderSlice';
import { CheckCircle2, Package, MapPin, Truck, ArrowRight, Home } from 'lucide-react';

export const OrderSuccessPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const order = useAppSelector(selectOrderByNumber(orderNumber || ''));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Success Badge & Headline */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center shadow-xs space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
          Thank You! Your Order is Confirmed
        </h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          We have received your order{' '}
          <strong className="text-slate-900 font-mono">#{orderNumber}</strong>. A confirmation
          receipt and SMS update have been dispatched.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <Link
            to={`/tracking?order=${orderNumber}`}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
          >
            <Package className="w-4 h-4" />
            <span>Track Order Progress</span>
          </Link>
          <Link
            to="/shop"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Home className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>

      {/* Snapshot Summary if loaded */}
      {order && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <h3 className="font-display font-bold text-lg text-slate-900">Order Receipt Summary</h3>

          {/* Delivery Address */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs text-slate-600">
            <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600" />
              Delivery Destination:
            </span>
            <p className="font-medium text-slate-800">{order.shippingAddress.fullName} · {order.shippingAddress.phone}</p>
            <p>{order.shippingAddress.streetAddress}, {order.shippingAddress.upazila}, {order.shippingAddress.district}, {order.shippingAddress.division}</p>
            <p className="font-semibold text-blue-600 uppercase pt-1">
              Payment: {order.paymentMethod.toUpperCase()} ({order.paymentStatus})
            </p>
          </div>

          {/* Items */}
          <div className="divide-y divide-slate-100">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 object-contain rounded-xl bg-slate-50 border p-1"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="font-semibold text-slate-900">{item.name}</span>
                    <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                  </div>
                </div>
                <span className="font-bold text-slate-900 tabular-nums">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Total Amount */}
          <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-base font-bold text-slate-900">
            <span>Total Paid</span>
            <span className="text-blue-600 tabular-nums">${order.total.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
