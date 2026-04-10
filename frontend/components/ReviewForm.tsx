import React, { useState } from 'react';
import { reviewService } from '../services/reviewService';

interface ReviewFormProps {
  orderId: string;
  restaurantId: string;
  customerId: string;
  customerName: string;
  onSubmit: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  orderId,
  restaurantId,
  customerId,
  customerName,
  onSubmit,
}) => {
  const [ratings, setRatings] = useState({
    foodQuality: 5,
    deliverySpeed: 5,
    packaging: 5,
    restaurant: 5,
  });
  const [reviewText, setReviewText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleRatingChange = (category: keyof typeof ratings, value: number) => {
    setRatings(prev => ({
      ...prev,
      [category]: value,
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPhotos = Array.from(files as FileList).map((file: File) => URL.createObjectURL(file));
      setPhotos([...photos, ...newPhotos].slice(0, 3)); // Max 3 photos
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    if (reviewText.trim().length < 10) {
      newErrors.push('Review must be at least 10 characters');
    }
    if (reviewText.length > 500) {
      newErrors.push('Review cannot exceed 500 characters');
    }
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await reviewService.addReview({
        orderId,
        restaurantId,
        customerId,
        customerName,
        ratings,
        reviewText,
        photos,
        helpful: 0,
        verified: true,
      }, customerId);

      setReviewText('');
      setPhotos([]);
      setRatings({ foodQuality: 5, deliverySpeed: 5, packaging: 5, restaurant: 5 });
      onSubmit();
    } catch (error) {
      setErrors(['Failed to submit review']);
    } finally {
      setLoading(false);
    }
  };

  const RatingStars = ({ label, value, onChange }: { label: string; value: number; onChange: (val: number) => void }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="font-semibold text-gray-700">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => onChange(star)}
            className={`text-2xl transition-all ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ⭐
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Rating Categories */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <i className="fa-solid fa-star text-yellow-400"></i> Rate Your Experience
        </h3>
        <RatingStars
          label="Food Quality"
          value={ratings.foodQuality}
          onChange={val => handleRatingChange('foodQuality', val)}
        />
        <RatingStars
          label="Delivery Speed"
          value={ratings.deliverySpeed}
          onChange={val => handleRatingChange('deliverySpeed', val)}
        />
        <RatingStars
          label="Packaging"
          value={ratings.packaging}
          onChange={val => handleRatingChange('packaging', val)}
        />
        <RatingStars
          label="Restaurant Service"
          value={ratings.restaurant}
          onChange={val => handleRatingChange('restaurant', val)}
        />
      </div>

      {/* Overall Rating */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-l-4 border-blue-500">
        <p className="text-sm text-gray-600 mb-2">Overall Rating</p>
        <p className="text-3xl font-bold text-blue-600">
          {((ratings.foodQuality + ratings.deliverySpeed + ratings.packaging + ratings.restaurant) / 4).toFixed(1)}
          <span className="text-xl text-yellow-400 ml-2">⭐</span>
        </p>
      </div>

      {/* Review Text */}
      <div>
        <label className="block font-semibold text-gray-800 mb-2">
          <i className="fa-solid fa-pen mr-2 text-[#EF4F5F]"></i>
          Share Your Review
        </label>
        <textarea
          value={reviewText}
          onChange={e => setReviewText(e.target.value.slice(0, 500))}
          placeholder="Tell us about your experience... (min 10 characters)"
          className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-[#EF4F5F] transition-colors resize-none"
          rows={4}
        />
        <div className="text-right text-sm text-gray-500 mt-1">
          {reviewText.length}/500 characters
        </div>
      </div>

      {/* Photo Upload */}
      <div>
        <label className="block font-semibold text-gray-800 mb-2">
          <i className="fa-solid fa-image mr-2 text-[#EF4F5F]"></i>
          Add Photos (Optional - Max 3)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-[#EF4F5F] transition-colors">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
            id="photo-upload"
          />
          <label htmlFor="photo-upload" className="cursor-pointer">
            <div className="text-gray-400 text-xl mb-2">
              <i className="fa-solid fa-cloud-arrow-up"></i>
            </div>
            <p className="text-sm text-gray-600">Click to upload photos</p>
          </label>
        </div>

        {/* Photo Preview */}
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            {photos.map((photo, idx) => (
              <div key={idx} className="relative">
                <img
                  src={photo}
                  alt={`Photo ${idx + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <ul className="space-y-1">
            {errors.map((error, idx) => (
              <li key={idx} className="text-sm text-red-700 flex items-center gap-2">
                <i className="fa-solid fa-exclamation-circle"></i> {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || reviewText.trim().length < 10}
        className="w-full bg-gradient-to-r from-[#EF4F5F] to-[#FF6B7B] text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Submitting...
          </>
        ) : (
          <>
            <i className="fa-solid fa-paper-plane"></i> Submit Review
          </>
        )}
      </button>
    </div>
  );
};

export default ReviewForm;
