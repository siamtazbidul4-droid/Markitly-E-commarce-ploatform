import React from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectAllProducts } from '../../store/slices/productSlice';
import { ProductCard } from '../shop/ProductCard';
import { ChevronRight } from 'lucide-react';

export const FeaturedProductsSection: React.FC = () => {
  const products = useAppSelector(selectAllProducts);
  const featured = products.filter((p) => p.isFeatured).slice(0, 4);

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 tracking-tight">
          Featured Products
        </h2>
        <Link
          to="/shop?featured=true"
          className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          <span>View All</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Grid: 2 columns on mobile (exact match to reference), 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        {featured.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};
