import React, { useState } from 'react';
import { CheckCircle2, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Emily Johnson',
    role: 'Verified Buyer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    quote: '"Great products, fast delivery, and excellent customer service. Marketly is my go-to shopping destination!"',
  },
  {
    id: 2,
    name: 'Tanvir Ahmed',
    role: 'Verified Buyer · Dhaka',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    quote: '"The Smart Watch Ultra arrived in Dhaka in less than 24 hours. Genuine warranty, pristine packaging, seamless checkout with bKash."',
  },
  {
    id: 3,
    name: 'Sarah Miller',
    role: 'Verified Buyer · Chittagong',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    quote: '"MacBook Air was packed securely with original manufacturer seals. Their concierge team is responsive and polite."',
  },
];

export const TestimonialSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const current = testimonials[activeIndex];

  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
        {/* Avatar */}
        <div className="relative shrink-0">
          <img
            src={current.avatar}
            alt={current.name}
            className="w-14 h-14 rounded-full object-cover border-2 border-blue-600/30"
            referrerPolicy="no-referrer"
          />
          <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-0.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-1.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <h4 className="font-bold text-sm text-slate-900">{current.name}</h4>
            <span className="text-xs text-blue-600 font-medium">{current.role}</span>
          </div>
          <p className="text-sm text-slate-600 italic leading-relaxed max-w-2xl">
            {current.quote}
          </p>
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex items-center justify-center gap-1.5 mt-4 pt-2">
        {testimonials.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={`h-2 rounded-full transition-all cursor-pointer ${
              idx === activeIndex ? 'w-6 bg-blue-600' : 'w-2 bg-slate-200 hover:bg-slate-300'
            }`}
            aria-label={`Go to testimonial ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
