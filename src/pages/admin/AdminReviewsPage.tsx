import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectReviews, selectAllProducts } from '../../store/slices/productSlice';
import { addNotification } from '../../store/slices/uiSlice';
import { StarRating } from '../../components/common/StarRating';
import { Star, CheckCircle2, Trash2 } from 'lucide-react';

export const AdminReviewsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const reviewsByProduct = useAppSelector(selectReviews);
  const products = useAppSelector(selectAllProducts);

  // Flatten reviews
  const allReviewsList = Object.entries(reviewsByProduct).flatMap(([prodId, list]) => {
    const prod = products.find((p) => p.id === prodId);
    return list.map((r) => ({
      ...r,
      productName: prod?.name || `Product #${prodId}`,
    }));
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
          Review Moderation & Social Proof
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Moderate verified customer feedback, monitor sentiment, and protect catalog authenticity.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Review Content</th>
                <th className="p-4">Verified Status</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {allReviewsList.map((rev) => (
                <tr key={rev.id} className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-900 max-w-[200px] truncate">
                    {rev.productName}
                  </td>
                  <td className="p-4 font-semibold text-slate-800">{rev.userName}</td>
                  <td className="p-4">
                    <StarRating rating={rev.rating} size="sm" />
                  </td>
                  <td className="p-4 max-w-xs text-slate-600 truncate">{rev.comment}</td>
                  <td className="p-4">
                    {rev.isVerifiedPurchase ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified Purchase
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">Unverified</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-400">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
