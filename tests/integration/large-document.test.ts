import { describe, it, expect } from 'vitest';
import { responsify, responsifyAsync } from '@/index';
import type { Config } from '@/types';

describe('Large HTML Document Processing', () => {
  const generateLargeHTML = (imageCount: number): string => {
    const images = Array.from({ length: imageCount }, (_, i) =>
      `<img src="https://cdn.example.com/image${i}.jpg" alt="Image ${i}" class="gallery-item">`
    );

    return `
      <!DOCTYPE html>
      <html>
      <head><title>Large Gallery</title></head>
      <body>
        <header>
          <img src="/logo.png" alt="Logo" class="logo">
        </header>
        <main>
          <div class="gallery">
            ${images.join('\n            ')}
          </div>
        </main>
        <footer>
          <img src="/footer-bg.jpg" alt="Footer" class="footer-image">
        </footer>
      </body>
      </html>
    `;
  };

  it('should handle documents with 100+ images synchronously', () => {
    const html = generateLargeHTML(100);

    const config: Config = {
      transforms: [{
        selector: '.gallery-item',
        extract: {
          pattern: /image(\d+)\.jpg$/,
          groups: { num: 1 }
        },
        urlTemplate: 'https://cdn.example.com/optimized/image{num}_{width}w.jpg',
        widths: [200, 400, 800],
        type: 'srcset'
      }]
    };

    const startTime = Date.now();
    const result = responsify(html, config);
    const processingTime = Date.now() - startTime;

    expect(result.success).toBe(true);
    expect(result.stats?.imagesFound).toBe(102); // 100 gallery + logo + footer
    expect(result.stats?.imagesTransformed).toBe(100);
    expect(processingTime).toBeLessThan(1000); // Should process in under 1 second

    // Check some transformed images
    expect(result.html).toContain('image0_200w.jpg 200w');
    expect(result.html).toContain('image50_400w.jpg 400w');
    expect(result.html).toContain('image99_800w.jpg 800w');
  });

  it('should handle documents with 500+ images asynchronously', async () => {
    const html = generateLargeHTML(500);

    const config: Config = {
      transforms: [{
        selector: '.gallery-item',
        extract: {
          pattern: /image(\d+)\.jpg$/,
          groups: { num: 1 }
        },
        urlTemplate: 'https://cdn.example.com/opt/img{num}_{width}w.jpg',
        widths: [400, 800],
        type: 'srcset',
        sizes: '(max-width: 768px) 100vw, 50vw'
      }]
    };

    const startTime = Date.now();
    const result = await responsifyAsync(html, config);
    const processingTime = Date.now() - startTime;

    expect(result.success).toBe(true);
    expect(result.stats?.imagesTransformed).toBe(500);
    expect(result.stats?.processingTime).toBeDefined();
    expect(processingTime).toBeLessThan(5000); // Should process in under 5 seconds

    // Verify transformation
    expect(result.html).toContain('img0_400w.jpg');
    expect(result.html).toContain('img499_800w.jpg');
    expect(result.html).toContain('sizes="(max-width: 768px) 100vw, 50vw"');
  });

  it('should maintain performance with complex transformations', () => {
    const html = generateLargeHTML(50);

    const config: Config = {
      transforms: [
        {
          selector: '.gallery-item',
          extract: {
            custom: (src) => {
              const match = src.match(/image(\d+)/);
              const num = parseInt(match?.[1] || '0');
              return {
                num: match?.[1] || '0',
                type: num % 2 === 0 ? 'even' : 'odd'
              };
            }
          },
          urlTemplate: '/{type}/image{num}_{width}w.{format}',
          widths: [300, 600, 900],
          formats: ['webp', 'original'],
          type: 'picture'
        }
      ]
    };

    const startTime = Date.now();
    const result = responsify(html, config);
    const processingTime = Date.now() - startTime;

    expect(result.success).toBe(true);
    expect(result.stats?.imagesTransformed).toBe(50);
    expect(processingTime).toBeLessThan(500); // Complex rules should still be fast

    // Check transformations
    expect(result.html).toContain('<picture>');
    expect(result.html).toContain('/odd/image1_');
    expect(result.html).toContain('/even/image0_');
  });

  it('should handle deeply nested HTML structures efficiently', () => {
    const generateNestedHTML = (depth: number, imagesPerLevel: number): string => {
      const generateLevel = (level: number): string => {
        if (level === 0) {
          return Array.from({ length: imagesPerLevel }, (_, i) =>
            `<img src="/level${depth}-image${i}.jpg" class="nested-image">`
          ).join('');
        }
        return `
          <div class="level-${depth - level}">
            ${Array.from({ length: imagesPerLevel }, (_, i) =>
              `<img src="/level${depth - level}-image${i}.jpg" class="nested-image">`
            ).join('')}
            ${generateLevel(level - 1)}
          </div>
        `;
      };

      return generateLevel(depth);
    };

    const html = generateNestedHTML(10, 5); // 10 levels deep, 5 images per level

    const config: Config = {
      transforms: [{
        selector: '.nested-image',
        extract: {
          pattern: /level(\d+)-image(\d+)\.jpg$/,
          groups: { level: 1, num: 2 }
        },
        urlTemplate: '/opt/l{level}/img{num}_{width}w.jpg',
        widths: [400],
        type: 'srcset'
      }]
    };

    const result = responsify(html, config);

    expect(result.success).toBe(true);
    expect(result.stats?.imagesTransformed).toBe(55); // 11 levels * 5 images
    expect(result.html).toContain('l0/img0_400w.jpg');
    expect(result.html).toContain('l10/img4_400w.jpg');
  });

  it('should provide accurate processing statistics', async () => {
    const html = generateLargeHTML(200);

    const config: Config = {
      transforms: [
        {
          selector: '.gallery-item',
          extract: {
            custom: (src) => {
              const match = src.match(/image(\d+)\.jpg$/);
              const num = parseInt(match?.[1] || '0');
              // Only transform first 100
              if (num < 100) {
                return { num: match?.[1] || '0' };
              }
              return null;
            }
          },
          urlTemplate: '/first/{num}_{width}w.jpg',
          widths: [400, 800],
          type: 'srcset'
        },
        {
          selector: '.logo',
          extract: { custom: () => ({ name: 'logo' }) },
          urlTemplate: '/assets/{name}_{width}w.png',
          widths: [100, 200],
          type: 'srcset'
        }
      ]
    };

    const result = await responsifyAsync(html, config);

    expect(result.success).toBe(true);
    expect(result.stats).toBeDefined();
    expect(result.stats?.imagesFound).toBe(202); // 200 gallery + logo + footer
    expect(result.stats?.imagesTransformed).toBe(101); // 100 gallery + logo
    expect(result.stats?.rulesApplied).toBeGreaterThan(0); // At least some rules applied
    expect(result.stats?.processingTime).toBeGreaterThan(0);
  });

  it('should handle memory efficiently with very large documents', async () => {
    // Generate a document with many images and lots of other content
    const images = Array.from({ length: 1000 }, (_, i) =>
      `<div class="item">
        <img src="/img${i}.jpg" class="photo">
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
      </div>`
    ).join('\n');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Huge Document</title>
        <style>${'body { margin: 0; } '.repeat(1000)}</style>
      </head>
      <body>
        ${images}
      </body>
      </html>
    `;

    const config: Config = {
      transforms: [{
        selector: '.photo',
        extract: {
          pattern: /img(\d+)\.jpg$/,
          groups: { id: 1 }
        },
        urlTemplate: '/cdn/img{id}_{width}w.jpg',
        widths: [400],
        type: 'srcset'
      }]
    };

    const result = await responsifyAsync(html, config);

    expect(result.success).toBe(true);
    expect(result.stats?.imagesTransformed).toBe(1000);
    // Original structure should be preserved
    expect(result.html).toContain('Lorem ipsum dolor sit amet');
    expect(result.html).toContain('<style>');
  });
});