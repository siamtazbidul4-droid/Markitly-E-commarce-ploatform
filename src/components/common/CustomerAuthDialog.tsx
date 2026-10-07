import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog } from '../common/Dialog';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectIsCustomerAuthOpen,
  closeCustomerAuth,
  addNotification,
} from '../../store/slices/uiSlice';
import { customerSignIn } from '../../store/thunks/authThunks';
import { api, ApiError } from '../../services/api';
import { setCustomerToken } from '../../services/session';
import { User, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

type AuthMode = 'signin' | 'signup';

/**
 * Storefront customer authentication overlay.
 *
 * Replaces the previous one-click "demo customer" shortcut: the identity is now
 * issued by POST /api/v1/auth/login or /v1/auth/register, so the account page
 * shows a real, server-recognised customer instead of a fabricated record.
 */
export const CustomerAuthDialog: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectIsCustomerAuthOpen);

  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
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
      setPhone('');
      setShowPassword(false);
      setError(null);
      setMode('signin');
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (submitting) return;
    dispatch(closeCustomerAuth());
  }, [dispatch, submitting]);

  const switchMode = (next: AuthMode) => {
    if (submitting) return;
    setMode(next);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (mode === 'signup' && !name.trim()) {
      setError('Enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Enter your email address.');
      emailRef.current?.focus();
      return;
    }
    if (!password) {
      setError('Enter your password.');
      passwordRef.current?.focus();
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Choose a password of at least 6 characters.');
      passwordRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result =
        mode === 'signup'
          ? await api.customerRegister({
              name: name.trim(),
              email: email.trim(),
              password,
              phone: phone.trim() || undefined,
            })
          : await api.customerLogin(email.trim(), password);

      setCustomerToken(result.token);
      dispatch(customerSignIn(result.user));
      dispatch(closeCustomerAuth());
      setPassword('');
      setName('');
      setPhone('');
      dispatch(
        addNotification({
          type: 'success',
          title: mode === 'signup' ? 'Account Created' : 'Signed In',
          message: `Welcome, ${result.user.name}.`,
          duration: 3000,
        })
      );
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Sign-in is unavailable right now. Please try again.';
      setError(message);
      setPassword('');
      passwordRef.current?.focus();
      dispatch(
        addNotification({
          type: 'error',
          title: mode === 'signup' ? 'Registration Failed' : 'Sign-in Failed',
          message,
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
      labelledBy="customer-auth-title"
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3.5">
          <span
            className="w-11 h-11 shrink-0 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20"
            aria-hidden="true"
          >
            <User className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h2
              id="customer-auth-title"
              className="font-display text-xl font-extrabold text-slate-900 tracking-tight"
            >
              {mode === 'signup' ? 'Create Your Account' : 'Customer Sign In'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'signup'
                ? 'Register to track orders, save delivery addresses and check out faster.'
                : 'Sign in to review order history and your saved Bangladesh delivery addresses.'}
            </p>
          </div>
        </div>

        {error && (
          <div
            id="customer-auth-error"
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {mode === 'signup' && (
            <div>
              <label
                htmlFor="customer-name"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Full name
              </label>
              <input
                id="customer-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                disabled={submitting}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 transition-colors focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15 disabled:opacity-60"
              />
            </div>
          )}

          <div>
            <label htmlFor="customer-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Mail
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                ref={emailRef}
                id="customer-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={submitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 transition-colors focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15 disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="customer-password"
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
                id="customer-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
                disabled={submitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                aria-describedby={error ? 'customer-auth-error' : undefined}
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

          {mode === 'signup' && (
            <div>
              <label htmlFor="customer-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mobile number <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="customer-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                disabled={submitting}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880 1XXX-XXXXXX"
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 transition-colors focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/15 disabled:opacity-60"
              />
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
              disabled={submitting}
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 hover:underline disabled:opacity-50"
            >
              {mode === 'signin' ? 'Need an account? Create one' : 'Already registered? Sign in'}
            </button>
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
                    <span>{mode === 'signup' ? 'Creating…' : 'Signing in…'}</span>
                  </>
                ) : (
                  <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Dialog>
  );
};