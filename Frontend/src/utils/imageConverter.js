/**
 * Converts an image File/Blob into WebP format compressed File.
 * 
 * @param {File} file - The original image file.
 * @param {Object} options - Compression options.
 * @param {number} [options.quality=0.95] - WebP quality standard between 0 and 1.
 * @param {number} [options.maxWidth=1920] - Maximum width constraint for the output image.
 * @param {number} [options.maxHeight=1920] - Maximum height constraint for the output image.
 * @returns {Promise<File>} - Resolves with converted WebP file.
 */
export const convertToWebP = (file, { quality = 0.95, maxWidth = 1920, maxHeight = 1920 } = {}) => {
  return new Promise((resolve, reject) => {
    // If file is not an image or is already webp (optional check, but user asked to convert to webp)
    if (!file || !file.type.startsWith('image/')) {
      return resolve(file);
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.width;
      let height = img.height;

      // Scale down image if larger than max bounds while maintaining aspect ratio
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
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new Error('Canvas WebP conversion failed'));
          }

          // Generate new filename with .webp extension
          const originalName = file.name || 'image';
          const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
          const webpFileName = `${nameWithoutExt}.webp`;

          const webpFile = new File([blob], webpFileName, {
            type: 'image/webp',
            lastModified: Date.now(),
          });

          resolve(webpFile);
        },
        'image/webp',
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
};

/**
 * Converts multiple image files to WebP format concurrently.
 * 
 * @param {File[]} files 
 * @param {Object} options 
 * @returns {Promise<File[]>}
 */
export const convertMultipleToWebP = async (files, options = {}) => {
  if (!files || !files.length) return [];
  const conversions = Array.from(files).map((file) =>
    convertToWebP(file, options).catch((err) => {
      console.error(`Failed to convert image ${file.name} to WebP:`, err);
      return file; // Fallback to original file if conversion fails
    })
  );
  return Promise.all(conversions);
};
