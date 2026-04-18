// ImageKit Image Upload Service for Frontend
// Handles image uploads to ImageKit via backend API

import api from './authService';

export const imageUploadService = {
  // Upload single image file
  uploadImage: async (file: File, folder?: string): Promise<{
    url: string;
    fileId: string;
    thumbnailUrl?: string;
  }> => {
    const formData = new FormData();
    formData.append('image', file);
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await api.post('/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.image;
  },

  // Upload multiple images
  uploadImages: async (files: File[], folder?: string): Promise<Array<{
    url: string;
    fileId: string;
    thumbnailUrl?: string;
  }>> => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('images', file);
    });
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await api.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.images;
  },

  // Upload base64 image
  uploadBase64Image: async (base64Data: string, fileName: string, folder?: string): Promise<{
    url: string;
    fileId: string;
    thumbnailUrl?: string;
  }> => {
    const response = await api.post('/upload/base64', {
      image: base64Data,
      fileName,
      folder,
    });

    return response.data.image;
  },

  // Delete image
  deleteImage: async (fileId: string): Promise<void> => {
    await api.delete(`/upload/${fileId}`);
  },

  // Get transformed image URL
  getTransformedUrl: async (url: string, transformations: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  }): Promise<string> => {
    const params = new URLSearchParams();
    params.append('url', url);
    if (transformations.width) params.append('width', transformations.width.toString());
    if (transformations.height) params.append('height', transformations.height.toString());
    if (transformations.quality) params.append('quality', transformations.quality.toString());
    if (transformations.format) params.append('format', transformations.format);

    const response = await api.get(`/upload/transform?${params.toString()}`);
    return response.data.transformedUrl;
  },

  // Get thumbnail URL
  getThumbnailUrl: async (url: string, size: number = 300): Promise<string> => {
    return imageUploadService.getTransformedUrl(url, { width: size, height: size, quality: 70 });
  },

  // Validate image file
  validateImageFile: (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'Only image files are allowed' };
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { valid: false, error: 'Image file size must be less than 5MB' };
    }

    // Check file extension
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return { valid: false, error: 'Only JPG, PNG, GIF, and WebP images are allowed' };
    }

    return { valid: true };
  },

  // Compress image before upload (basic implementation)
  compressImage: async (file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file); // Fallback to original
          }
        }, file.type, quality);
      };

      img.src = URL.createObjectURL(file);
    });
  },
};