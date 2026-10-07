import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectAllCategories,
  addCategory,
  deleteCategory,
} from '../../store/slices/productSlice';
import { addNotification } from '../../store/slices/uiSlice';
import { useConfirm } from '../../components/common/ConfirmDialog';
import { api, ApiError } from '../../services/api';
import { Category } from '../../types';
import { Layers, Plus, Trash2 } from 'lucide-react';
import { ImageUploadField } from '../../components/admin/ImageUploadField';

export const AdminCategoriesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const confirmAction = useConfirm();
  const categories = useAppSelector(selectAllCategories);

  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || loading) return;

    setLoading(true);
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    // Placeholder id only: the persisted record gets a Mongo id from the server,
    // and that value replaces this one before it reaches the store. Dispatching
    // the locally minted id made `DELETE /admin/categories/:id` send `cat_<ts>`,
    // which the server rejects as an invalid identifier - so a newly created
    // category could never be deleted.
    const draft: Category = {
      id: '',
      name: name.trim(),
      slug,
      image: image.trim() || 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=400',
      itemCount: 0,
      featured: true,
    };

    try {
      const saved = await api.createCategory(draft);
      const created: Category = { ...draft, ...saved, id: String(saved.id) };
      dispatch(addCategory(created));
      dispatch(
        addNotification({
          type: 'success',
          title: 'Category Created',
          message: `“${created.name}” is now live across storefront navigation.`,
          duration: 3000,
        })
      );
      setName('');
      setImage('');
    } catch (err) {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Create Failed',
          message:
            err instanceof ApiError ? err.message : 'The category could not be created. Try again.',
          duration: 4500,
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    const confirmed = await confirmAction({
      title: 'Confirm category deletion',
      message: `Remove “${catName}” from storefront navigation and shop filters? Products already assigned to it are not deleted.`,
      confirmText: 'Delete category',
      variant: 'danger',
    });
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await api.deleteCategory(id);
      dispatch(deleteCategory(id));
      dispatch(
        addNotification({
          type: 'success',
          title: 'Category Removed',
          message: `“${catName}” was removed from the storefront.`,
          duration: 3000,
        })
      );
    } catch (err) {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Delete Failed',
          message:
            err instanceof ApiError ? err.message : 'The category could not be deleted. Try again.',
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
          Storefront Categories
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Categories are database-driven. Any additions or modifications update both storefront navigation and shop filters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Create Category Form (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Create Category</span>
          </h2>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Footwear, Precision Watches"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <ImageUploadField
              label="Category image"
              value={image}
              onChange={setImage}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {loading ? 'Creating...' : 'Create Category'}
            </button>
          </form>
        </div>

        {/* Category List (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
            Active Categories ({categories.length})
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-3 hover:border-blue-600/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-white border p-1 overflow-hidden shrink-0">
                    <img
                      src={c.image}
                      alt={c.name}
                      className="w-full h-full object-cover rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 truncate">{c.name}</h4>
                    <p className="text-[11px] text-slate-400 font-mono">/{c.slug}</p>
                    <span className="text-[11px] text-blue-600 font-medium">
                      {c.itemCount.toLocaleString()} items
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(c.id, c.name)}
                  disabled={deletingId === c.id}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  title="Delete category"
                  aria-label={`Delete category ${c.name}`}
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
