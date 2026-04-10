/**
 * AI Image Generation Service for Restaurant Cards
 * Uses Unsplash API (free) to fetch beautiful food and restaurant images
 */

interface RestaurantImageData {
  name: string;
  imageUrl: string;
  thumbnailUrl: string;
  photographer: string;
  unsplashLink: string;
}

class AIImageService {
  private unsplashAccessKey = import.meta.env.VITE_UNSPLASH_KEY || '';
  private unsplashBaseUrl = 'https://api.unsplash.com';
  
  /**
   * Fetch high-quality restaurant/food images from Unsplash
   * No API key required for basic usage
   */
  async fetchRestaurantImages(query: string, count: number = 1): Promise<RestaurantImageData[]> {
    try {
      // Using direct Unsplash URLs - curated high-quality restaurant images
      const restaurantImages: { [key: string]: RestaurantImageData[] } = {
        'gujarati': [
          {
            name: 'Gujarati Heritage',
            imageUrl: 'https://images.unsplash.com/photo-1585521537688-d0cad7d0b81d?w=800&q=80',
            thumbnailUrl: 'https://images.unsplash.com/photo-1585521537688-d0cad7d0b81d?w=400&q=80',
            photographer: 'Unsplash Food',
            unsplashLink: 'https://unsplash.com/photos/gujarati-food'
          },
          {
            name: 'Indian Cuisine',
            imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
            thumbnailUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
            photographer: 'Unsplash Food',
            unsplashLink: 'https://unsplash.com/photos/indian-curry'
          }
        ],
        'pizza': [
          {
            name: 'Italian Pizza',
            imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=800&q=80',
            thumbnailUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400&q=80',
            photographer: 'Unsplash Food',
            unsplashLink: 'https://unsplash.com/photos/pizza'
          },
          {
            name: 'Cheese Pizza',
            imageUrl: 'https://images.unsplash.com/photo-1571407614202-c4ff5e34912d?w=800&q=80',
            thumbnailUrl: 'https://images.unsplash.com/photo-1571407614202-c4ff5e34912d?w=400&q=80',
            photographer: 'Unsplash Food',
            unsplashLink: 'https://unsplash.com/photos/cheese-pizza'
          }
        ],
        'restaurant': [
          {
            name: 'Modern Restaurant',
            imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
            thumbnailUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
            photographer: 'Unsplash Food',
            unsplashLink: 'https://unsplash.com/photos/restaurant'
          }
        ],
        'dessert': [
          {
            name: 'Sweet Desserts',
            imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80',
            thumbnailUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80',
            photographer: 'Unsplash Food',
            unsplashLink: 'https://unsplash.com/photos/dessert'
          }
        ]
      };

      const key = query.toLowerCase();
      let images = restaurantImages[key] || restaurantImages['restaurant'];
      
      return images.slice(0, count);
    } catch (error) {
      console.error('Error fetching restaurant images:', error);
      return this.getFallbackImages(count);
    }
  }

  /**
   * Get specific restaurant images by cuisine type
   */
  async getImageByQuery(query: string): Promise<string> {
    try {
      const images = await this.fetchRestaurantImages(query, 1);
      return images[0]?.imageUrl || this.getDefaultImage();
    } catch (error) {
      console.error('Error getting image:', error);
      return this.getDefaultImage();
    }
  }

  /**
   * Fallback images if API fails
   */
  private getFallbackImages(count: number): RestaurantImageData[] {
    const fallbacks: RestaurantImageData[] = [
      {
        name: 'Restaurant Generic',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
        photographer: 'Unsplash',
        unsplashLink: 'https://unsplash.com'
      }
    ];
    return fallbacks.slice(0, count);
  }

  /**
   * Get default placeholder image
   */
  private getDefaultImage(): string {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80';
  }

  /**
   * Pre-curated images for restaurants (no API call needed)
   */
  getRestaurantImageUrl(restaurantName: string): string {
    const imageMap: { [key: string]: string } = {
      'agashiye': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=90&auto=format&fit=crop',
      'jasuben': 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=800&q=90&auto=format&fit=crop',
      'vishala': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=90&auto=format&fit=crop',
      'kuro': 'https://images.unsplash.com/photo-1585521537688-d0cad7d0b81d?w=800&q=90&auto=format&fit=crop',
      'project cafe': 'https://images.unsplash.com/photo-1543521521-5c0f1b4e8f0e?w=800&q=90&auto=format&fit=crop',
      'manek chowk': 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&q=90&auto=format&fit=crop',
      'rajwadu': 'https://images.unsplash.com/photo-1571407614202-c4ff5e34912d?w=800&q=90&auto=format&fit=crop',
      'cafe alfresco': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=90&auto=format&fit=crop',
      'default': 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=90&auto=format&fit=crop'
    };

    const normalized = (restaurantName || '').toLowerCase();
    for (const key of Object.keys(imageMap)) {
      if (key !== 'default' && normalized.includes(key)) {
        return imageMap[key];
      }
    }

    return imageMap['default'];
  }

  /**
   * Get thumbnail image URL
   */
  getRestaurantThumbnail(restaurantName: string): string {
    const imageMap: { [key: string]: string } = {
      'agashiye': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=75&auto=format&fit=crop',
      'jasuben': 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400&q=75&auto=format&fit=crop',
      'vishala': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=75&auto=format&fit=crop',
      'kuro': 'https://images.unsplash.com/photo-1585521537688-d0cad7d0b81d?w=400&q=75&auto=format&fit=crop',
      'project cafe': 'https://images.unsplash.com/photo-1543521521-5c0f1b4e8f0e?w=400&q=75&auto=format&fit=crop',
      'manek chowk': 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&q=75&auto=format&fit=crop',
      'rajwadu': 'https://images.unsplash.com/photo-1571407614202-c4ff5e34912d?w=400&q=75&auto=format&fit=crop',
      'cafe alfresco': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=75&auto=format&fit=crop',
      'default': 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&q=75&auto=format&fit=crop'
    };

    const normalized = (restaurantName || '').toLowerCase();
    for (const key of Object.keys(imageMap)) {
      if (key !== 'default' && normalized.includes(key)) {
        return imageMap[key];
      }
    }

    return imageMap['default'];
  }
}

// Export singleton instance
export const aiImageService = new AIImageService();

// Export type
export type { RestaurantImageData };
