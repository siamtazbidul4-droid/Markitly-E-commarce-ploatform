/**
 * Central layering scale.
 *
 * Overlay stacking used to be expressed as ad-hoc Tailwind `z-[nnn]` classes
 * sprinkled across components, which made the real ordering impossible to reason
 * about (a modal at 60 could still be painted under a toast at 70, and nothing
 * recorded which layer was *supposed* to win).
 *
 * These constants define one ordered scale. Every value is also mirrored into a
 * `z-[n]` utility so the layering survives Tailwind's class purge, while the
 * `style` binding keeps the runtime value and the class from drifting apart.
 *
 * Order (lowest to highest):
 *   30  sticky page chrome (header, bottom mobile nav)
 *   40  side panels that slide over content (cart drawer, mobile nav drawer)
 *   50  admin sidebar
 *   60  modal dialogs and their confirm overlay
 *   70  toasts - always last, so a notification is never hidden behind a dialog
 *
 * Within the toast layer, individual cards are offset from `toast` by their age
 * (see `toastZIndex`) so the newest notification is the topmost, highest-priority
 * element of the stack without needing an ever-growing base value.
 */
export const LAYER = {
  /** Sticky headers and the mobile bottom navigation. */
  chrome: 30,
  /** Slide-over panels: cart drawer and mobile navigation drawer. */
  panel: 40,
  /** Admin control-center sidebar. */
  adminSidebar: 50,
  /** Modal dialogs, including the confirm and authentication overlays. */
  dialog: 60,
  /** Notification stack. Must stay above every other overlay. */
  toast: 70,
} as const;

/** Maximum number of notifications that can share one z-index step. */
const TOAST_Z_STEP = 1;

/**
 * Stacking order for a single notification.
 *
 * `index` is the position in the newest-first list, so index 0 (the newest
 * notification) receives the highest value and every older card sits beneath it.
 *
 * The container already establishes a stacking context at `LAYER.toast`, so these
 * values only order cards relative to each other - they cannot escape the toast
 * layer and cover a dialog. They are kept finite for that reason: an unbounded
 * `base + index` scheme would let a long-lived session push card z-index values
 * arbitrarily high for no benefit.
 */
export const toastZIndex = (index: number): number =>
  LAYER.toast + Math.max(0, TOAST_Z_STEP - Math.min(index, TOAST_Z_STEP));
