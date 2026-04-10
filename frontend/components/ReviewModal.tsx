import React, { useState, useEffect } from 'react';
import ReviewForm from './ReviewForm';
import ReviewCard from './ReviewCard';
import { reviewService, Review } from '../services/reviewService';

interface ReviewModalProps {
  orderId: string;
  restaurantId: string;
  customerId: string;
  customerName: string;
  restaurantName: string;
  onClose: () => void;
  onReviewSubmitted?: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  orderId,
  restaurantId,
  customerId,
  customerName,
  restaurantName,
  onClose,
}) => {
  const [tab, setTab] = useState<'review' | 'all'>('review');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'highest'>('recent');
  const [isReviewSubmitted, setIsReviewSubmitted] = useState(false);
  const [breakdown, setBreakdown] = useState<Array<{ category: string; rating: number }>>([]);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    const allReviews = reviewService.getRestaurantReviews(restaurantId);
    setReviews(allReviews);
    setFilteredReviews(allReviews);
    setBreakdown(reviewService.getRatingBreakdown(restaurantId));
    setAvgRating(reviewService.getAverageRating(restaurantId));
    setIsReviewSubmitted(!!reviewService.getOrderReview(orderId));
  }, [restaurantId, orderId]);

  useEffect(() => {
    let filtered = ratingFilter !== null ? reviews.filter(r => {
      const avg = (r.ratings.foodQuality + r.ratings.deliverySpeed + r.ratings.packaging + r.ratings.restaurant) / 4;
      return Math.floor(avg) === ratingFilter;
    }) : reviews;

    filtered = reviewService.sortReviews(filtered, sortBy);
    setFilteredReviews(filtered);
  }, [ratingFilter, sortBy, reviews]);

  const handleReviewSubmitted = () => {
    const allReviews = reviewService.getRestaurantReviews(restaurantId);
    setReviews(allReviews);
    setFilteredReviews(allReviews);
    setBreakdown(reviewService.getRatingBreakdown(restaurantId));
    setAvgRating(reviewService.getAverageRating(restaurantId));
    setIsReviewSubmitted(true);
    setTab('all');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#EF4F5F] to-[#FF6B7B] text-white px-8 py-6 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{restaurantName}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-3xl font-bold">
                {avgRating.toFixed(1)}
                <span className="text-2xl text-yellow-300 ml-1">⭐</span>
              </span>
              <span className="text-white/80 text-sm">
                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-2xl hover:bg-white/20 p-2 rounded-full transition-all"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setTab('review')}
              className={`py-4 px-4 font-bold transition-colors border-b-2 ${
                tab === 'review'
                  ? 'text-[#EF4F5F] border-[#EF4F5F]'
                  : 'text-gray-600 border-transparent hover:text-gray-800'
              }`}
            >
              <i className="fa-solid fa-pen-to-square mr-2"></i>
              {isReviewSubmitted ? 'Review Submitted' : 'Write Review'}
            </button>
            <button
              onClick={() => setTab('all')}
              className={`py-4 px-4 font-bold transition-colors border-b-2 ${
                tab === 'all'
                  ? 'text-[#EF4F5F] border-[#EF4F5F]'
                  : 'text-gray-600 border-transparent hover:text-gray-800'
              }`}
            >
              <i className="fa-solid fa-comments mr-2"></i>
              All Reviews ({reviews.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[600px] overflow-y-auto">
          {tab === 'review' ? (
            !isReviewSubmitted ? (
              <ReviewForm
                orderId={orderId}
                restaurantId={restaurantId}
                customerId={customerId}
                customerName={customerName}
                onSubmit={handleReviewSubmitted}
              />
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h3>
                <p className="text-gray-600 mb-6">Your review has been submitted successfully</p>
                <button
                  onClick={() => setTab('all')}
                  className="bg-[#EF4F5F] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#d43d4c] transition-all"
                >
                  View All Reviews
                </button>
              </div>
            )
          ) : (
            <div className="space-y-6">
              {breakdown.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {breakdown.map(item => (
                    <div key={item.category} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-600 font-semibold mb-2">{item.category}</p>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-blue-600">{item.rating.toFixed(1)}</span>
                        <span className="text-yellow-400 mb-1">⭐</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Filters */}
              <div className="flex gap-4 flex-wrap pt-4 border-t border-gray-200">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Filter by Rating</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRatingFilter(null)}
                      className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
                        ratingFilter === null
                          ? 'bg-[#EF4F5F] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    {[5, 4, 3, 2, 1].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setRatingFilter(rating)}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
                          ratingFilter === rating
                            ? 'bg-[#EF4F5F] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {rating}⭐
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Sort by</label>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as typeof sortBy)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:border-[#EF4F5F]"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="helpful">Most Helpful</option>
                    <option value="highest">Highest Rated</option>
                  </select>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {filteredReviews.length > 0 ? (
                  filteredReviews.map(review => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      onMarkHelpful={() => {
                        const updated = reviewService.getRestaurantReviews(restaurantId);
                        setReviews(updated);
                      }}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <i className="fa-solid fa-star text-4xl text-gray-300 mb-3 block"></i>
                    <p className="text-gray-500">No reviews found with the selected filter</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
