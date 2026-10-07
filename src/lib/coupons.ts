/**
 * Canonical promotional-code rules.
 *
 * Shared by the Express order pipeline and the admin coupons console so a rule
 * can never be enforced in one place and advertised in another. `resolveCoupon`
 * is pure, which keeps pricing independently testable.
 */

export interface CouponRule {
  code: string;
  discountType: 'percentage' | 'fixed';
  /** Percent (0-100) for percentage coupons, currency amount for fixed ones. */
  discountValue: number;
  /** Minimum subtotal required before the discount applies. */
  minOrder: number;
}

export const COUPON_RULES: readonly CouponRule[] = [
  { code: 'SUMMER60', discountType: 'percentage', discountValue: 20, minOrder: 49 },
  { code: 'MARKETLY20', discountType: 'percentage', discountValue: 20, minOrder: 50 },
  { code: 'SAVE10', discountType: 'fixed', discountValue: 10, minOrder: 70 },
];

export type CouponRejection =
  | 'unknown'
  | 'min-order'
  | 'invalid-value';

export interface CouponResult {
  discount: number;
  rule?: CouponRule;
  rejection?: CouponRejection;
  /** Operator-facing explanation, safe to surface in an API error message. */
  message?: string;
}

const money = (value: number): number => Math.round(value * 100) / 100;

/**
 * Validates a submitted code against a subtotal and returns the discount.
 *
 * An absent or blank code is a valid no-op. A supplied code that is unknown,
 * below its minimum, or carries an unusable value is rejected rather than
 * silently discounted by zero, so a mistyped code cannot reach a stored order.
 */
export const resolveCoupon = (rawCode: unknown, subtotal: number): CouponResult => {
  const code = typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : '';
  if (!code) return { discount: 0 };

  const rule = COUPON_RULES.find((entry) => entry.code === code);
  if (!rule) {
    return {
      discount: 0,
      rejection: 'unknown',
      message: `“${code}” is not a valid promotional code.`,
    };
  }

  if (!Number.isFinite(rule.discountValue) || rule.discountValue <= 0) {
    return {
      discount: 0,
      rejection: 'invalid-value',
      message: `Promotional code “${code}” is misconfigured and cannot be redeemed.`,
    };
  }

  if (subtotal < rule.minOrder) {
    return {
      discount: 0,
      rejection: 'min-order',
      message: `“${code}” requires a subtotal of at least $${rule.minOrder.toFixed(2)}.`,
    };
  }

  const discount =
    rule.discountType === 'percentage'
      ? (subtotal * Math.min(rule.discountValue, 100)) / 100
      : Math.min(rule.discountValue, subtotal);

  return { discount: money(discount), rule };
};