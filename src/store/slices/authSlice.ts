import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, BangladeshAddress } from '../../types';

export type AdminAuthStatus = 'idle' | 'verifying' | 'authenticated' | 'unauthenticated';

interface AuthState {
  /** Storefront visitor identity. Never grants administrative access. */
  user: User | null;
  isAuthenticated: boolean;
  savedAddresses: BangladeshAddress[];
  /** Server-verified administrator identity returned by /api/v1/admin/session. */
  adminUser: User | null;
  adminStatus: AdminAuthStatus;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  savedAddresses: [],
  adminUser: null,
  adminStatus: 'idle',
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.savedAddresses = action.payload?.addresses ?? [];
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.savedAddresses = [];
    },
    adminSignOut: (state) => {
      state.adminUser = null;
      state.adminStatus = 'unauthenticated';
    },
    adminSessionVerifying: (state) => {
      state.adminStatus = 'verifying';
    },
    adminAuthenticated: (state, action: PayloadAction<User>) => {
      state.adminUser = action.payload;
      state.adminStatus = 'authenticated';
    },
    adminUnauthenticated: (state) => {
      state.adminUser = null;
      state.adminStatus = 'unauthenticated';
    },
    addAddress: (state, action: PayloadAction<BangladeshAddress>) => {
      state.savedAddresses.push(action.payload);
      if (state.user) {
        state.user.addresses = state.savedAddresses;
      }
    },
  },
});

export const {
  setUser,
  logout,
  adminSignOut,
  adminSessionVerifying,
  adminAuthenticated,
  adminUnauthenticated,
  addAddress,
} = authSlice.actions;

export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAdminUser = (state: { auth: AuthState }) => state.auth.adminUser;
export const selectAdminStatus = (state: { auth: AuthState }) => state.auth.adminStatus;
/** True only for a session that the API has verified with a signed admin token. */
export const selectIsAdmin = (state: { auth: AuthState }) => state.auth.adminStatus === 'authenticated';
export const selectSavedAddresses = (state: { auth: AuthState }) => state.auth.savedAddresses;

export default authSlice.reducer;