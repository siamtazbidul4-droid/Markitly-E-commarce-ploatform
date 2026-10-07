import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectAllBanners, updateBanner } from '../../store/slices/productSlice';
import { addNotification } from '../../store/slices/uiSlice';
import { Dialog } from '../../components/common/Dialog';
import { api, ApiError } from '../../services/api';
import { PromotionBanner } from '../../types';
import { Sliders, CheckCircle2 } from 'lucide-react';
import { ImageUploadField } from '../../components/admin/ImageUploadField';

const fieldClass =
  'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-60';

const labelClass = 'block text-xs font-semibold text-slate-700 mb-1.5';

export const AdminBannersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const banners = useAppSelector(selectAllBanners);

  const [editingBanner, setEditingBanner] = useState<PromotionBanner | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner || saving) return;

    setSaving(true);
    try {
      await api.updateBanner(editingBanner.id, editingBanner);
      dispatch(updateBanner(editingBanner));
      dispatch(
        addNotification({
          type: 'success',
          title: 'Banner Saved',
          message: `Updated promotional banner “${editingBanner.title}”.`,
          duration: 3000,
        })
      );
      setEditingBanner(null);
    } catch (err) {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Save Failed',
          message: err instanceof ApiError ? err.message : 'The banner could not be saved.',
          duration: 4500,
        })
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
          Promotional Banners & CMS Campaigns
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage dynamic hero showcases, flash deal highlights, and dual commercial campaign cards.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] uppercase">
                  Position: {b.position}
                </span>
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active
                </span>
              </div>

              <div className="aspect-16/9 rounded-2xl bg-slate-50 border overflow-hidden p-2 flex items-center justify-center">
                <img
                  src={b.image}
                  alt={b.title}
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900">{b.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{b.subtitle}</p>
                <div className="mt-2 text-xs font-medium text-slate-600 space-y-0.5">
                  <p>CTA Label: <strong className="text-slate-900">{b.ctaText}</strong></p>
                  <p>Destination: <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded">{b.ctaLink}</code></p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setEditingBanner(b)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Edit Banner Content
            </button>
          </div>
        ))}
      </div>

      {/* Edit Modal - reuses the shared Dialog component */}
      <Dialog
        isOpen={!!editingBanner}
        onClose={() => setEditingBanner(null)}
        title={editingBanner ? 'Edit Banner (' + editingBanner.position + ')' : 'Edit Banner'}
        description="Headline, call to action and placement shown on the storefront."
        maxWidth="lg"
        dismissible={!saving}
        labelledBy="admin-banner-edit-title"
      >
        {editingBanner && (
          <form onSubmit={handleSave} className="space-y-4" noValidate>
            <div>
              <label htmlFor="banner-title" className={labelClass}>
                Headline
              </label>
              <input
                id="banner-title"
                type="text"
                required
                value={editingBanner.title}
                onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="banner-subtitle" className={labelClass}>
                Subtitle
              </label>
              <input
                id="banner-subtitle"
                type="text"
                value={editingBanner.subtitle || ''}
                onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                className={fieldClass}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="banner-cta-text" className={labelClass}>
                  CTA label
                </label>
                <input
                  id="banner-cta-text"
                  type="text"
                  required
                  value={editingBanner.ctaText}
                  onChange={(e) => setEditingBanner({ ...editingBanner, ctaText: e.target.value })}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="banner-cta-link" className={labelClass}>
                  CTA link
                </label>
                <input
                  id="banner-cta-link"
                  type="text"
                  required
                  value={editingBanner.ctaLink}
                  onChange={(e) => setEditingBanner({ ...editingBanner, ctaLink: e.target.value })}
                  className={fieldClass}
                />
              </div>
            </div>
            <ImageUploadField
              label="Banner image"
              required
              value={editingBanner.image}
              onChange={(url) => setEditingBanner({ ...editingBanner, image: url })}
            />
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setEditingBanner(null)}
                disabled={saving}
                className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
};
