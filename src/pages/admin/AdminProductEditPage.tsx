import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectAllProducts } from '../../store/slices/productSlice';
import { ProductForm } from '../../components/admin/ProductForm';
import { ArrowLeft } from 'lucide-react';

/**
 * Dedicated full-page route for product editing.
 * Shares the exact same form component and API path as product creation.
 */
export const AdminProductEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const products = useAppSelector(selectAllProducts);
  const existing = products.find((p) => p.id === id);

  if (!existing) {
    return (
      <div className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3">
        <h2 className="font-display text-lg font-bold text-slate-900">Product not found</h2>
        <p className="text-sm text-slate-500">
          It may have been removed from the catalog in another session.
        </p>
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-2 px-4 py-2.5 mt-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Return to Product List</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 pb-4 border-b border-slate-200">
        <Link
          to="/admin/products"
          className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition-colors shrink-0"
          aria-label="Back to product catalog"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </Link>
        <div className="min-w-0">
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight truncate">
            Edit Product
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">
            {existing.name} · <span className="font-mono">{existing.sku}</span>
          </p>
        </div>
      </div>

      <ProductForm
        key={existing.id}
        product={existing}
        layout="page"
        onCancel={() => navigate('/admin/products')}
        onSuccess={() => navigate('/admin/products')}
      />
    </div>
  );
};