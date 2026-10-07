import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Dialog } from './Dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  /** Called after the user confirms, before the dialog closes. Use for async work. */
  onConfirm?: () => void | Promise<void>;
}

type ConfirmRequest = ConfirmOptions;

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export const useConfirm = (): ConfirmFn => {
  const confirmFn = useContext(ConfirmContext);
  if (!confirmFn) {
    throw new Error('useConfirm must be used inside <ConfirmProvider>.');
  }
  return confirmFn;
};

/**
 * Application-wide confirmation dialog host.
 *
 * Replaces every native `window.confirm` call with an accessible, reusable
 * custom dialog: backdrop, focus trap, focus restoration, ESC handling,
 * loading/disabled state while the destructive action runs, and responsive
 * full-width layout on small viewports.
 */
export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);

  const settle = useCallback((confirmed: boolean) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setBusy(false);
    setRequest(null);
    resolve?.(confirmed);
  }, []);

  const confirmAction = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setBusy(false);
      setRequest(options);
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!request) return;
    if (!request.onConfirm) {
      settle(true);
      return;
    }
    setBusy(true);
    try {
      await request.onConfirm();
      settle(true);
    } catch {
      // Keep the dialog open so the caller can surface the failure itself. The
      // promise is settled once here; the resolver is cleared so a later close
      // cannot resolve it a second time.
      setBusy(false);
      resolverRef.current = null;
    }
  }, [request, settle]);

  const variant = request?.variant ?? 'danger';
  const tone =
    variant === 'danger'
      ? {
          icon: 'bg-rose-50 text-rose-600',
          confirm: 'bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-600',
        }
      : variant === 'warning'
      ? {
          icon: 'bg-amber-50 text-amber-600',
          confirm: 'bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-500',
        }
      : {
          icon: 'bg-blue-50 text-blue-600',
          confirm: 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-600',
        };

  const value = useMemo(() => confirmAction, [confirmAction]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}

      <Dialog
        isOpen={!!request}
        onClose={() => settle(false)}
        hideCloseButton
        dismissible={!busy}
        maxWidth="sm"
        labelledBy="confirm-dialog-title"
      >
        <div className="flex items-start gap-4">
          <span
            className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${tone.icon}`}
            aria-hidden="true"
          >
            <AlertTriangle className="w-5 h-5" />
          </span>

          <div className="min-w-0 grow">
            <h3
              id="confirm-dialog-title"
              className="font-display text-base font-bold text-slate-900"
            >
              {request?.title}
            </h3>
            <p className="mt-1.5 text-sm text-slate-600 leading-relaxed break-words">
              {request?.message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <button
            type="button"
            onClick={() => settle(false)}
            disabled={busy}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {request?.cancelText || 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${tone.confirm}`}
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            <span>{busy ? 'Working...' : request?.confirmText || 'Confirm'}</span>
          </button>
        </div>
      </Dialog>
    </ConfirmContext.Provider>
  );
};