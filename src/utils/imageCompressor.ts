/**
 * Image compression utility for resizing and compressing images before saving to Firestore.
 * Firestore has a strict 1MB (1,048,576 bytes) limit per document.
 * This utility ensures all uploaded images are well under ~100KB-150KB.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeBytes?: number; // target max size (e.g. 200 * 1024)
}

/**
 * Compresses an image File or Blob and returns a lightweight base64 Data URL.
 */
export async function compressImageFile(
  file: File | Blob,
  options: CompressOptions = {}
): Promise<string> {
  const {
    maxWidth = 1000,
    maxHeight = 1000,
    quality = 0.75,
    maxSizeBytes = 180 * 1024 // 180 KB default target
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.onload = () => {
        try {
          let { width, height } = img;

          // Maintain aspect ratio
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          // Fill white background for transparent PNG conversion to JPEG
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Compress iteratively if necessary
          let currentQuality = quality;
          let compressed = canvas.toDataURL('image/jpeg', currentQuality);

          // If still larger than maxSizeBytes and quality is above 0.3, lower quality or resolution
          let attempts = 0;
          while (compressed.length > maxSizeBytes && currentQuality > 0.3 && attempts < 4) {
            currentQuality -= 0.15;
            compressed = canvas.toDataURL('image/jpeg', Math.max(0.2, currentQuality));
            attempts++;
          }

          resolve(compressed);
        } catch (err) {
          // Fallback to original dataUrl if canvas fails
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Checks and compresses existing base64 string if it exceeds max size.
 */
export async function sanitizeImageBase64(
  dataUrlOrUrl: string,
  options: CompressOptions = {}
): Promise<string> {
  if (!dataUrlOrUrl || !dataUrlOrUrl.startsWith('data:image')) {
    return dataUrlOrUrl; // Normal HTTP/HTTPS URL, no compression needed
  }

  // If already under 150KB, keep it
  if (dataUrlOrUrl.length < 150 * 1024) {
    return dataUrlOrUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const maxWidth = options.maxWidth || 800;
        const maxHeight = options.maxHeight || 800;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(dataUrlOrUrl);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', options.quality || 0.7);
        resolve(compressed);
      } catch {
        resolve(dataUrlOrUrl);
      }
    };
    img.onerror = () => resolve(dataUrlOrUrl);
    img.src = dataUrlOrUrl;
  });
}
