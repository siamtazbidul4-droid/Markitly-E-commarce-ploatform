import { adminSignOut, logout, setUser } from '../slices/authSlice';
import { setAdminToken, setCustomerToken } from '../../services/session';
import type { AppDispatch } from '../index';
import type { User } from '../../types';

/**
 * Session thunks.
 *
 * Redux reducers must stay pure, but sign-out also has to destroy the persisted
 * token. Without clearing `marketly_admin_token` a page refresh would silently
 * restore the administrator session, so every sign-out goes through this module.
 */

export const customerSignIn = (user: User) => (dispatch: AppDispatch): void => {
  dispatch(setUser(user));
};

export const customerSignOut = () => (dispatch: AppDispatch): void => {
  setCustomerToken(null);
  dispatch(logout());
};

export const adminSignOutThunk = () => (dispatch: AppDispatch): void => {
  setAdminToken(null);
  dispatch(adminSignOut());
};