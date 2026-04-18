import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

const AdminReviewsPanel: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await adminService.getReviews({ limit: 50 });
      setReviews(data?.reviews || []);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      await adminService.deleteReview(id);
      fetchReviews();
    } catch (err) {
      console.error('Failed to delete review', err);
    }
  };

  return (
    <div className="bg-[#2A2B2E] rounded-xl p-5 border border-white/10">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-black text-2xl text-white">Platform Reviews</h3>
        <button onClick={fetchReviews} className="text-violet-400 hover:text-white p-2 transition">
          <i className="fa-solid fa-rotate-right"></i> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400 py-10 text-center">Loading reviews...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#17181A] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Rating</th>
                <th className="px-4 py-3">Comment</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Restaurant</th>
                <th className="px-4 py-3 text-right rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reviews.map(review => (
                <tr key={review._id} className="hover:bg-white/5 transition">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 font-black text-amber-400 text-lg">
                      {review.rating.toFixed(1)} <i className="fa-solid fa-star text-sm"></i>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="line-clamp-2 max-w-sm text-xs italic">"{review.comment}"</p>
                  </td>
                  <td className="px-4 py-3 text-xs">{review.userId?.name || 'Anonymous'}</td>
                  <td className="px-4 py-3 text-xs text-violet-300">{review.restaurantId?.name || 'N/A'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(review._id)} className="p-2 text-slate-400 hover:text-rose-400 transition mb-1">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No reviews found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminReviewsPanel;
