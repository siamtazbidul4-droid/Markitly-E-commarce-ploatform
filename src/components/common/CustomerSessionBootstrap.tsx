import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setUser, selectCurrentUser } from '../../store/slices/authSlice';
import { api } from '../../services/api';
import { getCustomerToken } from '../../services/session';

/**
 * Restores the storefront customer session after a page reload.
 *
 * The session token lives in `sessionStorage`, but Redux state does not survive a
 * refresh. Without this step a signed-in customer was silently downgraded to
 * "Guest" on every reload: order history stopped loading, the account header
 * lost the signed-in marker and checkout lost the prefilled email.
 *
 * The token is validated against `GET /api/v1/auth/me` before it is trusted, and
 * discarded if the server rejects or no longer recognises it.
 */
export const CustomerSessionBootstrap: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);

  useEffect(() => {
    if (currentUser) return;
    if (!getCustomerToken()) return;

    let cancelled = false;

    api
      .getCurrentCustomer()
      .then((user) => {
        if (!cancelled && user) dispatch(setUser(user));
      })
      .catch(() => {
        // Expired or tampered token: drop it so later requests stay anonymous.
        if (cancelled) return;
        try {
          window.sessionStorage.removeItem('marketly_customer_token');
        } catch {
          // Storage unavailable; nothing to clean up.
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser, dispatch]);

  return null;
};