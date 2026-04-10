import React, { useState } from 'react';
import { Review, reviewService } from '../services/reviewService';

interface ReviewCardProps {
  review: Review;
  onMarkHelpful?: () => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, onMarkHelpful }) => {
  const [isHelpful, setIsHelpful] = useState(false);

  const handleMarkHelpful = () => {
    if (!isHelpful) {
      reviewService.markHelpful(review.id);
      setIsHelpful(true);
      onMarkHelpful?.();
    }
  };

  const getAverageRating = () => {
    return (
      (review.ratings.foodQuality +
        review.ratings.deliverySpeed +
        review.ratings.packaging +
        review.ratings.restaurant) /
      4
    ).toFixed(1);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  const StarRating = ({ rating }: { rating: number }) => (
    <span className="text-yellow-400">
      {'⭐'.repeat(Math.round(rating))}
      {'☆'.repeat(5 - Math.round(rating))}
    </span>
  );

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-5 space-y-4 hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-gray-800">
              {review.customerName}
              {review.verified && (
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  ✓ Verified
                </span>
              )}
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-1">{formatDate(review.timestamp)}</p>
        </div>
        <div className="text-3xl font-bold text-blue-600 flex items-center gap-1">
          {getAverageRating()}
          <span className="text-2xl text-yellow-400">⭐</span>
        </div>
      </div>

      {/* Rating Breakdown */}
      <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg">
        <div>
          <p className="text-xs text-gray-600 font-semibold">Food Quality</p>
          <StarRating rating={review.ratings.foodQuality} />
        </div>
        <div>
          <p className="text-xs text-gray-600 font-semibold">Delivery Speed</p>
          <StarRating rating={review.ratings.deliverySpeed} />
        </div>
        <div>
          <p className="text-xs text-gray-600 font-semibold">Packaging</p>
          <StarRating rating={review.ratings.packaging} />
        </div>
        <div>
          <p className="text-xs text-gray-600 font-semibold">Restaurant</p>
          <StarRating rating={review.ratings.restaurant} />
        </div>
      </div>

      {/* Review Text */}
      <p className="text-gray-700 leading-relaxed">{review.reviewText}</p>

      {/* Photos */}
      {review.photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {review.photos.map((photo, idx) => (
            <img
              key={idx}
              src={photo}
              alt={`Review photo ${idx + 1}`}
              className="h-24 w-24 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            />
          ))}
        </div>
      )}

      {/* Owner Response */}
      {review.ownerResponse && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
          <p className="text-xs font-bold text-blue-700 mb-1">
            <i className="fa-solid fa-reply mr-2"></i>Restaurant Owner
          </p>
          <p className="text-sm text-blue-900">{review.ownerResponse}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <button
          onClick={handleMarkHelpful}
          disabled={isHelpful}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
            isHelpful
              ? 'bg-green-100 text-green-700 cursor-not-allowed'
              : 'hover:bg-gray-100 text-gray-600 cursor-pointer'
          }`}
        >
          <i className={`fa-solid fa-thumbs-up ${isHelpful ? 'text-green-600' : ''}`}></i>
          <span className="text-sm font-semibold">
            {review.helpful > 0 ? `${review.helpful} found helpful` : 'Helpful?'}
          </span>
        </button>
        <span className="text-xs text-gray-500">Order #{review.orderId.substring(0, 8).toUpperCase()}</span>
      </div>
    </div>
  );
};

export default ReviewCard;
