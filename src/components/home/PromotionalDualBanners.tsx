import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const PromotionalDualBanners: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="space-y-4">
      {/* Header */}
      <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 tracking-tight">
        Trusted by Top Brands
      </h2>

      {/* Dual Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Banner: Summer Collection */}
        <div className="relative rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-200 p-6 sm:p-7 overflow-hidden flex flex-col justify-between min-h-[190px] shadow-xs group">
          <div className="relative z-10 max-w-[60%] space-y-2">
            <h3 className="font-display font-black text-xl sm:text-2xl text-slate-950 tracking-tight">
              Summer Collection
            </h3>
            <div className="space-y-0.5 text-xs sm:text-sm text-slate-900 font-medium">
              <p className="font-bold text-amber-950">Up to 50% Off</p>
              <p className="text-slate-800">On Fashion & Accessories</p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => navigate('/shop?category=Fashion')}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Model Image on right edge */}
          <div className="absolute right-0 bottom-0 top-0 w-[42%] overflow-hidden flex items-end justify-end pointer-events-none">
            <img
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600"
              alt="Summer Fashion"
              className="h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Right Banner: Home Essentials */}
        <div className="relative rounded-2xl bg-gradient-to-r from-blue-100 via-sky-100 to-slate-100 p-6 sm:p-7 overflow-hidden flex flex-col justify-between min-h-[190px] shadow-xs group border border-blue-200/50">
          <div className="relative z-10 max-w-[60%] space-y-2">
            <h3 className="font-display font-black text-xl sm:text-2xl text-slate-950 tracking-tight">
              Home Essentials <br />
              <span className="font-semibold text-slate-700 text-lg">For Better Living</span>
            </h3>
            <div className="space-y-0.5 text-xs sm:text-sm text-slate-800 font-medium">
              <p className="font-bold text-blue-900">Up to 40% Off</p>
              <p className="text-slate-700">On Home & Kitchen</p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => navigate('/shop?category=Home+Decor')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interior Sofa Image on right edge */}
          <div className="absolute right-0 bottom-0 top-0 w-[45%] overflow-hidden flex items-center justify-end pointer-events-none">
            <img
              src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=600"
              alt="Home Living"
              className="h-full object-cover object-left group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
