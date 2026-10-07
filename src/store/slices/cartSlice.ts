import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { CartItem } from '../../types';

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  discountAmount: number;
  shippingThreshold: number;
  baseShippingFee: number;
}

// Load initial cart from localStorage for persistence if available
const loadInitialCart = (): CartItem[] => {
  try {
    const saved = localStorage.getItem('marketly_cart');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load cart from storage', e);
  }
  return [];
};

const initialState: CartState = {
  items: loadInitialCart(),
  couponCode: null,
  discountAmount: 0,
  shippingThreshold: 49,
  baseShippingFee: 4.99,
};

const saveCart = (items: CartItem[]) => {
  try {
    localStorage.setItem('marketly_cart', JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save cart to storage', e);
  }
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingIndex = state.items.findIndex((item) => item.id === action.payload.id);
      if (existingIndex > -1) {
        // Increment quantity up to maxStock
        const newQty = state.items[existingIndex].quantity + action.payload.quantity;
        state.items[existingIndex].quantity = Math.min(newQty, action.payload.maxStock);
      } else {
        // Add new unique cart line
        state.items.push(action.payload);
      }
      saveCart(state.items);
    },
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter((i) => i.id !== action.payload.id);
        } else {
          item.quantity = Math.min(action.payload.quantity, item.maxStock);
        }
        saveCart(state.items);
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      saveCart(state.items);
    },
    clearCart: (state) => {
      state.items = [];
      state.couponCode = null;
      state.discountAmount = 0;
      saveCart(state.items);
    },
    applyCoupon: (state, action: PayloadAction<{ code: string; discount: number }>) => {
      state.couponCode = action.payload.code;
      state.discountAmount = action.payload.discount;
    },
    removeCoupon: (state) => {
      state.couponCode = null;
      state.discountAmount = 0;
    },
    mergeCart: (state, action: PayloadAction<CartItem[]>) => {
      // Deterministic merge when user logs in
      action.payload.forEach((incomingItem) => {
        const existing = state.items.find((i) => i.id === incomingItem.id);
        if (existing) {
          existing.quantity = Math.min(existing.quantity + incomingItem.quantity, existing.maxStock);
        } else {
          state.items.push(incomingItem);
        }
      });
      saveCart(state.items);
    },
  },
});

export const {
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
  mergeCart,
} = cartSlice.actions;

// Authoritative root state interface helper
interface RootStateLike {
  cart: CartState;
}

// CRITICAL BUSINESS RULE REQUIREMENT:
// The navbar cart badge MUST NOT display total quantity.
// It must display NUMBER OF UNIQUE CART LINES.
// If Product A has quantity 10, the navbar badge is 1.
export const selectCartItems = (state: RootStateLike) => state.cart.items;

export const selectUniqueCartLinesCount = createSelector(
  [selectCartItems],
  (items) => items.length
);

export const selectCartTotalQuantity = createSelector(
  [selectCartItems],
  (items) => items.reduce((sum, item) => sum + item.quantity, 0)
);

export const selectCartSubtotal = createSelector(
  [selectCartItems],
  (items) => items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

export const selectCartShippingFee = createSelector(
  [selectCartSubtotal, (state: RootStateLike) => state.cart.shippingThreshold, (state: RootStateLike) => state.cart.baseShippingFee],
  (subtotal, threshold, fee) => (subtotal >= threshold || subtotal === 0 ? 0 : fee)
);

export const selectCartTotal = createSelector(
  [selectCartSubtotal, selectCartShippingFee, (state: RootStateLike) => state.cart.discountAmount],
  (subtotal, shipping, discount) => Math.max(0, subtotal + shipping - discount)
);

export default cartSlice.reducer;
