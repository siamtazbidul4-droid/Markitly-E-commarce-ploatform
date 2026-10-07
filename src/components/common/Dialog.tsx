import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Scroll lock is reference-counted because dialogs can stack (a confirmation
 * opened from inside another dialog). Restoring `body.style.overflow` when only
 * one of several open dialogs closes would unlock the page underneath them.
 */
let openDialogCount = 0;
let previousBodyOverflow = '';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  /** Set to false for flows that must not be dismissed by ESC/backdrop (e.g. submitting). */
  dismissible?: boolean;
  hideCloseButton?: boolean;
  labelledBy?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
  dismissible = true,
  hideCloseButton = false,
  labelledBy,
}) => {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const generatedId = useId();

  // Callers frequently pass an inline `onClose`; keeping it in a ref means the
  // focus trap is not torn down and rebuilt on every parent render.
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);
  onCloseRef.current = onClose;
  dismissibleRef.current = dismissible;

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    if (openDialogCount === 0) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    openDialogCount += 1;

    const surface = surfaceRef.current;
    const initialTarget = surface?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (initialTarget ?? surface)?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissibleRef.current) {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key !== 'Tab' || !surfaceRef.current) return;

      const focusables = Array.from(
        surfaceRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      openDialogCount = Math.max(0, openDialogCount - 1);
      if (openDialogCount === 0) {
        document.body.style.overflow = previousBodyOverflow;
      }
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const titleId = labelledBy ?? `${generatedId}-title`;
  const descriptionId = `${generatedId}-description`;

  const maxWidthClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    '4xl': 'sm:max-w-4xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={dismissible ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Dialog Surface */}
      <div
        ref={surfaceRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title || description ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`relative z-10 w-full ${maxWidthClasses} bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200/70 flex flex-col max-h-[92dvh] sm:max-h-[calc(100dvh-2rem)] animate-in fade-in zoom-in-95 duration-150`}
      >
        {(title || description) && (
          <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
            <div className="min-w-0">
              {title && (
                <h3
                  id={titleId}
                  className="font-display text-lg font-bold text-slate-900"
                >
                  {title}
                </h3>
              )}
              {description && (
                <p id={descriptionId} className="mt-1 text-sm text-slate-500">
                  {description}
                </p>
              )}
            </div>
            {!hideCloseButton && (
              <button
                type="button"
                onClick={onClose}
                disabled={!dismissible}
                className="p-1.5 -mr-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="px-5 sm:px-6 py-5 overflow-y-auto overscroll-contain grow min-h-0">{children}</div>

        {footer && (
          <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/60 sm:rounded-b-2xl shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};