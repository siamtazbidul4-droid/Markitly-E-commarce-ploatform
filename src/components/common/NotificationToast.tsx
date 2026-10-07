import React, { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  removeNotification,
  selectNotificationsNewestFirst,
  ToastNotification,
} from '../../store/slices/uiSlice';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, Loader2 } from 'lucide-react';
import { LAYER, toastZIndex } from '../../lib/layers';

/**
 * Single application-wide notification surface.
 *
 * Success uses a deep, premium dark green (Tailwind `green-900` #14532D →
 * `green-800` #166534) inverted surface; the remaining severities stay on a
 * neutral white card with a coloured rail so they never compete for attention.
 *
 * Stacking contract
 * ------------------
 * The container is anchored to the bottom of the viewport and every toast is
 * absolutely positioned at the same spot, so the stack is a layered overlay
 * rather than a vertical flow: the most recent notification is the topmost card,
 * and each older card receives a progressively lower z-index so the newest one
 * unambiguously covers the cards beneath it.
 *
 * Toasts must remain visible above modals, drawers and sticky headers, so the
 * container sits one step below the dialog layer and above the cart drawer; see
 * `src/lib/layers.ts` for the single source of truth.
 */
export const NotificationToastContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotificationsNewestFirst);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      role="region"
      aria-label="Notifications"
      className="fixed z-[70] bottom-20 sm:bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:w-full sm:max-w-sm pointer-events-none"
      style={{ zIndex: LAYER.toast }}
    >
      {notifications.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          zIndex={toastZIndex(index)}
          onDismiss={() => dispatch(removeNotification(toast.id))}
        />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: ToastNotification;
  /** Explicit stacking order: index 0 (newest) sits above every older toast. */
  zIndex: number;
  onDismiss: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, zIndex, onDismiss }) => {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  const isPersistent = toast.type === 'loading' || toast.duration === 0;

  useEffect(() => {
    if (isPersistent) return;
    const timer = window.setTimeout(() => dismissRef.current(), toast.duration || 4000);
    return () => window.clearTimeout(timer);
  }, [isPersistent, toast.duration, toast.id]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') dismissRef.current();
  }, []);

  const surface =
    toast.type === 'success'
      ? 'bg-gradient-to-br from-green-900 to-green-800 border-green-900 text-white shadow-lg shadow-green-900/25'
      : 'bg-white border-slate-200 text-slate-900 shadow-lg shadow-slate-900/10';

  const rail =
    toast.type === 'success'
      ? 'bg-green-700'
      : toast.type === 'error'
      ? 'bg-rose-500'
      : toast.type === 'warning'
      ? 'bg-amber-500'
      : toast.type === 'loading'
      ? 'bg-slate-400'
      : 'bg-blue-500';

  const icon =
    toast.type === 'success' ? (
      <CheckCircle2 className="w-5 h-5 text-green-300 shrink-0" aria-hidden="true" />
    ) : toast.type === 'error' ? (
      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" aria-hidden="true" />
    ) : toast.type === 'warning' ? (
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" aria-hidden="true" />
    ) : toast.type === 'loading' ? (
      <Loader2 className="w-5 h-5 text-slate-500 shrink-0 animate-spin" aria-hidden="true" />
    ) : (
      <Info className="w-5 h-5 text-blue-600 shrink-0" aria-hidden="true" />
    );

  const titleTone =
    toast.type === 'success' ? 'text-white' : toast.type === 'error' ? 'text-rose-700' : 'text-slate-900';

  const bodyTone = toast.type === 'success' ? 'text-green-50' : 'text-slate-600';

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      style={{ zIndex }}
      className={`pointer-events-auto absolute inset-x-0 bottom-0 flex items-start gap-3 pl-5 pr-3 py-3.5 rounded-2xl border overflow-hidden animate-in slide-in-from-bottom-3 sm:slide-in-from-right-5 duration-200 ${surface}`}
    >
      <span className={`absolute left-0 inset-y-0 w-1 ${rail}`} aria-hidden="true" />
      {icon}
      <div className="flex-1 min-w-0 pt-0.5">
        {toast.title && (
          <h4 className={`text-xs font-bold uppercase tracking-wide ${titleTone}`}>{toast.title}</h4>
        )}
        <p className={`text-sm font-medium leading-snug ${bodyTone}`}>{toast.message}</p>
      </div>
      {!isPersistent && (
        <button
          type="button"
          onClick={dismissRef.current}
          onKeyDown={handleKeyDown}
          className={`p-1 rounded-lg transition-colors ${
            toast.type === 'success'
              ? 'text-green-200 hover:text-white hover:bg-white/10'
              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          }`}
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
