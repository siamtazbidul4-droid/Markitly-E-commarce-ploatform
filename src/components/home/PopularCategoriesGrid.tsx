import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectAllCategories } from '../../store/slices/productSlice';
import { ChevronRight } from 'lucide-react';

export const PopularCategoriesGrid: React.FC = () => {
  const navigate = useNavigate();
  const categories = useAppSelector(selectAllCategories);
  const popular = categories.slice(0, 4);

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 tracking-tight">
          Popular Categories
        </h2>
        <Link
          to="/shop"
          className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          <span>View All</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Grid of 4 Cards (2x2 on mobile, 4 across on desktop) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {popular.map((cat) => (
          <div
            key={cat.id}
            onClick={() => navigate(`/shop?category=${encodeURIComponent(cat.name)}`)}
            className="group flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-600/60 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-50 shrink-0 p-1">
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                {cat.name}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                {cat.itemCount.toLocaleString()}+ items
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
