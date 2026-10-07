import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectAllAdminOrders,
  selectAdminOrdersLoaded,
  updateAdminOrderStatus,
} from '../../store/slices/orderSlice';
import { addNotification } from '../../store/slices/uiSlice';
import { api, ApiError } from '../../services/api';
import { OrderStatus } from '../../types';
import { ShoppingBag, Search, ExternalLink, Filter, Loader2 } from 'lucide-react';

export const AdminOrdersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const orders = useAppSelector(selectAllAdminOrders);
  const ordersLoaded = useAppSelector(selectAdminOrdersLoaded);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [savingId, setSavingId] = useState<string | null>(null);

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.phone.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || o.orderStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (id: string, newStatus: OrderStatus) => {
    if (savingId) return;
    setSavingId(id);
    try {
      await api.updateOrderStatus(id, newStatus);
      dispatch(updateAdminOrderStatus({ orderId: id, status: newStatus }));
      dispatch(
        addNotification({
          type: 'success',
          title: 'Order Updated',
          message: `Order moved to ${newStatus}.`,
          duration: 2500,
        })
      );
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
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
          Customer Orders & Fulfillment
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitor incoming purchases, courier handovers, and transition order lifecycle states.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, customer name, phone..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer w-full sm:w-auto"
          >
            <option value="all">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {!ordersLoaded ? (
          <div className="px-5 py-16 flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
            <p className="text-xs font-semibold">Loading the order book…</p>
          </div>
        ) : filtered.length === 0 ? (
            <div className="px-5 py-16 text-center space-y-2">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" aria-hidden="true" />
              <p className="text-sm font-semibold text-slate-700">
                {orders.length === 0
                  ? 'No orders have been placed yet.'
                  : 'No orders match your filters.'}
              </p>
              <p className="text-xs text-slate-500">
                {orders.length === 0
                  ? 'New storefront checkouts appear here automatically.'
                  : 'Try a different search term or lifecycle state.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <caption className="sr-only">Customer orders</caption>
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th scope="col" className="p-4">Order #</th>
                <th scope="col" className="p-4">Date</th>
                <th scope="col" className="p-4">Customer</th>
                <th scope="col" className="p-4">Destination</th>
                <th scope="col" className="p-4">Method</th>
                <th scope="col" className="p-4">Lifecycle State</th>
                <th scope="col" className="p-4 text-right">Total</th>
                <th scope="col" className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/50">
                  <td className="p-4 font-mono font-bold text-slate-900">
                    <Link to={`/admin/orders/${ord.id}`} className="hover:text-blue-600 underline">
                      {ord.orderNumber}
                    </Link>
                  </td>
                  <td className="p-4 text-slate-400">
                    {new Date(ord.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{ord.customer.name}</p>
                    <span className="text-[10px] text-slate-400">{ord.customer.phone}</span>
                  </td>
                  <td className="p-4 text-slate-700">
                    {ord.shippingAddress.upazila}, {ord.shippingAddress.district}
                  </td>
                  <td className="p-4 uppercase font-semibold text-blue-600">
                    {ord.paymentMethod}
                  </td>
                  <td className="p-4">
                    <label className="sr-only" htmlFor={`status-${ord.id}`}>
                      Lifecycle state for order {ord.orderNumber}
                    </label>
                    <select
                      id={`status-${ord.id}`}
                      value={ord.orderStatus}
                      disabled={savingId === ord.id}
                      onChange={(e) => handleStatusChange(ord.id, e.target.value as OrderStatus)}
                      className="px-2.5 py-1.5 bg-blue-50/80 border border-blue-200 text-blue-700 font-bold text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer disabled:opacity-60"
                    >
                      <option value="Confirmed">Confirmed</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </td>
                  <td className="p-4 text-right font-black text-slate-900 tabular-nums">
                    ${ord.total.toFixed(2)}
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      to={`/admin/orders/${ord.id}`}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      <span>Details</span>
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
};
