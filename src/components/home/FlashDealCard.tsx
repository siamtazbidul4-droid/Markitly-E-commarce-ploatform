import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowRight } from 'lucide-react';

export const FlashDealCard: React.FC = () => {
  const navigate = useNavigate();

  // Dynamic countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 12,
    mins: 45,
    secs: 30,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.secs > 0) {
          return { ...prev, secs: prev.secs - 1 };
        } else if (prev.mins > 0) {
          return { ...prev, mins: prev.mins - 1, secs: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, mins: 59, secs: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, mins: 59, secs: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="w-full rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-5 sm:p-7 shadow-lg shadow-blue-600/20 overflow-hidden relative">
      {/* Background ambient ring glow */}
      <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        {/* Left Side: Product Showcase + Info */}
        <div className="flex flex-col sm:flex-row items-center gap-5 w-full md:w-auto text-center sm:text-left">
          {/* Product Thumbnail inside crisp white card */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-2 shadow-md shrink-0 flex items-center justify-center">
            <img
              src="/src/assets/images/smartwatch_flash_deal_1790933014371.jpg"
              alt="Smart Watch Series Ultra"
              className="w-full h-full object-cover rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Flash Deal Copy & Price */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-amber-300 font-bold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4 fill-amber-300" />
              <span>Flash Deal</span>
            </div>
            <p className="text-xs text-blue-100 font-medium">Limited Time Offer</p>

            <div className="flex items-baseline justify-center sm:justify-start gap-2 pt-1">
              <span className="text-xs text-blue-200">Special Price</span>
              <span className="text-2xl font-extrabold text-white tabular-nums">$149.99</span>
              <span className="text-xs text-blue-300/80 line-through tabular-nums">$249.99</span>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/product/smart-watch-series-ultra-titanium')}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Shop the Deal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Countdown Timer Boxes */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex flex-col items-center justify-center w-14 h-16 sm:w-16 sm:h-18 rounded-xl bg-blue-900/60 border border-blue-400/30 backdrop-blur-xs">
            <span className="font-display font-extrabold text-lg sm:text-xl text-white tabular-nums">
              {formatNumber(timeLeft.days)}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-blue-200">
              DAYS
            </span>
          </div>

          <div className="flex flex-col items-center justify-center w-14 h-16 sm:w-16 sm:h-18 rounded-xl bg-blue-900/60 border border-blue-400/30 backdrop-blur-xs">
            <span className="font-display font-extrabold text-lg sm:text-xl text-white tabular-nums">
              {formatNumber(timeLeft.hours)}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-blue-200">
              HRS
            </span>
          </div>

          <div className="flex flex-col items-center justify-center w-14 h-16 sm:w-16 sm:h-18 rounded-xl bg-blue-900/60 border border-blue-400/30 backdrop-blur-xs">
            <span className="font-display font-extrabold text-lg sm:text-xl text-white tabular-nums">
              {formatNumber(timeLeft.mins)}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-blue-200">
              MINS
            </span>
          </div>

          <div className="flex flex-col items-center justify-center w-14 h-16 sm:w-16 sm:h-18 rounded-xl bg-blue-900/60 border border-blue-400/30 backdrop-blur-xs">
            <span className="font-display font-extrabold text-lg sm:text-xl text-white tabular-nums">
              {formatNumber(timeLeft.secs)}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-blue-200">
              SECS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
