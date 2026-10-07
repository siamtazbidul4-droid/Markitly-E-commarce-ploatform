import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { selectAllOrders } from '../store/slices/orderSlice';
import { OrderStatus } from '../types';
import {
  Package,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Check,
  AlertCircle,
} from 'lucide-react';

const lifecycleSteps: OrderStatus[] = [
  'Confirmed',
  'Processing',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

export const OrderTrackingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const allOrders = useAppSelector(selectAllOrders);

  const initialQuery = searchParams.get('order') || allOrders[0]?.orderNumber || '';
  const [query, setQuery] = useState(initialQuery);
  const [searchedOrder, setSearchedOrder] = useState<any>(null);

  useEffect(() => {
    if (query) {
      const match = allOrders.find(
        (o) =>
          o.orderNumber.toLowerCase() === query.trim().toLowerCase() ||
          o.id.toLowerCase() === query.trim().toLowerCase()
      );
      setSearchedOrder(match || null);
    }
  }, [query, allOrders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const match = allOrders.find(
      (o) =>
        o.orderNumber.toLowerCase() === query.trim().toLowerCase() ||
        o.id.toLowerCase() === query.trim().toLowerCase()
    );
    setSearchedOrder(match || null);
  };

  const getStepIndex = (status: OrderStatus) => lifecycleSteps.indexOf(status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Title & Search Bar */}
      <div className="text-center space-y-3">
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
          Track Your Delivery
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Enter your Marketly order number (e.g. MKT-2026-1042) to check real-time courier status.
        </p>

        <form onSubmit={handleSearch} className="max-w-md mx-auto flex gap-2 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. MKT-2026-1042"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            Track
          </button>
        </form>
      </div>

      {/* Tracking Result */}
      {searchedOrder ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-8">
          {/* Top Status Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Order Status
              </span>
              <h2 className="font-display font-extrabold text-xl text-slate-900 mt-0.5">
                {searchedOrder.orderStatus}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Order ID: {searchedOrder.orderNumber}
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-500">
              <p>Ordered on {new Date(searchedOrder.createdAt).toLocaleDateString()}</p>
              <p className="font-semibold text-slate-700">
                Payment: {searchedOrder.paymentMethod.toUpperCase()} ({searchedOrder.paymentStatus})
              </p>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="relative py-4">
            <div className="grid grid-cols-5 gap-2 relative">
              {lifecycleSteps.map((step, idx) => {
                const currentIdx = getStepIndex(searchedOrder.orderStatus);
                const isCompleted = currentIdx >= idx;
                const isCurrent = currentIdx === idx;

                return (
                  <div key={step} className="flex flex-col items-center text-center relative z-10">
                    <div
                      className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all shadow-xs ${
                        isCurrent
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100 scale-110'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : idx + 1}
                    </div>
                    <span
                      className={`text-[11px] sm:text-xs font-semibold mt-2 ${
                        isCurrent
                          ? 'text-blue-600'
                          : isCompleted
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Log / Status History */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="font-display font-bold text-sm text-slate-900">
              Milestone Activity
            </h3>
            <div className="space-y-3">
              {searchedOrder.statusHistory?.map((h: any, i: number) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{h.status}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(h.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {h.note && <p className="text-slate-600 mt-0.5">{h.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Destination */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3 text-xs text-slate-600">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block mb-0.5">Shipping Address</span>
              <p>{searchedOrder.shippingAddress.fullName} · {searchedOrder.shippingAddress.phone}</p>
              <p>
                {searchedOrder.shippingAddress.streetAddress},{' '}
                {searchedOrder.shippingAddress.upazila},{' '}
                {searchedOrder.shippingAddress.district},{' '}
                {searchedOrder.shippingAddress.division}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center text-slate-500">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">No order found with this tracking ID</p>
          <p className="text-xs text-slate-400 mt-1">
            Check the order number in your confirmation email or order history.
          </p>
        </div>
      )}
    </div>
  );
};
