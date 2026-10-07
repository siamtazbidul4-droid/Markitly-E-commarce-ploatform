import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectAdminOrderById,
  updateAdminOrderStatus,
  upsertAdminOrder,
} from '../../store/slices/orderSlice';
import { addNotification } from '../../store/slices/uiSlice';
import { api, ApiError } from '../../services/api';
import { Order, OrderStatus } from '../../types';
import {
  ArrowLeft,
  MapPin,
  Clock,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Package,
} from 'lucide-react';

export const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const cachedOrder = useAppSelector(selectAdminOrderById(id ?? ''));

  const [fetchedOrder, setFetchedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  /**
   * A direct link (or a click that outruns `AdminLayout`'s order-book fetch) has
   * nothing in the store, and the page used to report "Order Not Found" for an
   * order the API could serve perfectly well. The stored copy is preferred; the
   * API is the fallback.
   */
  useEffect(() => {
    if (!id || cachedOrder) return;

    let active = true;
    setLoading(true);
    setLoadFailed(false);

    api
      .getOrderById(id)
      .then((order) => {
        if (!active) return;
        if (order) {
          setFetchedOrder(order);
          dispatch(upsertAdminOrder(order));
        } else {
          setLoadFailed(true);
        }
      })
      .catch(() => {
        if (active) setLoadFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, cachedOrder, dispatch]);

  const order = cachedOrder ?? fetchedOrder;

  if (!order) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border">
        {loading ? (
          <p className="text-sm text-slate-500">Loading order…</p>
        ) : (
          <>
            <h2 className="text-lg font-bold text-slate-900">
              {loadFailed ? 'Order Could Not Be Loaded' : 'Order Not Found'}
            </h2>
            {loadFailed && (
              <p className="text-xs text-slate-500 mt-1">
                The order could not be retrieved. It may have been removed, or your session may
                have expired.
              </p>
            )}
            <Link to="/admin/orders" className="text-xs text-blue-600 underline mt-2 inline-block">
              Return to Orders List
            </Link>
          </>
        )}
      </div>
    );
  }

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (saving) return;
    setSaving(true);
    try {
      await api.updateOrderStatus(order.id, newStatus, note || undefined);
      dispatch(updateAdminOrderStatus({ orderId: order.id, status: newStatus, note }));
      dispatch(
        addNotification({
          type: 'success',
          title: 'Status Updated',
          message: `Order transitioned to ${newStatus}.`,
          duration: 3000,
        })
      );
      setNote('');
    } catch (err) {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Update Failed',
          message:
            err instanceof ApiError ? err.message : 'The order status could not be updated.',
          duration: 4500,
        })
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/orders"
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-extrabold text-2xl text-slate-900">
                Order #{order.orderNumber}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                {order.orderStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleString()} · Payment: {order.paymentMethod.toUpperCase()} ({order.paymentStatus})
            </p>
          </div>
        </div>

        {/* Status transition control */}
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="order-status" className="text-xs font-semibold text-slate-500">
            Update State:
          </label>
          <select
            id="order-status"
            value={order.orderStatus}
            disabled={saving}
            onChange={(e) => handleStatusUpdate(e.target.value as OrderStatus)}
            className="px-3 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer disabled:opacity-60"
          >
            <option value="Confirmed">Confirmed</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Refunded">Refunded</option>
          </select>
          <label htmlFor="order-status-note" className="sr-only">
            Note recorded with this status change
          </label>
          <input
            id="order-status-note"
            type="text"
            value={note}
            maxLength={200}
            disabled={saving}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note (e.g. dispatched via courier)"
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-60 w-full sm:w-56"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Items snapshot (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              Purchased Items Snapshot ({order.items.length})
            </h2>

            <div className="divide-y divide-slate-100">
              {order.items.map((it, idx) => (
                <div key={idx} className="py-4 flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-4">
                    <img
                      src={it.image}
                      alt={it.name}
                      className="w-14 h-14 object-contain rounded-xl bg-slate-50 border p-1"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900">{it.name}</h4>
                      <p className="text-xs text-slate-400 font-mono">SKU: {it.sku}</p>
                      {it.selectedAttributes && (
                        <p className="text-xs text-slate-500">
                          {Object.entries(it.selectedAttributes).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 tabular-nums">
                      ${(it.price * it.quantity).toFixed(2)}
                    </span>
                    <p className="text-[11px] text-slate-400">
                      {it.quantity} × ${it.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900 tabular-nums">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {order.shippingFee === 0 ? 'FREE' : `$${order.shippingFee.toFixed(2)}`}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-${order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                <span>Grand Total</span>
                <span className="text-blue-600 tabular-nums">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Timeline Activity */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Order Milestone Timeline</span>
            </h2>

            <div className="space-y-3">
              {order.statusHistory?.map((h, i) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900">{h.status}</span>
                    <span className="text-slate-400 ml-2">
                      {new Date(h.timestamp).toLocaleString()}
                    </span>
                    {h.note && <p className="text-slate-600 mt-0.5">{h.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Customer & Delivery Address (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Delivery Details (Bangladesh)</span>
            </h2>

            <div className="space-y-1 text-xs text-slate-600">
              <p className="font-bold text-slate-900 text-sm">{order.shippingAddress.fullName}</p>
              <p className="font-medium text-slate-800">Phone: {order.shippingAddress.phone}</p>
              <p className="text-slate-500">Email: {order.shippingAddress.email}</p>
              <div className="pt-2 border-t border-slate-100 mt-2 space-y-0.5">
                <p><strong>Division:</strong> {order.shippingAddress.division}</p>
                <p><strong>District:</strong> {order.shippingAddress.district}</p>
                <p><strong>Upazila / Thana:</strong> {order.shippingAddress.upazila}</p>
                {order.shippingAddress.union && <p><strong>Union/Ward:</strong> {order.shippingAddress.union}</p>}
                <p className="pt-1"><strong>Street Address:</strong> {order.shippingAddress.streetAddress}</p>
                <p><strong>Postal Code:</strong> {order.shippingAddress.postalCode || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3 text-xs">
            <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              Payment Authorization
            </h2>
            <p><strong>Method:</strong> {order.paymentMethod.toUpperCase()}</p>
            <p><strong>Status:</strong> {order.paymentStatus}</p>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Commercial checkout terms verified server-side.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
