import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addToCart } from '../../store/slices/cartSlice';
import { toggleWishlist, selectWishlistIds } from '../../store/slices/wishlistSlice';
import { triggerFlyAnimation, addNotification } from '../../store/slices/uiSlice';
import { Product } from '../../types';
import { StarRating } from '../common/StarRating';
import { Heart, ShoppingBag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const wishlistIds = useAppSelector(selectWishlistIds);
  const isWishlisted = wishlistIds.includes(product.id);

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    // Capture button/card coordinates for Add-to-Cart Flight Animation
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    // Pick first variant or base product
    const defaultVariant = product.variants?.[0];

    dispatch(
      addToCart({
        id: `${product.id}-${defaultVariant?.id || 'default'}`,
        productId: product.id,
        variantId: defaultVariant?.id,
        name: product.name,
        sku: defaultVariant?.sku || product.sku,
        price: defaultVariant?.price || product.price,
        compareAtPrice: defaultVariant?.compareAtPrice || product.compareAtPrice,
        quantity: 1,
        image: product.mainImage,
        selectedAttributes: defaultVariant?.attributes,
        maxStock: defaultVariant?.inventory || product.inventory,
      })
    );

    // Trigger Fly Animation towards header cart icon
    dispatch(
      triggerFlyAnimation({
        startX,
        startY,
        image: product.mainImage,
        timestamp: Date.now(),
      })
    );

    // Show custom toast notification
    dispatch(
      addNotification({
        type: 'success',
        title: 'Added to Cart',
        message: `${product.name} is now in your cart.`,
        duration: 2500,
      })
    );
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleWishlist(product.id));
    dispatch(
      addNotification({
        type: 'info',
        title: isWishlisted ? 'Removed from Wishlist' : 'Added to Wishlist',
        message: `${product.name} ${isWishlisted ? 'removed from' : 'saved to'} your wishlist.`,
        duration: 2000,
      })
    );
  };

  return (
    <div
      onClick={() => navigate(`/product/${product.slug}`)}
      className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs hover:shadow-lg hover:border-blue-600/40 hover:-translate-y-1 transition-all duration-200 cursor-pointer"
    >
      {/* Top Card Badges & Wishlist Action */}
      <div className="flex items-center justify-between z-10">
        {product.discountPercent ? (
          <span className="px-2 py-0.5 bg-rose-500 text-white text-[11px] font-bold rounded-md shadow-2xs">
            -{product.discountPercent}%
          </span>
        ) : (
          <span />
        )}

        <button
          onClick={handleToggleWishlist}
          className={`p-1.5 rounded-full transition-colors ${
            isWishlisted
              ? 'bg-rose-50 text-rose-500'
              : 'text-slate-400 hover:text-rose-500 hover:bg-slate-50'
          }`}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500' : 'stroke-[2]'}`}
          />
        </button>
      </div>

      {/* Main Image Frame */}
      <div className="relative aspect-square w-full rounded-xl bg-slate-50/80 my-2 overflow-hidden flex items-center justify-center p-3">
        <img
          src={product.mainImage}
          alt={product.name}
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Content Details */}
      <div className="flex-1 flex flex-col justify-between pt-1">
        <div>
          <h3 className="font-sans font-semibold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {/* Star Rating */}
          <div className="mt-1.5">
            <StarRating
              rating={product.rating}
              size="sm"
              reviewCount={product.reviewCount}
            />
          </div>
        </div>

        {/* Pricing and Add to Cart Action */}
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-extrabold text-sm sm:text-base text-slate-900 tabular-nums">
              ${product.price.toFixed(2)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-slate-400 line-through tabular-nums">
                ${product.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            className="p-2 sm:px-2.5 sm:py-2 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl transition-all shadow-2xs group/btn cursor-pointer flex items-center justify-center"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
