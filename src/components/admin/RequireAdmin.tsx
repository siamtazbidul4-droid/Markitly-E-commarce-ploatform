import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  adminAuthenticated,
  adminSessionVerifying,
  adminUnauthenticated,
  selectAdminStatus,
} from '../../store/slices/authSlice';
import { openAdminLogin } from '../../store/slices/uiSlice';
import { api } from '../../services/api';
import { getAdminToken, setAdminToken } from '../../services/session';
import { ShieldCheck, Loader2 } from 'lucide-react';

const SPLASH_LINKS = [
  { label: 'Catalog', to: '/admin/products' },
  { label: 'Orders', to: '/admin/orders' },
  { label: 'Inventory', to: '/admin/inventory' },
  { label: 'Banners', to: '/admin/banners' },
];

/**
 * Session bootstrap + route guard for the entire /admin module.
 *
 * - On first render an existing token is re-validated against
 *   GET /api/v1/admin/session so a page refresh keeps the session but an
 *   expired or tampered token is discarded server-side.
 * - Unauthenticated visitors never receive the admin shell; the sign-in overlay
 *   is opened instead. Admin API calls remain protected independently by the
 *   server middleware.
 *
 * The verification deliberately runs exactly once per mount. It used to depend
 * on `adminStatus`, but dispatching `adminSessionVerifying()` changed that
 * dependency, which tore the effect down and set its `cancelled` flag - so the
 * in-flight `/admin/session` response was discarded and the console stayed on
 * "Restoring your admin session" forever after any refresh or direct visit to an
 * /admin URL, even with a valid token.
 */
export const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const adminStatus = useAppSelector(selectAdminStatus);

  const statusRef = useRef(adminStatus);
  statusRef.current = adminStatus;
  const verificationStartedRef = useRef(false);

  useEffect(() => {
    if (verificationStartedRef.current) return;
    if (statusRef.current !== 'idle') return;
    verificationStartedRef.current = true;

    const token = getAdminToken();
    if (!token) {
      dispatch(adminUnauthenticated());
      return;
    }

    dispatch(adminSessionVerifying());

    let active = true;
    api
      .getAdminSession()
      .then((user) => {
        if (active) dispatch(adminAuthenticated(user));
      })
      .catch(() => {
        if (!active) return;
        setAdminToken(null);
        dispatch(adminUnauthenticated());
      });

    return () => {
      active = false;
    };
  }, [dispatch]);

  const blocked = adminStatus !== 'authenticated';

  // Direct navigation to an /admin URL surfaces the overlay on arrival, but only
  // after session restoration has settled. Opening it during `idle` would flash the
  // sign-in dialog over a refresh that still holds a valid token.
  useEffect(() => {
    if (adminStatus === 'unauthenticated') {
      dispatch(openAdminLogin());
    }
  }, [adminStatus, dispatch, location.pathname]);

  if (blocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-5 py-10 text-center gap-6">
        <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center ring-1 ring-white/15">
          <ShieldCheck className="w-6 h-6" aria-hidden="true" />
        </div>

        <div className="max-w-md space-y-2">
          <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">
            {adminStatus === 'verifying' ? 'Restoring your admin session' : 'Administrator access required'}
          </h1>
          <p className="text-sm text-slate-400">
            {adminStatus === 'verifying'
              ? 'One moment while we validate your saved session.'
              : 'Sign in with your administrator credentials to open the Marketly control center.'}
          </p>
        </div>

        {adminStatus === 'verifying' ? (
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" aria-label="Verifying session" />
        ) : (
          <div className="flex flex-col items-center gap-4 w-full max-w-sm">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {SPLASH_LINKS.map((link) => (
                <span
                  key={link.label}
                  className="px-2.5 py-1 rounded-full bg-white/5 ring-1 ring-white/10 text-[11px] font-semibold text-slate-400"
                >
                  {link.label}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              Protected area · session token required for every admin API request
            </p>
          </div>
        )}
      </div>
    );
  }

  return <React.Fragment>{children}</React.Fragment>;
};