import type { PresetRegistry } from '../types/presets';
import { extractCloudinaryUrl, extractStandardUrl } from '../extractor/custom';

/**
 * Built-in preset configurations
 */
export const presetsData: PresetRegistry = {
  cloudinary: {
    name: 'cloudinary',
    description: 'Optimized for Cloudinary image CDN',
    transforms: [
      {
        selector: 'img',
        extract: {
          custom: (src) => {
            // Extract Cloudinary-specific components
            const cloudinaryData = extractCloudinaryUrl(src);
            if (cloudinaryData) {
              return cloudinaryData;
            }

            // Fallback to standard extraction
            const standardData = extractStandardUrl(src);
            if (standardData && src.includes('cloudinary')) {
              return {
                ...standardData,
                publicId: standardData.filename
              };
            }

            return null;
          }
        },
        urlTemplate: '{base}/w_{width},f_{format}/v1234567890/{publicId}',
        widths: [400, 800, 1200, 1600],
        formats: ['auto'],
        type: 'srcset'
      }
    ]
  },

  standard: {
    name: 'standard',
    description: 'Standard responsive image configuration',
    transforms: [
      {
        selector: 'img',
        extract: {
          pattern: /^(.*\/)([^\/]+)\.([^.]+)$/,
          groups: {
            basePath: 1,
            filename: 2,
            ext: 3
          }
        },
        urlTemplate: '{basePath}/{filename}_{width}w.{format}',
        widths: [320, 640, 960, 1280, 1920],
        formats: ['webp', 'original'],
        type: 'picture',
        sizes: '(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw',
        loading: 'lazy'
      }
    ]
  }
};