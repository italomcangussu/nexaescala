/**
 * Image Utilities for Avatar Upload
 * Handles compression and Supabase Storage upload
 */

import { supabase } from './supabase';

/**
 * Compress an image file to a maximum size
 * @param file - Original image file
 * @param maxSizeKB - Maximum file size in KB (default 500)
 * @param maxWidth - Maximum width in pixels (default 400)
 * @returns Compressed image as Blob
 */
export const compressImage = async (
    file: File,
    maxSizeKB: number = 500,
    maxWidth: number = 400
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Scale down if larger than maxWidth
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Start with high quality and reduce if needed
                let quality = 0.9;
                const tryCompress = () => {
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('Compression failed'));
                                return;
                            }

                            // If still too large and quality can be reduced
                            if (blob.size > maxSizeKB * 1024 && quality > 0.1) {
                                quality -= 0.1;
                                tryCompress();
                            } else {
                                resolve(blob);
                            }
                        },
                        'image/jpeg',
                        quality
                    );
                };
                tryCompress();
            };
            img.onerror = () => reject(new Error('Failed to load image'));
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
    });
};

/**
 * Upload an avatar to Supabase Storage
 * @param userId - User ID for the filename
 * @param file - Image file to upload
 * @returns Public URL of the uploaded avatar
 */
export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
    // Compress the image first
    const compressedBlob = await compressImage(file);

    const fileName = `${userId}.jpg`;
    const filePath = `avatars/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedBlob, {
            cacheControl: '3600',
            upsert: true, // Replace if exists
            contentType: 'image/jpeg'
        });

    if (uploadError) {
        throw uploadError;
    }

    // Get the public URL
    const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

    return data.publicUrl;
};

/**
 * Create a data URL preview from a file
 */
export const createPreviewUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};
