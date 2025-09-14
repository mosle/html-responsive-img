import { describe, it, expect } from 'vitest';
import type { Config, TransformResult } from '@/types';
import { responsify, responsifyAsync } from '@/index';

describe('Core Transformation API', () => {
  describe('responsify', () => {
    it('should transform a simple img tag to picture element', () => {
      const html = '<img src="https://example.com/image.jpg" alt="Test">';
      const config: Config = {
        transforms: [{
          selector: 'img',
          extract: {
            pattern: /^(.+)\/([^\/]+)\.([^.]+)$/,
            groups: { basePath: 1, filename: 2, ext: 3 }
          },
          urlTemplate: '{basePath}/{filename}_{width}w.{format}',
          widths: [400, 800],
          formats: ['webp', 'original'],
          type: 'picture'
        }]
      };

      const result = responsify(html, config);

      expect(result.success).toBe(true);
      expect(result.html).toContain('<picture>');
      expect(result.html).toContain('image_400w.webp');
      expect(result.html).toContain('image_800w.jpg');
      expect(result.stats?.imagesTransformed).toBe(1);
    });

    it('should transform img tag to srcset', () => {
      const html = '<img src="https://example.com/photo.png" class="responsive">';
      const config: Config = {
        transforms: [{
          selector: '.responsive',
          extract: {
            pattern: /^(.+)\/([^\/]+)\.([^.]+)$/,
            groups: { basePath: 1, filename: 2, ext: 3 }
          },
          urlTemplate: '{basePath}/{filename}_{width}w.{ext}',
          widths: [320, 640, 1280],
          type: 'srcset',
          sizes: '(max-width: 640px) 100vw, 50vw'
        }]
      };

      const result = responsify(html, config);

      expect(result.success).toBe(true);
      expect(result.html).toContain('srcset=');
      expect(result.html).toContain('photo_320w.png 320w');
      expect(result.html).toContain('photo_640w.png 640w');
      expect(result.html).toContain('photo_1280w.png 1280w');
      expect(result.html).toContain('sizes="(max-width: 640px) 100vw, 50vw"');
    });

    it('should handle multiple transformation rules', () => {
      const html = `
        <img src="https://example.com/hero.jpg" class="hero">
        <img src="https://example.com/thumb.jpg" class="thumbnail">
      `;
      const config: Config = {
        transforms: [
          {
            selector: '.hero',
            extract: {
              pattern: /^(.+)\/([^\/]+)\.([^.]+)$/,
              groups: { basePath: 1, filename: 2, ext: 3 }
            },
            urlTemplate: '{basePath}/{filename}_{width}w.{format}',
            widths: [1200, 1800],
            formats: ['avif', 'webp', 'original'],
            type: 'picture'
          },
          {
            selector: '.thumbnail',
            extract: {
              pattern: /^(.+)\/([^\/]+)\.([^.]+)$/,
              groups: { basePath: 1, filename: 2, ext: 3 }
            },
            urlTemplate: '{basePath}/{filename}_{width}w.{ext}',
            widths: [150, 300],
            type: 'srcset'
          }
        ]
      };

      const result = responsify(html, config);

      expect(result.success).toBe(true);
      expect(result.stats?.imagesTransformed).toBe(2);
      expect(result.stats?.rulesApplied).toBe(2);
    });

    it('should preserve original attributes', () => {
      const html = '<img src="test.jpg" alt="Test" class="image" id="main" data-info="value">';
      const config: Config = {
        transforms: [{
          selector: 'img',
          extract: {
            custom: (src) => ({ base: '', name: 'test', ext: 'jpg' })
          },
          urlTemplate: '{name}_{width}w.{ext}',
          widths: [400],
          type: 'srcset'
        }]
      };

      const result = responsify(html, config);

      expect(result.html).toContain('alt="Test"');
      expect(result.html).toContain('class="image"');
      expect(result.html).toContain('id="main"');
      expect(result.html).toContain('data-info="value"');
    });

    it('should handle invalid HTML gracefully', () => {
      const html = '<img src="test.jpg" <div>broken</div>';
      const config: Config = {
        transforms: [{
          selector: 'img',
          extract: { custom: (src) => ({ name: 'test' }) },
          urlTemplate: '{name}_{width}w.jpg',
          widths: [400],
          type: 'srcset'
        }]
      };

      const result = responsify(html, config);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid HTML');
    });

    it('should skip images that don\'t match selectors', () => {
      const html = `
        <img src="match.jpg" class="responsive">
        <img src="skip.jpg">
      `;
      const config: Config = {
        transforms: [{
          selector: '.responsive',
          extract: { custom: (src) => ({ name: 'match' }) },
          urlTemplate: '{name}_{width}w.jpg',
          widths: [400],
          type: 'srcset'
        }]
      };

      const result = responsify(html, config);

      expect(result.success).toBe(true);
      expect(result.stats?.imagesFound).toBe(2);
      expect(result.stats?.imagesTransformed).toBe(1);
      expect(result.html).toContain('skip.jpg');
    });
  });

  describe('responsifyAsync', () => {
    it('should handle large HTML documents asynchronously', async () => {
      const images = Array.from({ length: 100 }, (_, i) =>
        `<img src="https://example.com/image${i}.jpg">`
      );
      const html = `<div>${images.join('')}</div>`;

      const config: Config = {
        transforms: [{
          selector: 'img',
          extract: {
            pattern: /image(\d+)\.jpg$/,
            groups: { num: 1 }
          },
          urlTemplate: 'image{num}_{width}w.jpg',
          widths: [400, 800],
          type: 'srcset'
        }]
      };

      const result = await responsifyAsync(html, config);

      expect(result.success).toBe(true);
      expect(result.stats?.imagesTransformed).toBe(100);
    });
  });
});