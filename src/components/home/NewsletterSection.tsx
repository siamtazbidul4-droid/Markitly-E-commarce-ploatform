import React, { useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { addNotification } from '../../store/slices/uiSlice';
import { Mail, CheckCircle } from 'lucide-react';

export const NewsletterSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      dispatch(
        addNotification({
          type: 'warning',
          title: 'Invalid Email',
          message: 'Please provide a valid email address to subscribe.',
          duration: 3000,
        })
      );
      return;
    }

    setSubscribed(true);
    dispatch(
      addNotification({
        type: 'success',
        title: 'Subscribed Successfully!',
        message: 'You have been enrolled in Marketly exclusive promotions & seasonal drops.',
        duration: 4000,
      })
    );
  };

  return (
    <div className="rounded-2xl bg-gradient-to-r from-blue-50/90 via-sky-50 to-indigo-50/80 border border-blue-100 p-6 sm:p-8">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Left Side: Icon & Copy */}
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base sm:text-lg text-slate-900">
              Get Exclusive Offers & Updates
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Join our newsletter and save more on your favorite products.
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-auto min-w-[320px] max-w-md">
          {subscribed ? (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Thank you! Check your inbox for your 10% welcome coupon.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all shrink-0 cursor-pointer"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
