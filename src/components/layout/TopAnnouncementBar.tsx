import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronRight } from 'lucide-react';

export const TopAnnouncementBar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate('/shop?sale=true')}
      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-4 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs select-none"
    >
      <span className="text-sm">🎉</span>
      <span>Mega Summer Sale is Live! Get Up to 60% OFF</span>
      <ChevronRight className="w-3.5 h-3.5 opacity-80" />
    </div>
  );
};
