import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectWishlistIds, retainKnownProducts } from '../store/slices/wishlistSlice';
import { selectAllProducts, selectCatalogLoaded } from '../store/slices/productSlice';
import { ProductCard } from '../components/shop/ProductCard';
import { Heart, ArrowLeft, Trash2 } from 'lucide-react';

export const WishlistPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const wishlistIds = useAppSelector(selectWishlistIds);
  const products = useAppSelector(selectAllProducts);
  const catalogLoaded = useAppSelector(selectCatalogLoaded);

  // Ids that no longer resolve to a catalog product are dropped, but only once
  // the live catalog has replaced the bundled seed records. Pruning earlier would
  // delete real ids that merely had not been hydrated yet.
  useEffect(() => {
    if (!catalogLoaded) return;
    dispatch(retainKnownProducts(products.map((p) => p.id)));
  }, [catalogLoaded, dispatch, products]);

  const wishlistedProducts = products.filter((p) => wishlistIds.includes(p.id));
  const unavailableCount = wishlistIds.length - wishlistedProducts.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            My Wishlist
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            You have saved <strong className="text-slate-900">{wishlistedProducts.length}</strong> items to purchase later.
          </p>
        </div>
        <Link
          to="/shop"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      {unavailableCount > 0 && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900"
        >
          <Trash2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            {unavailableCount} saved {unavailableCount === 1 ? 'item is' : 'items are'} no longer in the
            catalog and {unavailableCount === 1 ? 'was' : 'were'} removed from your wishlist.
          </span>
        </div>
      )}

      {/* Grid or Empty */}
      {wishlistedProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="font-display font-bold text-xl text-slate-900">Your Wishlist is Empty</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-6">
            Tap the heart icon on any product to save it to your personal luxury curation.
          </p>
          <Link
            to="/shop"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all inline-block"
          >
            Discover Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {wishlistedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};