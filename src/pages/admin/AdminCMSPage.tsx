import React, { useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { addNotification } from '../../store/slices/uiSlice';
import { AlertTriangle, Save } from 'lucide-react';

export const AdminCMSPage: React.FC = () => {
  const dispatch = useAppDispatch();

  const [announcementText, setAnnouncementText] = useState('🎉 Mega Summer Sale is Live! Get Up to 60% OFF');
  const [heroTagline, setHeroTagline] = useState('PREMIUM QUALITY, PREMIUM YOU.');
  const [heroHeading, setHeroHeading] = useState('Everything You Need, All in One Place');
  const [heroSubtext, setHeroSubtext] = useState(
    'Discover millions of products from top brands and trusted sellers. Best prices, premium quality & unbeatable service.'
  );

  const handleSaveCMS = (e: React.FormEvent) => {
    e.preventDefault();
    // There is no CMS endpoint and no storefront section that reads these values,
    // so this previously reported "synced with MongoDB" after doing nothing.
    // Reporting the real outcome keeps the operator from assuming the live
    // storefront changed when it did not.
    dispatch(
      addNotification({
        type: 'warning',
        title: 'Not Saved',
        message:
          'No CMS endpoint exists yet, so these headlines were not persisted and the live storefront is unchanged.',
        duration: 5000,
      })
    );
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
          Homepage CMS & Storefront Editorial
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Edit global promotional headlines, top announcement tickers, and customer value propositions.
        </p>
      </div>

      <div
        role="status"
        className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900"
      >
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
        <p className="text-xs sm:text-sm leading-relaxed">
          <strong className="font-semibold">Draft editor — nothing is persisted.</strong> These fields are not
          wired to the storefront yet, and there is no CMS API behind this page. Saving here does not change the
          live site.
        </p>
      </div>

      <form onSubmit={handleSaveCMS} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <label htmlFor="cms-announcement" className="block text-xs font-semibold text-slate-700 mb-1">
            Top Announcement Bar Ticker *
          </label>
          <input
            id="cms-announcement"
            type="text"
            required
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cms-tagline" className="block text-xs font-semibold text-slate-700 mb-1">
              Hero Amber Tagline
            </label>
            <input
              id="cms-tagline"
              type="text"
              value={heroTagline}
              onChange={(e) => setHeroTagline(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label htmlFor="cms-heading" className="block text-xs font-semibold text-slate-700 mb-1">
              Hero Primary Headline
            </label>
            <input
              id="cms-heading"
              type="text"
              value={heroHeading}
              onChange={(e) => setHeroHeading(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div>
          <label htmlFor="cms-subtext" className="block text-xs font-semibold text-slate-700 mb-1">
            Hero Value Proposition Body Text
          </label>
          <textarea
            id="cms-subtext"
            rows={3}
            value={heroSubtext}
            onChange={(e) => setHeroSubtext(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Check Draft Editorial</span>
          </button>
        </div>
      </form>
    </div>
  );
};
