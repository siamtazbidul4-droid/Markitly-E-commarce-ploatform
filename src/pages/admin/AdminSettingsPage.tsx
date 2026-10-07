import React, { useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { addNotification } from '../../store/slices/uiSlice';
import { AlertTriangle, Save } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();

  const [storeName, setStoreName] = useState('Marketly');
  const [supportEmail, setSupportEmail] = useState('concierge@marketly.com');
  const [supportPhone, setSupportPhone] = useState('+880 9612-MARKET');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(49);
  const [returnDays, setReturnDays] = useState(30);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // The checkout and order controllers read their own hard-coded shipping and
    // return constants; there is no settings endpoint feeding them. Reporting
    // "applied to commercial rules engine" implied these values were live.
    dispatch(
      addNotification({
        type: 'warning',
        title: 'Not Saved',
        message:
          'No settings API exists yet. Checkout and order totals still use the server\'s built-in constants, so these values did not change any rule.',
        duration: 5000,
      })
    );
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
          Enterprise Store Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure commercial delivery rules, support endpoints, and Bangladesh logistics defaults.
        </p>
      </div>

      <div
        role="status"
        className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900"
      >
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
        <p className="text-xs sm:text-sm leading-relaxed">
          <strong className="font-semibold">Not connected — nothing is persisted.</strong> Shipping thresholds,
          return windows, and support contacts below are local draft values only. The server still enforces its
          own hard-coded delivery and return rules, so editing these does not change checkout behaviour.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
          Merchant Identity & Contacts
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="set-store-name" className="block text-xs font-semibold text-slate-700 mb-1">Store Name</label>
            <input
              id="set-store-name"
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label htmlFor="set-support-email" className="block text-xs font-semibold text-slate-700 mb-1">Support Email</label>
            <input
              id="set-support-email"
              type="email"
              required
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label htmlFor="set-support-phone" className="block text-xs font-semibold text-slate-700 mb-1">Customer Care Hotline</label>
            <input
              id="set-support-phone"
              type="text"
              required
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider pt-4 border-t border-slate-100">
          Delivery & Return Thresholds
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="set-free-shipping" className="block text-xs font-semibold text-slate-700 mb-1">
              Free Delivery Order Minimum ($)
            </label>
            <input
              id="set-free-shipping"
              type="number"
              required
              value={freeShippingThreshold}
              onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label htmlFor="set-return-days" className="block text-xs font-semibold text-slate-700 mb-1">
              Guaranteed Return Window (Days)
            </label>
            <input
              id="set-return-days"
              type="number"
              required
              value={returnDays}
              onChange={(e) => setReturnDays(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Check Draft Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
