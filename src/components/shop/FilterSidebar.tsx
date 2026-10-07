import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectAllCategories,
  selectAllBrands,
  selectFilters,
  setSelectedCategory,
  setSelectedBrand,
  setPriceRange,
  resetFilters,
} from '../../store/slices/productSlice';
import { RotateCcw, Filter } from 'lucide-react';

interface FilterSidebarProps {
  onCloseMobile?: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ onCloseMobile }) => {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(selectAllCategories);
  const brands = useAppSelector(selectAllBrands);
  const filters = useAppSelector(selectFilters);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-6 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-sm text-slate-900">Filters</h3>
        </div>
        <button
          onClick={() => dispatch(resetFilters())}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Categories
        </h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer hover:text-blue-600">
            <input
              type="radio"
              name="category"
              checked={filters.category === null}
              onChange={() => {
                dispatch(setSelectedCategory(null));
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-3.5 h-3.5 text-blue-600 border-slate-300 focus:ring-blue-500"
            />
            <span className="font-medium">All Categories</span>
          </label>
          {categories.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center justify-between text-xs text-slate-700 cursor-pointer hover:text-blue-600"
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="category"
                  checked={filters.category === cat.name}
                  onChange={() => {
                    dispatch(setSelectedCategory(cat.name));
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="w-3.5 h-3.5 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span>{cat.name}</span>
              </div>
              <span className="text-[11px] text-slate-400">({cat.itemCount.toLocaleString()})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Brand
        </h4>
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer hover:text-blue-600">
            <input
              type="radio"
              name="brand"
              checked={filters.brand === null}
              onChange={() => {
                dispatch(setSelectedBrand(null));
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-3.5 h-3.5 text-blue-600 border-slate-300 focus:ring-blue-500"
            />
            <span className="font-medium">All Brands</span>
          </label>
          {brands.map((b) => (
            <label
              key={b.id}
              className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer hover:text-blue-600"
            >
              <input
                type="radio"
                name="brand"
                checked={filters.brand === b.name}
                onChange={() => {
                  dispatch(setSelectedBrand(b.name));
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-3.5 h-3.5 text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span>{b.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range Slider */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Max Price
          </h4>
          <span className="text-xs font-bold text-blue-600 tabular-nums">
            ${filters.priceRange[1]}
          </span>
        </div>
        <input
          type="range"
          min="50"
          max="2000"
          step="50"
          value={filters.priceRange[1]}
          onChange={(e) => dispatch(setPriceRange([0, Number(e.target.value)]))}
          className="w-full accent-blue-600 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-semibold tabular-nums">
          <span>$0</span>
          <span>$1000</span>
          <span>$2000+</span>
        </div>
      </div>
    </div>
  );
};
