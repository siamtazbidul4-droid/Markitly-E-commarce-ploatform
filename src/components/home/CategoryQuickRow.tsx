import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectAllCategories } from '../../store/slices/productSlice';
import {
  Shirt,
  Headphones,
  Sparkles,
  Armchair,
  ShoppingBasket,
  Dumbbell,
  Watch,
  Laptop,
  MoreHorizontal,
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Shirt: <Shirt className="w-5 h-5 text-amber-700" />,
  Headphones: <Headphones className="w-5 h-5 text-blue-700" />,
  Sparkles: <Sparkles className="w-5 h-5 text-pink-700" />,
  Armchair: <Armchair className="w-5 h-5 text-emerald-700" />,
  ShoppingBasket: <ShoppingBasket className="w-5 h-5 text-orange-700" />,
  Dumbbell: <Dumbbell className="w-5 h-5 text-indigo-700" />,
  Watch: <Watch className="w-5 h-5 text-slate-800" />,
  Laptop: <Laptop className="w-5 h-5 text-cyan-700" />,
};

export const CategoryQuickRow: React.FC = () => {
  const navigate = useNavigate();
  const categories = useAppSelector(selectAllCategories);

  return (
    <div className="py-4 overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-3 sm:gap-6 min-w-max px-2 sm:px-0">
        {categories.slice(0, 7).map((cat) => (
          <button
            key={cat.id}
            onClick={() => navigate(`/shop?category=${encodeURIComponent(cat.name)}`)}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center p-2 group-hover:border-blue-600 group-hover:shadow-md group-hover:scale-105 transition-all">
              {cat.image ? (
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                iconMap[cat.iconName || 'Shirt'] || <Shirt className="w-5 h-5 text-slate-700" />
              )}
            </div>
            <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
              {cat.name}
            </span>
          </button>
        ))}

        {/* 'All' Category shortcut */}
        <button
          onClick={() => navigate('/shop')}
          className="flex flex-col items-center gap-2 group cursor-pointer"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 border border-slate-200/80 shadow-xs flex items-center justify-center p-2 group-hover:border-blue-600 group-hover:bg-blue-50 group-hover:scale-105 transition-all">
            <MoreHorizontal className="w-6 h-6 text-slate-600 group-hover:text-blue-600" />
          </div>
          <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
            All
          </span>
        </button>
      </div>
    </div>
  );
};
