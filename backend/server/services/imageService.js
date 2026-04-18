// ImageKit Image Upload Service
// Replaces Cloudinary with ImageKit API

import ImageKit from 'imagekit';

let imagekit = null;

const getImageKit = () => {
    if (!imagekit) {
        const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
        const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
        const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

        if (!publicKey || !privateKey || !urlEndpoint) {
            throw new Error('ImageKit environment variables not configured. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT.');
        }

        imagekit = new ImageKit({
            publicKey,
            privateKey,
            urlEndpoint,
        });
    }
    return imagekit;
};

export const imageService = {
    // Upload image buffer to ImageKit
    uploadImage: async(file, fileName, folder) => {
        try {
            const imagekit = getImageKit();

            const uploadResponse = await imagekit.upload({
                file,
                fileName,
                folder: folder || '/flavorfinder',
                useUniqueFileName: true,
                tags: ['flavorfinder'],
            });

            return {
                url: uploadResponse.url,
                fileId: uploadResponse.fileId,
                thumbnailUrl: uploadResponse.thumbnail || uploadResponse.url,
            };
        } catch (error) {
            console.error('ImageKit upload error:', error);
            throw new Error('Failed to upload image');
        }
    },

    // Upload image from base64 string
    uploadBase64Image: async(base64Data, fileName, folder) => {
        try {
            const imagekit = getImageKit();

            // Remove data URL prefix if present
            const base64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');

            const uploadResponse = await imagekit.upload({
                file: base64,
                fileName,
                folder: folder || '/flavorfinder',
                useUniqueFileName: true,
                tags: ['flavorfinder'],
            });

            return {
                url: uploadResponse.url,
                fileId: uploadResponse.fileId,
                thumbnailUrl: uploadResponse.thumbnail || uploadResponse.url,
            };
        } catch (error) {
            console.error('ImageKit base64 upload error:', error);
            throw new Error('Failed to upload image');
        }
    },

    // Delete image from ImageKit
    deleteImage: async(fileId) => {
        try {
            const imagekit = getImageKit();
            await imagekit.deleteFile(fileId);
        } catch (error) {
            console.error('ImageKit delete error:', error);
            throw new Error('Failed to delete image');
        }
    },

    // Get image URL with transformations
    getTransformedUrl: (url, transformations) => {
        if (!url) return url;

        const { width, height, quality = 80, format = 'auto' } = transformations;
        const transformParams = [];

        if (width) transformParams.push(`w-${width}`);
        if (height) transformParams.push(`h-${height}`);
        if (quality) transformParams.push(`q-${quality}`);
        if (format) transformParams.push(`f-${format}`);

        if (transformParams.length === 0) return url;

        // Insert transformations into ImageKit URL
        const urlParts = url.split('/');
        const fileName = urlParts.pop();
        const baseUrl = urlParts.join('/');

        return `${baseUrl}/tr:${transformParams.join(',')}/${fileName}`;
    },

    // Generate thumbnail URL
    getThumbnailUrl: (url, size = 300) => {
        return imageService.getTransformedUrl(url, { width: size, height: size, quality: 70 });
    },
};