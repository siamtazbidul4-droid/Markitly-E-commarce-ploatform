import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopAnnouncementBar } from './TopAnnouncementBar';
import { Header } from './Header';
import { Footer } from './Footer';
import { BottomMobileNav } from './BottomMobileNav';
import { MobileDrawer } from './MobileDrawer';
import { CartDrawer } from '../cart/CartDrawer';
import { CartFlyAnimation } from '../common/CartFlyAnimation';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Top Banner */}
      <TopAnnouncementBar />

      {/* Main Top Header */}
      <Header />

      {/* Page Body */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Sticky Navigation */}
      <BottomMobileNav />

      {/* Overlays & Drawers
          (toasts, confirmations and admin sign-in are mounted once in App) */}
      <MobileDrawer />
      <CartDrawer />
      <CartFlyAnimation />
    </div>
  );
};