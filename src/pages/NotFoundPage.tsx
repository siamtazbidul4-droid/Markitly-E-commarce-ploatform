import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
        <ShoppingBag className="w-8 h-8" />
      </div>
      <h1 className="font-display font-extrabold text-3xl text-slate-900">404 - Page Not Found</h1>
      <p className="text-xs sm:text-sm text-slate-500">
        The requested luxury page or curation could not be located.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Storefront</span>
      </Link>
    </div>
  );
};
