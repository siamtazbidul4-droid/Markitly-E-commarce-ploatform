import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectCurrentUser,
  selectSavedAddresses,
  selectIsAdmin,
  selectAdminUser,
  addAddress,
} from '../store/slices/authSlice';
import { customerSignOut } from '../store/thunks/authThunks';
import { hydrateOrders, selectAllOrders } from '../store/slices/orderSlice';
import { selectWishlistCount } from '../store/slices/wishlistSlice';
import { addNotification, openAdminLogin, openCustomerAuth } from '../store/slices/uiSlice';
import { Dialog } from '../components/common/Dialog';
import { BangladeshLocationFields } from '../components/common/BangladeshLocationFields';
import { api, ApiError } from '../services/api';
import { BangladeshAddress } from '../types';
import {
  User,
  Package,
  MapPin,
  ShieldCheck,
  Plus,
  ExternalLink,
  Loader2,
} from 'lucide-react';

export const AccountPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const isAdmin = useAppSelector(selectIsAdmin);
  const adminUser = useAppSelector(selectAdminUser);
  const addresses = useAppSelector(selectSavedAddresses);
  const orders = useAppSelector(selectAllOrders);
  const wishlistCount = useAppSelector(selectWishlistCount);

  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'security'>('orders');
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddr, setNewAddr] = useState<BangladeshAddress>({
    fullName: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    division: '',
    district: '',
    upazila: '',
    union: '',
    streetAddress: '',
    postalCode: '',
  });

  // Order history is customer-scoped server-side, so it is only requested once a
  // storefront session exists.
  useEffect(() => {
    if (!user) {
      dispatch(hydrateOrders([]));
      return;
    }

    let cancelled = false;
    setOrdersLoading(true);

    api
      .getOrders()
      .then((data) => {
        if (!cancelled) dispatch(hydrateOrders(Array.isArray(data) ? data : []));
      })
      .catch((err) => {
        if (cancelled) return;
        dispatch(
          addNotification({
            type: 'error',
            title: 'Order History Unavailable',
            message:
              err instanceof ApiError ? err.message : 'Your order history could not be loaded.',
            duration: 4500,
          })
        );
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch, user]);

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.streetAddress || !newAddr.fullName) return;
    // The whole chain must be selected; union remains optional.
    if (!newAddr.division || !newAddr.district || !newAddr.upazila) {
      dispatch(
        addNotification({
          type: 'warning',
          title: 'Select Delivery Location',
          message: 'Choose a Division, District and Upazila for this address.',
          duration: 3500,
        })
      );
      return;
    }
    dispatch(addAddress(newAddr));
    setShowAddressModal(false);
    dispatch(
      addNotification({
        type: 'success',
        title: 'Address Added',
        message: 'New Bangladesh shipping address saved to your account.',
        duration: 3000,
      })
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Profile Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-blue-100 text-blue-700 font-display font-extrabold text-2xl flex items-center justify-center border-2 border-blue-200 shadow-sm overflow-hidden">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span>{user ? user.name[0] : 'G'}</span>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="font-display font-extrabold text-2xl text-slate-900">
                {user ? user.name : 'Guest Customer'}
              </h1>
              {isAdmin && (
                <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
                  Super Admin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {isAdmin && adminUser ? adminUser.email : user?.email || 'Sign in to access order history'}
            </p>
            <p className="text-xs text-slate-400 font-medium">{user?.phone || 'Dhaka, Bangladesh'}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin ? (
            <Link
              to="/admin/dashboard"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Go to Admin Console</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => dispatch(openAdminLogin())}
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Sign In</span>
            </button>
          )}

          {isAdmin ? (
            <button
              type="button"
              onClick={() => dispatch(openCustomerAuth())}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
            >
              {user ? 'Switch Account' : 'Sign In as Customer'}
            </button>
          ) : user ? (
            <button
              type="button"
              onClick={() => dispatch(customerSignOut())}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
            >
              Sign Out
            </button>
          ) : (
            <button
              type="button"
              onClick={() => dispatch(openCustomerAuth())}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 sm:gap-8 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-sm font-bold tracking-tight transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Order History ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          className={`pb-3 text-sm font-bold tracking-tight transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'addresses'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Saved Addresses ({addresses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 text-sm font-bold tracking-tight transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'security'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Security & Authentication</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {ordersLoading ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 px-5 py-14 flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
              <p className="text-xs font-semibold">Loading your orders…</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" aria-hidden="true" />
              <h3 className="font-bold text-slate-900">No orders placed yet</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Explore our catalog to place your first luxury order.
              </p>
              <Link
                to="/shop"
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
              >
                Browse Shop
              </Link>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {ord.orderNumber}
                    </span>
                    <span className="text-slate-400 ml-2">
                      Placed on {new Date(ord.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded-lg text-xs">
                      {ord.orderStatus}
                    </span>
                    <Link
                      to={`/tracking?order=${ord.orderNumber}`}
                      className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                    >
                      <span>Track</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-slate-100">
                  {ord.items.map((it, i) => (
                    <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={it.image}
                          alt={it.name}
                          className="w-10 h-10 object-contain rounded-lg bg-slate-50 border p-1"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <span className="font-semibold text-slate-900">{it.name}</span>
                          <span className="text-slate-400 ml-2">Qty: {it.quantity}</span>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 tabular-nums">
                        ${(it.price * it.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <span>Payment: {ord.paymentMethod.toUpperCase()} ({ord.paymentStatus})</span>
                  <span className="text-sm font-black text-slate-900 tabular-nums">
                    Total: ${ord.total.toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'addresses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">Delivery Addresses in Bangladesh</h3>
            <button
              onClick={() => setShowAddressModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Address</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{addr.fullName}</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {addr.division}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{addr.streetAddress}</p>
                <p className="text-xs text-slate-500">
                  {addr.upazila}, {addr.district} - {addr.postalCode || 'Postal Code'}
                </p>
                <p className="text-xs font-medium text-slate-700 pt-1">Phone: {addr.phone}</p>
              </div>
            ))}
          </div>

          {/* New Address Dialog — reuses the application-wide Dialog component */}
          <Dialog
            isOpen={showAddressModal}
            onClose={() => setShowAddressModal(false)}
            title="Add Bangladesh Address"
            description="Delivery coverage across all 64 districts."
            maxWidth="lg"
            labelledBy="account-address-title"
          >
            <form onSubmit={handleSaveAddress} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="addr-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full name
                  </label>
                  <input
                    id="addr-name"
                    type="text"
                    required
                    value={newAddr.fullName}
                    onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label htmlFor="addr-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Phone number
                  </label>
                  <input
                    id="addr-phone"
                    type="tel"
                    required
                    value={newAddr.phone}
                    onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <BangladeshLocationFields
                  idPrefix="account-address"
                  value={{
                    division: newAddr.division,
                    district: newAddr.district,
                    upazila: newAddr.upazila,
                    union: newAddr.union || '',
                  }}
                  onChange={(next) => setNewAddr((prev) => ({ ...prev, ...next }))}
                />
              </div>

              <div>
                <label htmlFor="addr-street" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Street address
                </label>
                <textarea
                  id="addr-street"
                  rows={2}
                  required
                  value={newAddr.streetAddress}
                  onChange={(e) => setNewAddr({ ...newAddr, streetAddress: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Save Address
                </button>
              </div>
            </form>
          </Dialog>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6 max-w-xl">
          <h3 className="font-bold text-slate-900 text-sm">Account Security</h3>

          <div className="space-y-4 text-xs text-slate-600">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="font-bold text-slate-900">Administrator Access</p>
                <p className="text-slate-500">
                  Verified on the server against environment credentials. The password is never
                  transmitted to or stored by the browser.
                </p>
              </div>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                  isAdmin ? 'bg-green-800 text-green-50' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {isAdmin ? 'Session Active' : 'Signed Out'}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="font-bold text-slate-900">Session Token</p>
                <p className="text-slate-500">
                  Short-lived signed token issued by the API and required on every admin request.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase">
                8 Hour Expiry
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <p className="font-bold text-slate-900">Storefront Profile</p>
                <p className="text-slate-500">
                  Guest browsing is available. Signing in stores your addresses locally for faster
                  checkout.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 text-[10px] font-bold uppercase">
                {user ? 'Signed In' : 'Guest'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
