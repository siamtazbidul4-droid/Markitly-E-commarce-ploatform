import React, { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectAllOrders } from '../../store/slices/orderSlice';
import { addNotification } from '../../store/slices/uiSlice';
import { useAppDispatch } from '../../store/hooks';
import { api, ApiError } from '../../services/api';
import { User } from '../../types';
import { Users, Mail, Phone, Search, Loader2 } from 'lucide-react';

interface CustomerRow extends User {
  createdAt?: string;
}

export const AdminCustomersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const orders = useAppSelector(selectAllOrders);

  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;

    api
      .getCustomers()
      .then((data) => {
        if (cancelled) return;
        setCustomers(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (cancelled) return;
        dispatch(
          addNotification({
            type: 'error',
            title: 'Directory Unavailable',
            message:
              err instanceof ApiError ? err.message : 'The customer directory could not be loaded.',
            duration: 4500,
          })
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  const rows = useMemo(() => {
    const stats = new Map<string, { count: number; total: number }>();
    orders.forEach((order) => {
      const key = order.customer.email.toLowerCase();
      const entry = stats.get(key) ?? { count: 0, total: 0 };
      entry.count += 1;
      entry.total += order.total;
      stats.set(key, entry);
    });

    const term = search.trim().toLowerCase();

    return customers
      .map((customer) => {
        const orderStats = stats.get((customer.email || '').toLowerCase());
        return {
          ...customer,
          ordersCount: orderStats?.count ?? 0,
          totalSpent: Number((orderStats?.total ?? 0).toFixed(2)),
          joinedAt: customer.createdAt
            ? new Date(customer.createdAt).toLocaleDateString()
            : '—',
        };
      })
      .filter((customer) => {
        if (!term) return true;
        return (
          customer.name?.toLowerCase().includes(term) ||
          customer.email?.toLowerCase().includes(term) ||
          customer.phone?.toLowerCase().includes(term)
        );
      });
  }, [customers, orders, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
          Customer Directory & Accounts
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Registered customer profiles, historical purchase volume, and Bangladesh delivery hubs.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="relative w-full lg:w-80">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Search customers"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="px-5 py-16 flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
            <p className="text-xs font-semibold">Loading customer directory…</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-16 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-700">No customers found.</p>
            <p className="text-xs text-slate-500">
              {search ? 'Try a different search term.' : 'Customers appear here once they register.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <caption className="sr-only">Registered customers</caption>
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th scope="col" className="p-4">Customer</th>
                  <th scope="col" className="p-4">Contact</th>
                  <th scope="col" className="p-4">Hub Division</th>
                  <th scope="col" className="p-4">Orders Placed</th>
                  <th scope="col" className="p-4">Total Value</th>
                  <th scope="col" className="p-4 text-right">Member Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {c.avatar ? (
                          <img
                            src={c.avatar}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                        ) : (
                          <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                            {c.name?.charAt(0) || 'C'}
                          </span>
                        )}
                        <span className="font-bold text-slate-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="p-4 space-y-0.5">
                      <p className="text-slate-800 flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400" aria-hidden="true" />
                        {c.email}
                      </p>
                      {c.phone && (
                        <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                          <Phone className="w-3 h-3" aria-hidden="true" />
                          {c.phone}
                        </p>
                      )}
                    </td>
                    <td className="p-4 font-medium text-slate-700">
                      {c.addresses?.[0]?.division || '—'}
                    </td>
                    <td className="p-4 font-bold text-blue-600 tabular-nums">{c.ordersCount} orders</td>
                    <td className="p-4 font-black text-slate-900 tabular-nums">
                      ${c.totalSpent.toFixed(2)}
                    </td>
                    <td className="p-4 text-right text-slate-400">{c.joinedAt}</td>
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