import { LatLng } from "../types.ts";

// Image cache for generated/AI images
const imageCache = new Map<string, string>();

export const getCachedImage = (key: string): string | null => {
  return imageCache.get(key) || null;
};

export const setCachedImage = (key: string, imageData: string): void => {
  imageCache.set(key, imageData);
  // Also store in localStorage for persistence
  try {
    localStorage.setItem(`img_cache_${key}`, imageData);
  } catch (e) {
    // localStorage might be full or unavailable
  }
};

// Load cache from localStorage on init
export const loadImageCache = (): void => {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('img_cache_')) {
        const cacheKey = key.replace('img_cache_', '');
        const value = localStorage.getItem(key);
        if (value) {
          imageCache.set(cacheKey, value);
        }
      }
    }
  } catch (e) {
    // localStorage might not be available
  }
};

// Generate a simple placeholder image data URI
export const generatePlaceholderImage = (text: string, width: number = 400, height: number = 300): string => {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f0f0f0"/>
    <text x="50%" y="50%" font-family="Arial" font-size="20" fill="#666" text-anchor="middle" dy=".3em">${text}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// For AI-generated images (if implemented later)
export const generateAIFoodImage = async (foodName: string): Promise<string> => {
  const cacheKey = `ai_food_${foodName.toLowerCase().replace(/\s+/g, '_')}`;

  // Check cache first
  const cached = getCachedImage(cacheKey);
  if (cached) {
    return cached;
  }

  // For now, return a placeholder. In future, integrate with actual AI image generation
  const placeholder = generatePlaceholderImage(`AI Generated: ${foodName}`, 400, 300);
  setCachedImage(cacheKey, placeholder);
  return placeholder;
};

// Initialize cache on module load
loadImageCache();