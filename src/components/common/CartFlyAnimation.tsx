import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearFlyAnimation, selectFlyAnimation } from '../../store/slices/uiSlice';

export const CartFlyAnimation: React.FC = () => {
  const dispatch = useAppDispatch();
  const flyData = useAppSelector(selectFlyAnimation);
  const [animating, setAnimating] = useState(false);
  const [coords, setCoords] = useState<{ startX: number; startY: number; targetX: number; targetY: number } | null>(null);

  useEffect(() => {
    if (!flyData) return;

    // Locate the cart icon in header
    const cartIconElement = document.getElementById('navbar-cart-button');
    let targetX = window.innerWidth - 60;
    let targetY = 30;

    if (cartIconElement) {
      const rect = cartIconElement.getBoundingClientRect();
      targetX = rect.left + rect.width / 2;
      targetY = rect.top + rect.height / 2;
    }

    setCoords({
      startX: flyData.startX,
      startY: flyData.startY,
      targetX,
      targetY,
    });
    setAnimating(true);

    const timer = setTimeout(() => {
      setAnimating(false);
      dispatch(clearFlyAnimation());

      // Pulse the cart icon badge
      if (cartIconElement) {
        cartIconElement.classList.add('scale-125');
        setTimeout(() => {
          cartIconElement.classList.remove('scale-125');
        }, 250);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [flyData, dispatch]);

  if (!animating || !coords || !flyData) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: `${coords.startX}px`,
        top: `${coords.startY}px`,
        zIndex: 9999,
        pointerEvents: 'none',
        transform: 'translate(-50%, -50%)',
        animation: 'cartFlyKeyframes 600ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
      }}
    >
      <style>{`
        @keyframes cartFlyKeyframes {
          0% {
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(${ (coords.targetX - coords.startX) * 0.4 }px, ${ (coords.targetY - coords.startY) * 0.4 - 50 }px) scale(0.7) rotate(-10deg);
            opacity: 0.9;
          }
          100% {
            transform: translate(${ coords.targetX - coords.startX }px, ${ coords.targetY - coords.startY }px) scale(0.2) rotate(15deg);
            opacity: 0.1;
          }
        }
      `}</style>
      <div className="w-14 h-14 rounded-xl overflow-hidden shadow-2xl border-2 border-blue-600 bg-white p-1">
        <img
          src={flyData.image}
          alt="Adding item"
          className="w-full h-full object-cover rounded-lg"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};
