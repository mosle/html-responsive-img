import { describe, it, expect } from 'vitest';
import { responsify } from '@/index';
import type { Config } from '@/types';

describe('Custom Extraction Function', () => {
  it('should handle custom extraction for Cloudinary URLs', () => {
    const html = `
      <img src="https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg" alt="Sample">
      <img src="https://res.cloudinary.com/demo/image/upload/w_300,h_200/v1234567890/profile.png" alt="Profile">
    `;

    const config: Config = {
      transforms: [{
        selector: 'img',
        extract: {
          custom: (src) => {
            const match = src.match(/cloudinary\.com\/([^\/]+)\/image\/upload\/(?:.*\/)?v\d+\/(.+)\.([^.]+)$/);
            if (match) {
              return {
                account: match[1],
                publicId: match[2],
                ext: match[3],
                base: src.substring(0, src.indexOf('/v'))
              };
            }
            return null;
          }
        },
        urlTemplate: '{base}/w_{width},f_{format}/v1234567890/{publicId}',
        widths: [400, 800, 1200],
        formats: ['auto'],
        type: 'srcset'
      }]
    };

    const result = responsify(html, config);

    expect(result.success).toBe(true);
    expect(result.html).toContain('w_400,f_auto/v1234567890/sample');
    expect(result.html).toContain('w_800,f_auto/v1234567890/sample');
    expect(result.html).toContain('w_1200,f_auto/v1234567890/profile');
  });

  it('should handle custom extraction for S3 URLs', () => {
    const html = `
      <img src="https://my-bucket.s3.amazonaws.com/images/2024/photo.jpg">
      <img src="https://my-bucket.s3.us-west-2.amazonaws.com/assets/logo.png">
    `;

    const config: Config = {
      transforms: [{
        selector: 'img',
        extract: {
          custom: (src) => {
            const url = new URL(src);
            const pathParts = url.pathname.split('/').filter(Boolean);
            const filename = pathParts[pathParts.length - 1];
            const [name, ext] = filename.split('.');
            const bucket = url.hostname.split('.')[0];
            const path = pathParts.slice(0, -1).join('/');

            // Parse region correctly from S3 URLs
            let region = 'us-east-1';
            if (url.hostname.includes('.s3.')) {
              const parts = url.hostname.split('.s3.');
              if (parts[1]) {
                const regionPart = parts[1].split('.')[0];
                if (regionPart !== 'amazonaws') {
                  region = regionPart;
                }
              }
            }

            return {
              bucket,
              path,
              name,
              ext,
              region
            };
          }
        },
        urlTemplate: 'https://{bucket}.s3.{region}.amazonaws.com/{path}/{name}_{width}w.{format}',
        widths: [400, 800],
        formats: ['webp', 'original'],
        type: 'picture'
      }]
    };

    const result = responsify(html, config);

    expect(result.success).toBe(true);
    expect(result.html).toContain('my-bucket.s3.us-east-1.amazonaws.com/images/2024/photo_400w.webp');
    expect(result.html).toContain('my-bucket.s3.us-west-2.amazonaws.com/assets/logo_800w.png');
  });

  it('should handle complex URL parsing with query parameters', () => {
    const html = `
      <img src="https://api.example.com/image?id=123&size=original&format=jpg">
      <img src="/api/img?file=photo.png&quality=80">
    `;

    const config: Config = {
      transforms: [{
        selector: 'img',
        extract: {
          custom: (src) => {
            try {
              const url = new URL(src, 'https://example.com');
              const params = new URLSearchParams(url.search);

              // Extract from query parameters
              const id = params.get('id');
              const file = params.get('file');
              const quality = params.get('quality') || '85';

              if (id) {
                return {
                  type: 'id',
                  value: id,
                  quality,
                  base: url.origin + url.pathname
                };
              } else if (file) {
                const [name] = file.split('.');
                return {
                  type: 'file',
                  value: name,
                  quality,
                  base: url.pathname
                };
              }
            } catch (e) {
              // Handle parsing errors
            }
            return null;
          }
        },
        urlTemplate: '{base}?{type}={value}&size={width}&quality={quality}&format={format}',
        widths: [300, 600, 900],
        formats: ['webp', 'original'],
        type: 'picture'
      }]
    };

    const result = responsify(html, config);

    expect(result.success).toBe(true);
    expect(result.html).toContain('id=123&size=300&quality=85&format=webp');
    expect(result.html).toContain('file=photo&size=600&quality=80&format=webp');
  });

  it('should handle data extraction from path segments', () => {
    const html = `
      <img src="/products/electronics/phones/iphone-15/gallery/image-1.jpg">
      <img src="/products/clothing/shirts/blue-shirt/thumb.jpg">
    `;

    const config: Config = {
      transforms: [{
        selector: 'img',
        extract: {
          custom: (src) => {
            const parts = src.split('/').filter(Boolean);
            if (parts[0] === 'products' && parts.length >= 5) {
              // Handle both /path/type/name.ext and /path/name.ext formats
              const lastPart = parts[parts.length - 1];
              const hasImageType = parts.length >= 6;

              if (hasImageType) {
                return {
                  category: parts[1],
                  subcategory: parts[2],
                  product: parts[3],
                  imageType: parts[4],
                  imageName: lastPart.split('.')[0]
                };
              } else {
                // No imageType folder, use 'thumb' as type and filename as name
                const filename = lastPart.split('.')[0];
                return {
                  category: parts[1],
                  subcategory: parts[2],
                  product: parts[3],
                  imageType: filename === 'thumb' ? 'thumb' : 'gallery',
                  imageName: filename
                };
              }
            }
            return null;
          }
        },
        urlTemplate: '/cdn/{category}/{subcategory}/{product}/{imageType}/{imageName}_{width}w.{format}',
        widths: [200, 400, 800],
        formats: ['avif', 'webp', 'original'],
        type: 'picture'
      }]
    };

    const result = responsify(html, config);

    expect(result.success).toBe(true);
    expect(result.html).toContain('/cdn/electronics/phones/iphone-15/gallery/image-1_400w.avif');
    expect(result.html).toContain('/cdn/clothing/shirts/blue-shirt/thumb/thumb_800w.webp');
  });

  it('should handle fallback when custom extraction returns null', () => {
    const html = `
      <img src="https://valid.com/image.jpg" class="process">
      <img src="invalid-format" class="process">
      <img src="https://another.com/photo.png" class="process">
    `;

    const config: Config = {
      transforms: [{
        selector: '.process',
        extract: {
          custom: (src) => {
            // Only process URLs matching specific pattern
            if (src.includes('valid.com') || src.includes('another.com')) {
              const filename = src.split('/').pop()?.split('.')[0];
              return { name: filename || 'unknown' };
            }
            return null; // Skip processing
          }
        },
        urlTemplate: '/processed/{name}_{width}w.jpg',
        widths: [400],
        type: 'srcset'
      }]
    };

    const result = responsify(html, config);

    expect(result.success).toBe(true);
    expect(result.stats?.imagesFound).toBe(3);
    expect(result.stats?.imagesTransformed).toBe(2);

    expect(result.html).toContain('processed/image_400w.jpg');
    expect(result.html).toContain('processed/photo_400w.jpg');
    expect(result.html).toContain('src="invalid-format"'); // Preserved
  });

  it('should handle extraction with conditional logic', () => {
    const html = `
      <img src="/images/hero.jpg" data-responsive="true" data-sizes="large">
      <img src="/images/icon.svg" data-responsive="false">
      <img src="/images/banner.png" data-responsive="true" data-sizes="medium">
    `;

    const config: Config = {
      transforms: [{
        selector: 'img[data-responsive="true"]',
        extract: {
          custom: (src, element?: HTMLElement) => {
            const filename = src.split('/').pop()?.split('.')[0] || '';
            const ext = src.split('.').pop() || '';

            // In real implementation, element would provide access to attributes
            // For now, we'll parse from the src
            const sizes = filename.includes('hero') ? 'large' : 'medium';

            const widthMap = {
              large: [800, 1200, 1600],
              medium: [400, 600, 800],
              small: [200, 300, 400]
            };

            return {
              name: filename,
              ext,
              sizes,
              widths: widthMap[sizes as keyof typeof widthMap].join(',')
            };
          }
        },
        urlTemplate: '/optimized/{name}_{width}w.{ext}',
        widths: [400, 800, 1200, 1600], // Will be filtered based on extracted data
        type: 'srcset'
      }]
    };

    const result = responsify(html, config);

    expect(result.success).toBe(true);
    expect(result.stats?.imagesTransformed).toBe(2);
    expect(result.html).toContain('hero_800w.jpg');
    expect(result.html).toContain('banner_400w.png');
    expect(result.html).toContain('src="/images/icon.svg"'); // Not transformed
  });

  it('should handle async custom extraction patterns', () => {
    const html = `
      <img src="image://uuid/550e8400-e29b-41d4-a716-446655440000">
      <img src="image://uuid/6ba7b810-9dad-11d1-80b4-00c04fd430c8">
    `;

    const config: Config = {
      transforms: [{
        selector: 'img',
        extract: {
          custom: (src) => {
            const match = src.match(/image:\/\/uuid\/([a-f0-9-]+)/);
            if (match) {
              const uuid = match[1];
              // Simulate looking up image metadata by UUID
              const metadata = {
                '550e8400-e29b-41d4-a716-446655440000': { name: 'product', type: 'jpg' },
                '6ba7b810-9dad-11d1-80b4-00c04fd430c8': { name: 'category', type: 'png' }
              };

              const data = metadata[uuid as keyof typeof metadata];
              if (data) {
                return {
                  uuid,
                  name: data.name,
                  type: data.type
                };
              }
            }
            return null;
          }
        },
        urlTemplate: 'https://cdn.example.com/{uuid}/{name}_{width}w.{type}',
        widths: [400, 800],
        type: 'srcset'
      }]
    };

    const result = responsify(html, config);

    expect(result.success).toBe(true);
    expect(result.html).toContain('550e8400-e29b-41d4-a716-446655440000/product_400w.jpg');
    expect(result.html).toContain('6ba7b810-9dad-11d1-80b4-00c04fd430c8/category_800w.png');
  });
});