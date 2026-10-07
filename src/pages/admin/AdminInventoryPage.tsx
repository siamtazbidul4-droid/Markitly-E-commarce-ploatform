import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectAllProducts, updateProduct } from '../../store/slices/productSlice';
import { addNotification } from '../../store/slices/uiSlice';
import { api, ApiError } from '../../services/api';
import { Product } from '../../types';
import { Archive, AlertTriangle } from 'lucide-react';

export const AdminInventoryPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const products = useAppSelector(selectAllProducts);

  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const handleAdjustStock = async (product: Product) => {
    if (saving) return;
    const target = Number(newStock);
    if (!Number.isFinite(target) || target < 0) {
      dispatch(
        addNotification({
          type: 'warning',
          title: 'Invalid quantity',
          message: 'Stock count must be zero or a positive number.',
          duration: 3500,
        })
      );
      return;
    }

    const updated: Product = { ...product, inventory: target };
    setSaving(true);

    try {
      // Uses the dedicated stock route rather than the generic product PUT: it
      // writes an "Inventory Adjusted" audit entry instead of a misleading
      // "Product Updated", and it supports per-variant stock levels.
      const saved = await api.adjustStock({
        productId: product.id,
        newQuantity: target,
        reason: 'Manual count adjustment from inventory console',
      });
      dispatch(updateProduct({ ...product, ...(saved as Partial<Product>), id: product.id }));
      dispatch(
        addNotification({
          type: 'success',
          title: 'Inventory Updated',
          message: `${product.name} stock level set to ${target} units.`,
          duration: 3000,
        })
      );
      setAdjustingId(null);
    } catch (err) {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Adjustment Failed',
          message:
            err instanceof ApiError ? err.message : 'The stock level could not be updated.',
          duration: 4500,
        })
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
          Inventory Authority & Stock Control
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Server-authoritative stock levels across variants and products. Changes immediately affect checkout availability.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Product Name</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Category</th>
                <th className="p-4">Current Stock</th>
                <th className="p-4">Stock Status</th>
                <th className="p-4 text-right">Quick Stock Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {products.map((p) => {
                const isAdjusting = adjustingId === p.id;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-900">{p.name}</td>
                    <td className="p-4 font-mono text-slate-500">{p.sku}</td>
                    <td className="p-4 text-slate-700">{p.category}</td>
                    <td className="p-4 font-bold text-slate-900 tabular-nums text-sm">
                      {p.inventory} units
                    </td>
                    <td className="p-4">
                      {p.inventory > 10 ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-xs">
                          In Stock
                        </span>
                      ) : p.inventory > 0 ? (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-bold rounded-lg text-xs flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          Low Stock ({p.inventory})
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-bold rounded-lg text-xs">
                          Out of Stock
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {isAdjusting ? (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <label className="sr-only" htmlFor={`stock-${p.id}`}>
                            New stock count for {p.name}
                          </label>
                          <input
                            id={`stock-${p.id}`}
                            type="number"
                            min="0"
                            step="1"
                            value={newStock}
                            onChange={(e) => setNewStock(Number(e.target.value))}
                            className="w-24 px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(p)}
                            disabled={saving}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {saving ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdjustingId(null)}
                            disabled={saving}
                            className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 rounded-lg transition-colors disabled:opacity-60"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustingId(p.id);
                            setNewStock(p.inventory);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                        >
                          Adjust Count
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
