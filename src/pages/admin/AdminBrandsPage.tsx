import React, { useCallback, useEffect, useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { addNotification } from '../../store/slices/uiSlice';
import { useConfirm } from '../../components/common/ConfirmDialog';
import { api, ApiError } from '../../services/api';
import { Brand } from '../../types';
import { Tag, Plus, Trash2, Loader2 } from 'lucide-react';

export const AdminBrandsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const confirmAction = useConfirm();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandName, setBrandName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadBrands = useCallback(() => {
    api
      .getBrands()
      .then((data) => setBrands(Array.isArray(data) ? data : []))
      .catch(() => {
        // A tolerant read that still failed means the catalog API is unreachable;
        // the local list stays empty and the empty state explains the situation.
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = brandName.trim();
    if (!name || saving) return;

    setSaving(true);
    try {
      const created = await api.createBrand({ name });
      setBrands((prev) => (prev.some((b) => b.slug === created.slug) ? prev : [...prev, created]));
      setBrandName('');
      dispatch(
        addNotification({
          type: 'success',
          title: 'Brand Added',
          message: `${created.name} is now available in the catalog.`,
          duration: 3000,
        })
      );
    } catch (err) {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Brand Not Saved',
          message: err instanceof ApiError ? err.message : 'The brand could not be created.',
          duration: 4500,
        })
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (brand: Brand) => {
    const confirmed = await confirmAction({
      title: `Remove ${brand.name}?`,
      message:
        'The brand will be removed from the catalog directory. Products already assigned to it keep their stored brand name.',
      confirmText: 'Remove brand',
      variant: 'danger',
    });
    if (!confirmed || deletingId) return;

    setDeletingId(brand.id);
    try {
      await api.deleteBrand(brand.id);
      setBrands((prev) => prev.filter((b) => b.id !== brand.id));
      dispatch(
        addNotification({
          type: 'success',
          title: 'Brand Removed',
          message: `${brand.name} was removed from the directory.`,
          duration: 3000,
        })
      );
    } catch (err) {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Delete Failed',
          message: err instanceof ApiError ? err.message : 'The brand could not be removed.',
          duration: 4500,
        })
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
          Brand Directory
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Authorized vendor and luxury manufacturing brands represented in your catalog.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Create Brand (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" aria-hidden="true" />
            <span>Add Brand</span>
          </h2>

          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label htmlFor="brand-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Brand Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="brand-name"
                type="text"
                required
                placeholder="e.g. Cartier, Sony, Nike"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !brandName.trim()}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
              <span>{saving ? 'Saving…' : 'Add Brand'}</span>
            </button>
          </form>
        </div>

        {/* Brand List (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
            Active Brands ({brands.length})
          </h2>

          {loading ? (
            <div className="py-10 flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              <p className="text-xs font-semibold">Loading brand directory…</p>
            </div>
          ) : brands.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Tag className="w-8 h-8 text-slate-300 mx-auto" aria-hidden="true" />
              <p className="text-sm font-semibold text-slate-700">No brands in the directory yet.</p>
              <p className="text-xs text-slate-500">Add your first brand using the form.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {brands.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 truncate">{b.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono truncate">/{b.slug}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(b)}
                    disabled={deletingId === b.id}
                    aria-label={`Remove ${b.name}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    {deletingId === b.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};