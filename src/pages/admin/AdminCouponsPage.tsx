import React, { useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { useConfirm } from '../../components/common/ConfirmDialog';
import { addNotification } from '../../store/slices/uiSlice';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { COUPON_RULES } from '../../lib/coupons';

interface CouponDraft {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrder: number;
}

const emptyDraft = (): CouponDraft => ({
  id: '',
  code: '',
  discountType: 'percentage',
  discountValue: 15,
  minOrder: 50,
});

export const AdminCouponsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const confirmAction = useConfirm();
  const [drafts, setDrafts] = useState<CouponDraft[]>([]);
  const [draft, setDraft] = useState<CouponDraft>(emptyDraft());

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const code = draft.code.trim().toUpperCase();
    if (!code) return;

    if (COUPON_RULES.some((rule) => rule.code === code)) {
      dispatch(
        addNotification({
          type: 'warning',
          title: 'Code Already Enforced',
          message: `“${code}” is already a live promotional code. Edit its rule in the shared coupon table instead.`,
          duration: 4500,
        })
      );
      return;
    }

    if (drafts.some((entry) => entry.code === code)) {
      dispatch(
        addNotification({
          type: 'warning',
          title: 'Duplicate Code',
          message: `“${code}” already exists in this draft list.`,
          duration: 4000,
        })
      );
      return;
    }

    setDrafts((prev) => [...prev, { ...draft, id: `cp_${Date.now()}`, code }]);
    setDraft(emptyDraft());

    dispatch(
      addNotification({
        type: 'info',
        title: 'Draft Added',
        message: `“${code}” was added to this session's draft list only. Checkout will reject it until it exists in the shared coupon table.`,
        duration: 5000,
      })
    );
  };

  const handleDelete = async (id: string, couponCode: string) => {
    const confirmed = await confirmAction({
      title: 'Confirm draft removal',
      message: `Remove “${couponCode}” from this draft list? It was never redeemable, so no customer is affected.`,
      confirmText: 'Remove draft',
      variant: 'danger',
    });
    if (!confirmed) return;

    setDrafts((prev) => prev.filter((entry) => entry.id !== id));
    dispatch(
      addNotification({
        type: 'info',
        title: 'Draft Removed',
        message: `“${couponCode}” was removed from this session's draft list.`,
        duration: 3000,
      })
    );
  };

  const noticeClass =
    'flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
          Promotion Coupons & Discount Codes
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Server-validated promotional codes applicable during cart & checkout calculations.
        </p>
      </div>

      <div role="status" className={noticeClass}>
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
        <p className="text-xs sm:text-sm leading-relaxed">
          <strong className="font-semibold">Codes live in code, not in the database.</strong> Checkout validates
          against the shared <code className="font-mono">COUPON_RULES</code> table in{' '}
          <code className="font-mono">src/lib/coupons.ts</code>. There is no coupon API, so codes added on this
          page are drafts that checkout will reject with an “invalid promotional code” error. Redemption counts
          are not tracked anywhere and are therefore not shown.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Live codes enforced by the server */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
            Redeemable at Checkout ({COUPON_RULES.length})
          </h2>

          <div className="space-y-3">
            {COUPON_RULES.map((rule) => (
              <div
                key={rule.code}
                className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-base text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    {rule.code}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                    {rule.discountType === 'percentage'
                      ? `${rule.discountValue}% OFF`
                      : `$${rule.discountValue} OFF`}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Minimum order ${rule.minOrder}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Draft form */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Draft Coupon (session only)</span>
          </h2>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="coupon-code" className="block text-xs font-semibold text-slate-700 mb-1">
                Coupon Code *
              </label>
              <input
                id="coupon-code"
                type="text"
                required
                placeholder="e.g. LUXURY15"
                value={draft.code}
                onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="coupon-type" className="block text-xs font-semibold text-slate-700 mb-1">
                  Type
                </label>
                <select
                  id="coupon-type"
                  value={draft.discountType}
                  onChange={(e) =>
                    setDraft({ ...draft, discountType: e.target.value as CouponDraft['discountType'] })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>

              <div>
                <label htmlFor="coupon-value" className="block text-xs font-semibold text-slate-700 mb-1">
                  Value
                </label>
                <input
                  id="coupon-value"
                  type="number"
                  min={1}
                  required
                  value={draft.discountValue}
                  onChange={(e) => setDraft({ ...draft, discountValue: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label htmlFor="coupon-min" className="block text-xs font-semibold text-slate-700 mb-1">
                Min. Order Value ($)
              </label>
              <input
                id="coupon-min"
                type="number"
                min={0}
                value={draft.minOrder}
                onChange={(e) => setDraft({ ...draft, minOrder: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Add Draft Coupon
            </button>
          </form>

          {drafts.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">
                Drafts ({drafts.length}) — not redeemable
              </h3>
              {drafts.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        {entry.code}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                        {entry.discountType === 'percentage'
                          ? `${entry.discountValue}% OFF`
                          : `$${entry.discountValue} OFF`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Minimum order ${entry.minOrder}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id, entry.code)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors shrink-0"
                    aria-label={`Remove draft coupon ${entry.code}`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};