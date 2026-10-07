import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog } from '../common/Dialog';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectIsAdminLoginOpen,
  closeAdminLogin,
  addNotification,
} from '../../store/slices/uiSlice';
import { adminAuthenticated } from '../../store/slices/authSlice';
import { api, ApiError } from '../../services/api';
import { setAdminToken } from '../../services/session';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

/**
 * Administrator authentication overlay.
 *
 * Opened from the storefront "Admin" entry point. Credentials are posted to
 * POST /api/v1/admin/login and verified server-side against ADMIN_EMAIL /
 * ADMIN_PASSWORD; the browser only ever holds the returned session token.
 */
export const AdminLoginDialog: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isOpen = useAppSelector(selectIsAdminLoginOpen);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSubmitting(false);
    } else {
      setPassword('');
      setShowPassword(false);
      setError(null);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (submitting) return;
    dispatch(closeAdminLogin());
  }, [dispatch, submitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!email.trim()) {
      setError('Enter the administrator email address.');
      emailRef.current?.focus();
      return;
    }
    if (!password) {
      setError('Enter the administrator password.');
      passwordRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { token, user } = await api.adminLogin(email.trim(), password);
      setAdminToken(token);
      dispatch(adminAuthenticated(user));
      dispatch(closeAdminLogin());
      setEmail('');
      setPassword('');
      dispatch(
        addNotification({
          type: 'success',
          title: 'Admin Session Started',
          message: 'You are signed in to the Marketly control center.',
          duration: 3000,
        })
      );
      navigate('/admin/dashboard');
    } catch (err) {
      const apiError = err as ApiError;
      const isAuthFailure = apiError instanceof ApiError && apiError.status === 401;
      // Deliberately identical messaging for an unknown email and a bad password.
      setError(
        isAuthFailure
          ? 'Invalid administrator credentials.'
          : apiError?.message || 'Administrator sign-in is unavailable right now. Please try again.'
      );
      setPassword('');
      passwordRef.current?.focus();
      dispatch(
        addNotification({
          type: 'error',
          title: 'Sign-in Failed',
          message: isAuthFailure
            ? 'Invalid administrator credentials.'
            : 'Could not reach the authentication service. Please try again.',
          duration: 4000,
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      dismissible={!submitting}
      maxWidth="md"
      labelledBy="admin-login-title"
    >
      <div className="space-y-5">
        {/* Header block */}
        <div className="flex items-start gap-3.5">
          <span
            className="w-11 h-11 shrink-0 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20"
            aria-hidden="true"
          >
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h2
              id="admin-login-title"
              className="font-display text-xl font-extrabold text-slate-900 tracking-tight"
            >
              Administrator Sign In
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Authenticate with your control center credentials to manage the catalog, inventory and
              orders.
            </p>
          </div>
        </div>

        {error && (
          <div
            id="admin-login-error"
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="admin-email"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Email address
            </label>
            <div className="relative">
              <Mail
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                ref={emailRef}
                id="admin-email"
                name="email"
                type="email"
                autoComplete="username"
                required
                disabled={submitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@marketly.com"
                className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 transition-colors focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15 disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                ref={passwordRef}
                id="admin-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                disabled={submitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                aria-describedby={error ? 'admin-login-error' : undefined}
                className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 transition-colors focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={submitting}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            <p className="text-[11px] leading-relaxed text-slate-400">
              Credentials are verified on the server and never stored in your browser.
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-lg shadow-slate-900/20 transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Verifying…</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Dialog>
  );
};