import React from 'react';
import { CategoryQuickRow } from '../components/home/CategoryQuickRow';
import { HeroBanner } from '../components/home/HeroBanner';
import { FlashDealCard } from '../components/home/FlashDealCard';
import { PopularCategoriesGrid } from '../components/home/PopularCategoriesGrid';
import { FeaturedProductsSection } from '../components/home/FeaturedProductsSection';
import { PromotionalDualBanners } from '../components/home/PromotionalDualBanners';
import { BestSellersSection } from '../components/home/BestSellersSection';
import { TestimonialSection } from '../components/home/TestimonialSection';
import { NewsletterSection } from '../components/home/NewsletterSection';

export const HomePage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-8 sm:space-y-12">
      {/* 1. Quick Category Nav Pill/Card Row */}
      <CategoryQuickRow />

      {/* 2. Hero Banner Card with 3D product render & Perks */}
      <HeroBanner />

      {/* 3. Flash Deal Banner Card with live countdown & special price */}
      <FlashDealCard />

      {/* 4. Popular Categories 2x2 Grid */}
      <PopularCategoriesGrid />

      {/* 5. Featured Products Grid */}
      <FeaturedProductsSection />

      {/* 6. Promotional Dual Banners (Summer Collection & Home Essentials) */}
      <PromotionalDualBanners />

      {/* 7. Best Sellers Grid */}
      <BestSellersSection />

      {/* 8. Customer Testimonial Quote with verified buyer badge */}
      <TestimonialSection />

      {/* 9. Newsletter Subscription Card */}
      <NewsletterSection />
    </div>
  );
};
