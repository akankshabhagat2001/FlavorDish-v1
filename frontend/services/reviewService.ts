import { API_BASE_URL } from './runtimeConfig';

interface ReviewRatings {
  foodQuality: number;
  deliverySpeed: number;
  packaging: number;
  restaurant: number;
}

export interface Review {
  id: string;
  orderId: string;
  restaurantId: string;
  customerId: string;
  customerName: string;
  ratings: ReviewRatings;
  reviewText: string;
  photos: string[];
  timestamp: number;
  helpful: number;
  verified: boolean;
  ownerResponse?: string;
}

const REVIEWS_KEY = 'flavorfinder_reviews';

class ReviewService {
  private reviews: Review[] = [];

  constructor() {
    this.loadReviews();
  }

  private loadReviews(): void {
    const stored = localStorage.getItem(REVIEWS_KEY);
    this.reviews = stored ? JSON.parse(stored) : [];
  }

  private saveReviews(): void {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(this.reviews));
  }

  async addReview(review: Omit<Review, 'id' | 'timestamp'>, userId: string): Promise<Review> {
    try {
      // Try API first
      const response = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId,
        },
        body: JSON.stringify({
          orderId: review.orderId,
          restaurantId: review.restaurantId,
          ratings: review.ratings,
          reviewText: review.reviewText,
          photos: review.photos,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.review || review as Review;
      }
    } catch (error) {
      console.warn('API review submission failed, using localStorage:', error);
    }

    // Fallback to localStorage
    const newReview: Review = {
      ...review,
      id: `review-${Date.now()}`,
      timestamp: Date.now(),
    };
    this.reviews.push(newReview);
    this.saveReviews();
    return newReview;
  }

  getRestaurantReviews(restaurantId: string): Review[] {
    return this.reviews.filter(r => r.restaurantId === restaurantId);
  }

  getOrderReview(orderId: string): Review | undefined {
    return this.reviews.find(r => r.orderId === orderId);
  }

  getAverageRating(restaurantId: string): number {
    const reviews = this.getRestaurantReviews(restaurantId);
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => {
      const avg = (r.ratings.foodQuality + r.ratings.deliverySpeed + r.ratings.packaging + r.ratings.restaurant) / 4;
      return acc + avg;
    }, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }

  getRatingBreakdown(restaurantId: string): { category: string; rating: number }[] {
    const reviews = this.getRestaurantReviews(restaurantId);
    if (reviews.length === 0) return [];

    const foodQuality = reviews.reduce((acc, r) => acc + r.ratings.foodQuality, 0) / reviews.length;
    const deliverySpeed = reviews.reduce((acc, r) => acc + r.ratings.deliverySpeed, 0) / reviews.length;
    const packaging = reviews.reduce((acc, r) => acc + r.ratings.packaging, 0) / reviews.length;
    const restaurant = reviews.reduce((acc, r) => acc + r.ratings.restaurant, 0) / reviews.length;

    return [
      { category: 'Food Quality', rating: Math.round(foodQuality * 10) / 10 },
      { category: 'Delivery Speed', rating: Math.round(deliverySpeed * 10) / 10 },
      { category: 'Packaging', rating: Math.round(packaging * 10) / 10 },
      { category: 'Restaurant', rating: Math.round(restaurant * 10) / 10 },
    ];
  }

  getReviewsByRating(restaurantId: string, ratingFilter: number): Review[] {
    const reviews = this.getRestaurantReviews(restaurantId);
    return reviews.filter(r => {
      const avg = (r.ratings.foodQuality + r.ratings.deliverySpeed + r.ratings.packaging + r.ratings.restaurant) / 4;
      return Math.floor(avg) === ratingFilter;
    });
  }

  sortReviews(reviews: Review[], sortBy: 'recent' | 'helpful' | 'highest'): Review[] {
    const sorted = [...reviews];
    switch (sortBy) {
      case 'recent':
        return sorted.sort((a, b) => b.timestamp - a.timestamp);
      case 'helpful':
        return sorted.sort((a, b) => b.helpful - a.helpful);
      case 'highest':
        return sorted.sort((a, b) => {
          const avgA = (a.ratings.foodQuality + a.ratings.deliverySpeed + a.ratings.packaging + a.ratings.restaurant) / 4;
          const avgB = (b.ratings.foodQuality + b.ratings.deliverySpeed + b.ratings.packaging + b.ratings.restaurant) / 4;
          return avgB - avgA;
        });
      default:
        return sorted;
    }
  }

  markHelpful(reviewId: string): void {
    const review = this.reviews.find(r => r.id === reviewId);
    if (review) {
      review.helpful++;
      this.saveReviews();
    }
  }

  addOwnerResponse(reviewId: string, response: string): void {
    const review = this.reviews.find(r => r.id === reviewId);
    if (review) {
      review.ownerResponse = response;
      this.saveReviews();
    }
  }
}

export const reviewService = new ReviewService();
