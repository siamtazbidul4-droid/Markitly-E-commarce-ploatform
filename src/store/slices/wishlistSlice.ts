import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WishlistState {
  productIds: string[];
}

const STORAGE_KEY = 'marketly_wishlist';

/**
 * Restores the saved product ids.
 *
 * Entries are product ids, so anything that is not a non-empty string is
 * dropped: a stored `null` (what `JSON.stringify` writes for a missing id) can
 * never match a real product and would otherwise render as a permanently saved
 * item. The previous default of `['1', '3']` seeded ids that do not exist in the
 * catalog, which made the navbar badge report two saved items while the wishlist
 * page showed an empty state.
 */
const loadWishlist = (): string[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return Array.from(
      new Set(parsed.filter((id): id is string => typeof id === 'string' && id.length > 0))
    );
  } catch (e) {
    console.error('Failed to load wishlist', e);
    return [];
  }
};

const persistWishlist = (productIds: string[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(productIds));
  } catch (e) {
    console.error('Failed to save wishlist', e);
  }
};

const initialState: WishlistState = {
  productIds: loadWishlist(),
};

export const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleWishlist: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.productIds.includes(id)) {
        state.productIds = state.productIds.filter((pId) => pId !== id);
      } else {
        state.productIds.push(id);
      }
      persistWishlist(state.productIds);
    },
    removeFromWishlist: (state, action: PayloadAction<string>) => {
      state.productIds = state.productIds.filter((pId) => pId !== action.payload);
      persistWishlist(state.productIds);
    },
    /**
     * Drops ids that no longer resolve to a catalog product, so a removed or
     * renamed product cannot leave the badge and page permanently out of sync.
     */
    retainKnownProducts: (state, action: PayloadAction<string[]>) => {
      const known = new Set(action.payload);
      const next = state.productIds.filter((id) => known.has(id));
      if (next.length !== state.productIds.length) {
        state.productIds = next;
        persistWishlist(next);
      }
    },
  },
});

export const { toggleWishlist, removeFromWishlist, retainKnownProducts } = wishlistSlice.actions;
export const selectWishlistIds = (state: { wishlist: WishlistState }) => state.wishlist.productIds;
export const selectWishlistCount = (state: { wishlist: WishlistState }) => state.wishlist.productIds.length;

export default wishlistSlice.reducer;
