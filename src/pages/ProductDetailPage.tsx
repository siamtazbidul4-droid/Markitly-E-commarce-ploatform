import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectAllProducts, selectReviews, addReview } from '../store/slices/productSlice';
import { addToCart } from '../store/slices/cartSlice';
import { toggleWishlist, selectWishlistIds } from '../store/slices/wishlistSlice';
import { triggerFlyAnimation, addNotification } from '../store/slices/uiSlice';
import { selectCurrentUser } from '../store/slices/authSlice';
import { StarRating } from '../components/common/StarRating';
import { ProductCard } from '../components/shop/ProductCard';
import {
  Heart,
  ShoppingBag,
  Zap,
  ShieldCheck,
  Truck,
  RefreshCw,
  Plus,
  Minus,
  CheckCircle2,
  Share2,
  ChevronRight,
  Package,
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const products = useAppSelector(selectAllProducts);
  const allReviews = useAppSelector(selectReviews);
  const wishlistIds = useAppSelector(selectWishlistIds);
  const currentUser = useAppSelector(selectCurrentUser);

  const product = products.find((p) => p.slug === slug || p.id === slug);

  // States
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'care' | 'shipping' | 'reviews'>('specs');

  // Review submission state
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');

  useEffect(() => {
    if (product) {
      setSelectedImage(product.mainImage);
      if (product.variants && product.variants.length > 0) {
        setSelectedVariantId(product.variants[0].id);
      }
      setQuantity(1);
      window.scrollTo(0, 0);
    }
  }, [product]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Product Not Found</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          The requested product may have been archived or moved.
        </p>
        <Link
          to="/shop"
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
        >
          Back to Catalog
        </Link>
      </div>
    );
  }

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
  const isWishlisted = wishlistIds.includes(product.id);
  const currentReviews = allReviews[product.id] || [];

  const effectivePrice = selectedVariant?.price || product.price;
  const effectiveCompareAt = selectedVariant?.compareAtPrice || product.compareAtPrice;
  const currentStock = selectedVariant?.inventory ?? product.inventory;

  // Add to Cart handler with Cart Fly animation
  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    dispatch(
      addToCart({
        id: `${product.id}-${selectedVariant?.id || 'default'}`,
        productId: product.id,
        variantId: selectedVariant?.id,
        name: product.name,
        sku: selectedVariant?.sku || product.sku,
        price: effectivePrice,
        compareAtPrice: effectiveCompareAt,
        quantity,
        image: product.mainImage,
        selectedAttributes: selectedVariant?.attributes,
        maxStock: currentStock,
      })
    );

    dispatch(
      triggerFlyAnimation({
        startX,
        startY,
        image: product.mainImage,
        timestamp: Date.now(),
      })
    );

    dispatch(
      addNotification({
        type: 'success',
        title: 'Added to Cart',
        message: `${quantity} × ${product.name} added to cart.`,
        duration: 3000,
      })
    );
  };

  const handleBuyNow = (e: React.MouseEvent<HTMLButtonElement>) => {
    handleAddToCart(e);
    navigate('/checkout');
  };

  const handleToggleWishlist = () => {
    dispatch(toggleWishlist(product.id));
    dispatch(
      addNotification({
        type: 'info',
        title: isWishlisted ? 'Removed from Wishlist' : 'Saved to Wishlist',
        message: `${product.name} ${isWishlisted ? 'removed from' : 'saved to'} your wishlist.`,
        duration: 2000,
      })
    );
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    dispatch(
      addReview({
        id: 'rev_' + Date.now(),
        productId: product.id,
        userId: currentUser?.id || 'usr_guest',
        userName: currentUser?.name || 'Verified Customer',
        rating: reviewRating,
        comment: reviewComment.trim(),
        isVerifiedPurchase: true,
        createdAt: new Date().toISOString(),
      })
    );

    setReviewComment('');
    dispatch(
      addNotification({
        type: 'success',
        title: 'Review Published',
        message: 'Thank you for your valuable feedback!',
        duration: 3000,
      })
    );
  };

  // Related products algorithm: Subcategory -> Category -> Brand -> Fallback
  const relatedProducts = products
    .filter((p) => p.id !== product.id)
    .sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      if (a.category === product.category) scoreA += 5;
      if (b.category === product.category) scoreB += 5;
      if (a.brand === product.brand) scoreA += 3;
      if (b.brand === product.brand) scoreB += 3;
      return scoreB - scoreA;
    })
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 overflow-x-auto pb-1">
        <Link to="/" className="hover:text-blue-600 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
        <Link to="/shop" className="hover:text-blue-600 transition-colors">
          Shop
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
        <Link
          to={`/shop?category=${encodeURIComponent(product.category)}`}
          className="hover:text-blue-600 transition-colors"
        >
          {product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
        <span className="text-slate-900 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main PDP Grid: Gallery Left, Purchase Module Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Gallery Column (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Selected Image Showcase */}
          <div className="relative aspect-square w-full rounded-3xl bg-white border border-slate-200/80 p-6 flex items-center justify-center overflow-hidden shadow-xs">
            {product.discountPercent && (
              <span className="absolute top-4 left-4 z-10 px-2.5 py-1 bg-rose-500 text-white text-xs font-bold rounded-lg shadow-sm">
                -{product.discountPercent}% OFF
              </span>
            )}
            <button
              onClick={handleToggleWishlist}
              className={`absolute top-4 right-4 z-10 p-2.5 rounded-full transition-colors ${
                isWishlisted
                  ? 'bg-rose-50 text-rose-500'
                  : 'bg-white/80 hover:bg-white text-slate-500 hover:text-rose-500 shadow-xs'
              }`}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
            </button>
            <img
              src={selectedImage || product.mainImage}
              alt={product.name}
              className="w-full h-full object-contain max-h-[480px] transition-transform duration-300 hover:scale-105"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Thumbnails Row */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {[product.mainImage, ...product.galleryImages].map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(img)}
                className={`w-20 h-20 rounded-2xl bg-white border-2 p-1.5 shrink-0 transition-all cursor-pointer ${
                  selectedImage === img
                    ? 'border-blue-600 shadow-md scale-102'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <img
                  src={img}
                  alt={`${product.name} thumbnail ${i + 1}`}
                  className="w-full h-full object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Purchase Module Column (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
          {/* Brand & Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                {product.brand}
              </span>
              <span className="text-xs text-slate-400 font-mono">SKU: {selectedVariant?.sku || product.sku}</span>
            </div>

            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Ratings */}
            <div className="flex items-center gap-2 pt-1">
              <StarRating
                rating={product.rating}
                size="md"
                showText
                reviewCount={product.reviewCount}
              />
              <span className="text-slate-300">·</span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Authentic
              </span>
            </div>
          </div>

          {/* Pricing */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-baseline gap-3">
            <span className="font-display font-black text-3xl text-slate-900 tabular-nums">
              ${effectivePrice.toFixed(2)}
            </span>
            {effectiveCompareAt && effectiveCompareAt > effectivePrice && (
              <>
                <span className="text-base text-slate-400 line-through tabular-nums">
                  ${effectiveCompareAt.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                  Save ${(effectiveCompareAt - effectivePrice).toFixed(2)}
                </span>
              </>
            )}
          </div>

          {/* Short Description */}
          <p className="text-sm text-slate-600 leading-relaxed">
            {product.shortDescription}
          </p>

          {/* Variants Selector if available */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Select Option
                </span>
                <span className="text-xs text-slate-500">
                  {selectedVariant?.name}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const isSelected = v.id === selectedVariantId;
                  const isOutOfStock = v.inventory <= 0;
                  return (
                    <button
                      key={v.id}
                      onClick={() => !isOutOfStock && setSelectedVariantId(v.id)}
                      disabled={isOutOfStock}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                          : isOutOfStock
                          ? 'border-slate-200 bg-slate-100 text-slate-400 line-through cursor-not-allowed'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      {v.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity and Actions */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Quantity
              </span>
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2 text-slate-600 hover:bg-white transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 text-sm font-bold text-slate-900 tabular-nums">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                  className="p-2 text-slate-600 hover:bg-white transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={currentStock <= 0}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{currentStock > 0 ? 'Add to Cart' : 'Out of Stock'}</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={currentStock <= 0}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Buy Now</span>
              </button>
            </div>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-600">
            <div className="p-2 rounded-xl bg-slate-50 flex flex-col items-center gap-1">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>Free Delivery Over $49</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 flex flex-col items-center gap-1">
              <RefreshCw className="w-4 h-4 text-amber-600" />
              <span>30-Day Easy Returns</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 flex flex-col items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Official Warranty</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section: Specifications, Materials & Care, Shipping Policy, Real Reviews */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        {/* Tabs Bar */}
        <div className="flex items-center gap-4 sm:gap-8 border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-3.5 text-sm font-bold tracking-tight transition-colors border-b-2 cursor-pointer ${
              activeTab === 'specs'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Specifications
          </button>
          <button
            onClick={() => setActiveTab('care')}
            className={`pb-3.5 text-sm font-bold tracking-tight transition-colors border-b-2 cursor-pointer ${
              activeTab === 'care'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Materials & Care
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`pb-3.5 text-sm font-bold tracking-tight transition-colors border-b-2 cursor-pointer ${
              activeTab === 'shipping'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Shipping & Returns
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3.5 text-sm font-bold tracking-tight transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Customer Reviews</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
              {currentReviews.length}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="py-6">
          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(product.specifications || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between py-2 border-b border-slate-100 text-sm">
                  <span className="font-medium text-slate-500">{key}</span>
                  <span className="font-semibold text-slate-900">{value}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'care' && (
            <div className="space-y-4 max-w-2xl text-sm text-slate-600">
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Materials</h4>
                <p>{product.materials || 'Crafted with premium materials selected for durability and luxury hand-feel.'}</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Care & Maintenance</h4>
                <p>{product.careInstructions || 'Follow standard gentle cleaning guidelines. Keep away from extreme temperatures and moisture.'}</p>
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-4 max-w-2xl text-sm text-slate-600">
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Bangladesh Delivery Coverage</h4>
                <p>Express courier dispatch to Dhaka (24-48 hours) and all divisions including Chittagong, Sylhet, Rajshahi, Khulna, Barisal, Rangpur, and Mymensingh.</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Hassle-Free Return Policy</h4>
                <p>{product.returnPolicy || '30-day inspection period. Items must be in original condition with intact security tags.'}</p>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8">
              {/* Write a Review Form */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 className="text-sm font-bold text-slate-900 mb-3">Write a Customer Review</h4>
                <form onSubmit={handleReviewSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Your Rating
                    </label>
                    <StarRating
                      rating={reviewRating}
                      size="md"
                      interactive
                      onRatingChange={(r) => setReviewRating(r)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Your Review Comment
                    </label>
                    <textarea
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience regarding comfort, quality, and fit..."
                      required
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Submit Review
                  </button>
                </form>
              </div>

              {/* Reviews List */}
              <div className="space-y-4 divide-y divide-slate-100">
                {currentReviews.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">
                    Be the first verified customer to review this product!
                  </p>
                ) : (
                  currentReviews.map((rev) => (
                    <div key={rev.id} className="pt-4 first:pt-0 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{rev.userName}</span>
                          {rev.isVerifiedPurchase && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <StarRating rating={rev.rating} size="sm" />
                      <p className="text-xs sm:text-sm text-slate-600 pt-1 leading-relaxed">
                        {rev.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Meaningful Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 tracking-tight">
              Related Curations
            </h2>
            <Link
              to={`/shop?category=${encodeURIComponent(product.category)}`}
              className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View More
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
