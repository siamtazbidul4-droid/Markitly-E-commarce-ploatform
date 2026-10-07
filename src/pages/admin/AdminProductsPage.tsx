import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectAllProducts, selectAllCategories, deleteProduct } from '../../store/slices/productSlice';
import { addNotification } from '../../store/slices/uiSlice';
import { api, ApiError } from '../../services/api';
import { Dialog } from '../../components/common/Dialog';
import { ProductForm } from '../../components/admin/ProductForm';
import { useConfirm } from '../../components/common/ConfirmDialog';
import { Product } from '../../types';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  ExternalLink,
  Filter,
  Package,
  PackagePlus,
} from 'lucide-react';

export const AdminProductsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const confirmAction = useConfirm();
  const products = useAppSelector(selectAllProducts);
  const categories = useAppSelector(selectAllCategories);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term);
      const matchesCategory =
        selectedCat === 'all' || p.category.toLowerCase() === selectedCat.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCat]);

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirmAction({
      title: 'Confirm product deletion',
      message: `Are you sure you want to delete “${name}”? This removes it from the catalog and cannot be undone.`,
      confirmText: 'Delete product',
      variant: 'danger',
    });
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await api.deleteProduct(id);
      dispatch(deleteProduct(id));
      dispatch(
        addNotification({
          type: 'success',
          title: 'Product Deleted',
          message: `“${name}” was removed from the catalog.`,
          duration: 3500,
        })
      );
    } catch (err) {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Delete Failed',
          message:
            err instanceof ApiError
              ? err.message
              : 'The product could not be deleted. Please try again.',
          duration: 5000,
        })
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Product Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your store&apos;s luxury items, pricing, SKUs, and stock authority.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <div className="relative w-full lg:w-80">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Search products"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, SKU, brand…"
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          <label htmlFor="admin-product-category" className="sr-only">
            Filter by category
          </label>
          <select
            id="admin-product-category"
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer w-full lg:w-auto"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table (desktop) / Cards (mobile) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-5 py-14 text-center space-y-3">
            <Package className="w-10 h-10 text-slate-300 mx-auto" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-700">No products match your filters.</p>
            <p className="text-xs text-slate-500">
              Adjust the search term or category, or add a new product to the catalog.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 mt-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <PackagePlus className="w-4 h-4" aria-hidden="true" />
              <span>Add New Product</span>
            </button>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <caption className="sr-only">Catalog products</caption>
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="p-4">Product</th>
                    <th scope="col" className="p-4">SKU</th>
                    <th scope="col" className="p-4">Category</th>
                    <th scope="col" className="p-4">Price</th>
                    <th scope="col" className="p-4">Inventory</th>
                    <th scope="col" className="p-4">Status</th>
                    <th scope="col" className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.mainImage}
                            alt=""
                            className="w-12 h-12 object-contain rounded-xl bg-slate-50 border p-1 shrink-0"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                          <div className="min-w-0">
                            <Link
                              to={`/product/${p.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-slate-900 hover:text-blue-600 line-clamp-1 flex items-center gap-1"
                            >
                              <span>{p.name}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
                            </Link>
                            <span className="text-[10px] text-slate-400">{p.brand}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-500 font-semibold">{p.sku}</td>
                      <td className="p-4 text-slate-700">{p.category}</td>
                      <td className="p-4 font-bold text-slate-900 tabular-nums">
                        ${p.price.toFixed(2)}
                        {p.compareAtPrice && p.compareAtPrice > p.price && (
                          <span className="block text-[10px] text-slate-400 line-through">
                            ${p.compareAtPrice.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold tabular-nums text-xs ${
                            p.inventory > 10
                              ? 'bg-emerald-50 text-emerald-700'
                              : p.inventory > 0
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {p.inventory} in stock
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] uppercase">
                          {p.isFeatured ? 'Featured' : p.isBestSeller ? 'Best Seller' : 'Published'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <RowActions
                          product={p}
                          busy={deletingId === p.id}
                          onDelete={() => handleDelete(p.id, p.name)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card layout */}
            <ul className="lg:hidden divide-y divide-slate-100">
              {filtered.map((p) => (
                <li key={p.id} className="p-4 flex items-start gap-3">
                  <img
                    src={p.mainImage}
                    alt=""
                    className="w-14 h-14 object-contain rounded-xl bg-slate-50 border p-1 shrink-0"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="min-w-0 grow">
                    <p className="font-bold text-sm text-slate-900 line-clamp-2">{p.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{p.sku}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                      <span className="font-bold text-slate-900 tabular-nums">${p.price.toFixed(2)}</span>
                      <span className="text-slate-500">{p.category}</span>
                      <span className="text-slate-500 tabular-nums">{p.inventory} in stock</span>
                    </div>
                  </div>
                  <RowActions
                    product={p}
                    busy={deletingId === p.id}
                    onDelete={() => handleDelete(p.id, p.name)}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Add product — reusable dialog wrapping the shared product form */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Product"
        description="Define pricing, inventory, media and merchandising flags. Saved directly to the catalog."
        maxWidth="4xl"
        labelledBy="admin-create-product-title"
      >
        <ProductForm
          layout="dialog"
          onCancel={() => setIsCreateOpen(false)}
          onSuccess={() => setIsCreateOpen(false)}
        />
      </Dialog>
    </div>
  );
};

interface RowActionsProps {
  product: Product;
  busy: boolean;
  onDelete: () => void;
}

const RowActions: React.FC<RowActionsProps> = ({ product, busy, onDelete }) => (
  <div className="flex items-center justify-end gap-1">
    <Link
      to={`/admin/products/${product.id}/edit`}
      className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
      aria-label={`Edit ${product.name}`}
      title="Edit product"
    >
      <Edit3 className="w-4 h-4" aria-hidden="true" />
    </Link>
    <button
      type="button"
      onClick={onDelete}
      disabled={busy}
      className="p-2 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label={`Delete ${product.name}`}
      title="Delete product"
    >
      <Trash2 className="w-4 h-4" aria-hidden="true" />
    </button>
  </div>
);