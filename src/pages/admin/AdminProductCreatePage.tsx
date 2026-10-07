import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProductForm } from '../../components/admin/ProductForm';
import { ArrowLeft } from 'lucide-react';

/**
 * Dedicated full-page route for product creation.
 * Shares the exact same form component and API path as the "Add Product" dialog.
 */
export const AdminProductCreatePage: React.FC = () => {
  const navigate = useNavigate();

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
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Create New Product
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Define product metadata, pricing, inventory authority, and technical specifications.
          </p>
        </div>
      </div>

      <ProductForm
        layout="page"
        onCancel={() => navigate('/admin/products')}
        onSuccess={() => navigate('/admin/products')}
      />
    </div>
  );
};