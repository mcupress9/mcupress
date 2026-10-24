/**
 * Compresses an image file client-side before uploading or saving to localStorage.
 * Resizes the image to fit max dimensions (e.g. 800x800) and compresses to JPEG,
 * reducing a 5MB-15MB photo to ~50KB-100KB without visible quality loss for book covers.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 800,
  maxHeight = 1000,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's not an image, return raw data url as fallback
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect-ratio-preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        // Draw image smoothly
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with reasonable compression
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };

      img.onerror = () => {
        // Fallback to original data URL if image decoding fails
        resolve(dataUrl);
      };

      img.src = dataUrl;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
