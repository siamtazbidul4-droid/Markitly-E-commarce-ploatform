import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastNotification {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

export interface FlyAnimationData {
  startX: number;
  startY: number;
  image: string;
  timestamp: number;
}

interface UiState {
  isCartDrawerOpen: boolean;
  isMobileMenuOpen: boolean;
  isAdminLoginOpen: boolean;
  isCustomerAuthOpen: boolean;
  searchQuery: string;
  notifications: ToastNotification[];
  flyAnimation: FlyAnimationData | null;
}

const initialState: UiState = {
  isCartDrawerOpen: false,
  isMobileMenuOpen: false,
  isAdminLoginOpen: false,
  isCustomerAuthOpen: false,
  searchQuery: '',
  notifications: [],
  flyAnimation: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openCartDrawer: (state) => {
      state.isCartDrawerOpen = true;
    },
    closeCartDrawer: (state) => {
      state.isCartDrawerOpen = false;
    },
    toggleCartDrawer: (state) => {
      state.isCartDrawerOpen = !state.isCartDrawerOpen;
    },
    openMobileMenu: (state) => {
      state.isMobileMenuOpen = true;
    },
    closeMobileMenu: (state) => {
      state.isMobileMenuOpen = false;
    },
    openAdminLogin: (state) => {
      state.isAdminLoginOpen = true;
    },
    closeAdminLogin: (state) => {
      state.isAdminLoginOpen = false;
    },
    openCustomerAuth: (state) => {
      state.isCustomerAuthOpen = true;
    },
    closeCustomerAuth: (state) => {
      state.isCustomerAuthOpen = false;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    triggerFlyAnimation: (state, action: PayloadAction<FlyAnimationData>) => {
      state.flyAnimation = action.payload;
    },
    clearFlyAnimation: (state) => {
      state.flyAnimation = null;
    },
    addNotification: (state, action: PayloadAction<Omit<ToastNotification, 'id'>>) => {
      const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      // Cap the stack so a burst of events cannot flood the viewport.
      state.notifications = [...state.notifications.slice(-4), { ...action.payload, id }];
    },
    updateNotification: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<Omit<ToastNotification, 'id'>> }>
    ) => {
      const target = state.notifications.find((n) => n.id === action.payload.id);
      if (target) Object.assign(target, action.payload.changes);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
  },
});

export const {
  openCartDrawer,
  closeCartDrawer,
  toggleCartDrawer,
  openMobileMenu,
  closeMobileMenu,
  openAdminLogin,
  closeAdminLogin,
  openCustomerAuth,
  closeCustomerAuth,
  setSearchQuery,
  triggerFlyAnimation,
  clearFlyAnimation,
  addNotification,
  updateNotification,
  removeNotification,
} = uiSlice.actions;

export const selectIsCartDrawerOpen = (state: { ui: UiState }) => state.ui.isCartDrawerOpen;
export const selectIsMobileMenuOpen = (state: { ui: UiState }) => state.ui.isMobileMenuOpen;
export const selectIsAdminLoginOpen = (state: { ui: UiState }) => state.ui.isAdminLoginOpen;
export const selectIsCustomerAuthOpen = (state: { ui: UiState }) => state.ui.isCustomerAuthOpen;
export const selectSearchQuery = (state: { ui: UiState }) => state.ui.searchQuery;
export const selectNotifications = (state: { ui: UiState }) => state.ui.notifications;
/**
 * Notifications ordered newest first.
 *
 * The toast stack is anchored to the bottom of the viewport and rendered
 * top-to-bottom, so storing newest-last and rendering in array order placed the
 * most recent toast *below* every older one. Reversing here makes the newest
 * notification the topmost, highest-priority element while keeping the stored
 * array order stable for timers and dismissal.
 */
export const selectNotificationsNewestFirst = (state: { ui: UiState }) =>
  [...state.ui.notifications].reverse();
export const selectFlyAnimation = (state: { ui: UiState }) => state.ui.flyAnimation;

export default uiSlice.reducer;
