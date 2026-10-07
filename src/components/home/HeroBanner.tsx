import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Truck, RefreshCw, ShieldCheck } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full">
      {/* Main Hero Card Container */}
      <div className="relative rounded-3xl bg-gradient-to-br from-blue-50/70 via-sky-50/40 to-amber-50/30 border border-slate-200/80 p-6 sm:p-8 lg:p-12 overflow-hidden shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6">
            {/* Top Amber Tag */}
            <span className="text-[11px] sm:text-xs font-bold tracking-wider text-amber-700 uppercase">
              PREMIUM QUALITY, PREMIUM YOU.
            </span>

            {/* Bold Headline */}
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-slate-900 tracking-tight leading-[1.15] text-balance">
              Everything You Need, <br className="hidden sm:inline" />
              All in <span className="text-blue-600">One Place</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
              Discover millions of products from top brands and trusted sellers. Best prices, premium quality & unbeatable service.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => navigate('/shop')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/25 flex items-center gap-2 hover:gap-3 transition-all cursor-pointer"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate('/shop?deals=true')}
                className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Explore Deals
              </button>
            </div>
          </div>

          {/* Right Product Showcase with floating badge */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Floating 'Up to 60% OFF' Badge */}
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-500 text-white font-display font-black flex flex-col items-center justify-center shadow-lg shadow-amber-500/30 border-2 border-white transform rotate-6 hover:rotate-0 transition-transform">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-tighter leading-tight">
                UP TO
              </span>
              <span className="text-lg sm:text-2xl leading-none">60%</span>
              <span className="text-[8px] sm:text-[9px] uppercase font-extrabold tracking-tighter">
                OFF
              </span>
            </div>

            {/* Hero 3D Render Image Container */}
            <div className="w-full max-w-md aspect-4/3 rounded-2xl overflow-hidden shadow-xl border border-white/60 bg-white p-2">
              <img
                src="/src/assets/images/marketly_hero_showcase_1790933000831.jpg"
                alt="Luxury Lifestyle Collection"
                className="w-full h-full object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Trust Highlights Row (matching reference image) */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
          <Truck className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="leading-tight">
            <h5 className="text-xs font-bold text-slate-900">Free Shipping</h5>
            <p className="text-[11px] text-slate-500">On orders over $49</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
          <RefreshCw className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="leading-tight">
            <h5 className="text-xs font-bold text-slate-900">Easy Returns</h5>
            <p className="text-[11px] text-slate-500">30-day return policy</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="leading-tight">
            <h5 className="text-xs font-bold text-slate-900">Secure Payment</h5>
            <p className="text-[11px] text-slate-500">100% protected</p>
          </div>
        </div>
      </div>
    </div>
  );
};
