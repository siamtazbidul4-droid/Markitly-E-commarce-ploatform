import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectAllProducts,
  selectFilters,
  setSortBy,
  setSelectedCategory,
  resetFilters,
} from '../store/slices/productSlice';
import { ProductCard } from '../components/shop/ProductCard';
import { FilterSidebar } from '../components/shop/FilterSidebar';
import { SlidersHorizontal, ArrowUpDown, X, PackageSearch } from 'lucide-react';

export const ShopPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const products = useAppSelector(selectAllProducts);
  const filters = useAppSelector(selectFilters);

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync URL search params
  const categoryParam = searchParams.get('category');
  const searchParam = searchParams.get('search');
  const saleParam = searchParams.get('sale');
  const dealsParam = searchParams.get('deals');
  const bestsellerParam = searchParams.get('bestseller');

  useEffect(() => {
    if (categoryParam) {
      dispatch(setSelectedCategory(categoryParam));
    }
  }, [categoryParam, dispatch]);

  // Filter products based on search, category, brand, and price
  const filteredProducts = products.filter((p) => {
    if (searchParam && !p.name.toLowerCase().includes(searchParam.toLowerCase()) && !p.category.toLowerCase().includes(searchParam.toLowerCase()) && !p.brand.toLowerCase().includes(searchParam.toLowerCase())) {
      return false;
    }
    if (filters.category && p.category.toLowerCase() !== filters.category.toLowerCase()) {
      return false;
    }
    if (filters.brand && p.brand.toLowerCase() !== filters.brand.toLowerCase()) {
      return false;
    }
    if (p.price > filters.priceRange[1]) {
      return false;
    }
    if (saleParam && !p.discountPercent) {
      return false;
    }
    if (dealsParam && !p.isFlashDeal && !p.discountPercent) {
      return false;
    }
    if (bestsellerParam && !p.isBestSeller) {
      return false;
    }
    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (filters.sortBy === 'price-low') return a.price - b.price;
    if (filters.sortBy === 'price-high') return b.price - a.price;
    if (filters.sortBy === 'rating') return b.rating - a.rating;
    if (filters.sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            {searchParam
              ? `Results for "${searchParam}"`
              : filters.category
              ? filters.category
              : 'Curated Catalog'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Showing <strong className="text-slate-900">{sortedProducts.length}</strong> luxury products
          </p>
        </div>

        {/* Sort & Mobile Filter Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="md:hidden flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs"
          >
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <select
              value={filters.sortBy}
              onChange={(e) => dispatch(setSortBy(e.target.value as any))}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="featured">Featured First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Pills if applied */}
      {(filters.category || filters.brand || searchParam) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Active Filters:</span>
          {filters.category && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
              Category: {filters.category}
              <button
                onClick={() => dispatch(setSelectedCategory(null))}
                className="hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.brand && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
              Brand: {filters.brand}
              <button
                onClick={() => dispatch(resetFilters())}
                className="hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Main Grid & Sidebar Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Desktop Filter Sidebar */}
        <div className="hidden md:block md:col-span-1 sticky top-24">
          <FilterSidebar />
        </div>

        {/* Products Grid */}
        <div className="md:col-span-3">
          {sortedProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                <PackageSearch className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No products match your criteria</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mt-1 mb-6">
                Try clearing your search query or selecting a broader category.
              </p>
              <button
                onClick={() => dispatch(resetFilters())}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {sortedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative w-full max-w-xs bg-white h-full shadow-2xl p-4 overflow-y-auto z-10">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm text-slate-900">Filter Products</h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <FilterSidebar onCloseMobile={() => setMobileFilterOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
