import { describe, it, expect } from 'vitest';
import { TransformError, ErrorCode } from '@/types/errors';
import { responsify } from '@/index';
import type { Config } from '@/types';

describe('Error Handling', () => {
  describe('TransformError', () => {
    it('should create error with proper code', () => {
      const error = new TransformError(
        ErrorCode.INVALID_CONFIG,
        'Invalid configuration',
        { config: {} }
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(TransformError);
      expect(error.code).toBe(ErrorCode.INVALID_CONFIG);
      expect(error.message).toBe('Invalid configuration');
      expect(error.context).toEqual({ config: {} });
    });

    it('should handle INVALID_HTML error', () => {
      const error = new TransformError(
        ErrorCode.INVALID_HTML,
        'HTML parsing failed',
        { html: '<img src=' }
      );

      expect(error.code).toBe(ErrorCode.INVALID_HTML);
      expect(error.context?.html).toBe('<img src=');
    });

    it('should handle EXTRACTION_FAILED error', () => {
      const error = new TransformError(
        ErrorCode.EXTRACTION_FAILED,
        'Could not extract URL components',
        { url: 'invalid-url', pattern: '/test/' }
      );

      expect(error.code).toBe(ErrorCode.EXTRACTION_FAILED);
      expect(error.context?.url).toBe('invalid-url');
    });

    it('should handle GENERATION_FAILED error', () => {
      const error = new TransformError(
        ErrorCode.GENERATION_FAILED,
        'Failed to generate URL',
        { template: '{missing}', data: {} }
      );

      expect(error.code).toBe(ErrorCode.GENERATION_FAILED);
      expect(error.context?.template).toBe('{missing}');
    });

    it('should handle SELECTOR_ERROR', () => {
      const error = new TransformError(
        ErrorCode.SELECTOR_ERROR,
        'Invalid CSS selector',
        { selector: '>>>' }
      );

      expect(error.code).toBe(ErrorCode.SELECTOR_ERROR);
      expect(error.context?.selector).toBe('>>>');
    });
  });

  describe('Error handling in responsify', () => {
    it('should handle extraction failures gracefully', () => {
      const html = '<img src="invalid-url">';
      const config: Config = {
        transforms: [{
          selector: 'img',
          extract: {
            pattern: /^https:\/\//,
            groups: {}
          },
          urlTemplate: 'test',
          widths: [400],
          type: 'picture'
        }]
      };

      const result = responsify(html, config);

      // Extraction failure means image is not transformed but process succeeds
      expect(result.success).toBe(true);
      expect(result.html).toBe(html); // Original HTML unchanged
      expect(result.stats?.imagesTransformed).toBe(0);
    });

    it('should handle invalid selector gracefully', () => {
      const html = '<img src="test.jpg">';
      const config: Config = {
        transforms: [{
          selector: '>>>invalid',
          extract: { custom: () => ({}) },
          urlTemplate: 'test',
          widths: [400],
          type: 'picture'
        }]
      };

      const result = responsify(html, config);

      expect(result.success).toBe(false);
      expect(result.error).toContain('selector');
    });

    it('should handle malformed HTML gracefully', () => {
      const html = '<img src="test.jpg" <div>broken</div>';
      const config: Config = {
        transforms: [{
          selector: 'img',
          extract: { custom: () => ({ name: 'test' }) },
          urlTemplate: '{name}_{width}w.jpg',
          widths: [400],
          type: 'srcset'
        }]
      };

      const result = responsify(html, config);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle custom extraction function errors', () => {
      const html = '<img src="test.jpg">';
      const config: Config = {
        transforms: [{
          selector: 'img',
          extract: {
            custom: () => {
              throw new Error('Custom extraction failed');
            }
          },
          urlTemplate: 'test',
          widths: [400],
          type: 'picture'
        }]
      };

      const result = responsify(html, config);

      expect(result.success).toBe(false);
      expect(result.error).toContain('extraction');
    });

    it('should handle empty extraction result', () => {
      const html = '<img src="test.jpg">';
      const config: Config = {
        transforms: [{
          selector: 'img',
          extract: {
            custom: () => ({})
          },
          urlTemplate: '{name}_{width}w.jpg',
          widths: [400],
          type: 'srcset'
        }]
      };

      const result = responsify(html, config);

      // Should handle gracefully - image not transformed due to empty extraction
      expect(result.success).toBe(true);
      expect(result.html).toBe(html); // Image remains unchanged
    });

    it('should provide detailed error context', () => {
      const html = '<img src="test.jpg">';
      const config: Config = {
        transforms: [{
          selector: 'img',
          extract: {
            pattern: /^https:/,
            groups: { domain: 1 }
          },
          urlTemplate: '{domain}/image.jpg',
          widths: [400],
          type: 'picture'
        }]
      };

      const result = responsify(html, config);

      // Pattern doesn't match, so image is not transformed
      expect(result.success).toBe(true);
      expect(result.html).toBe(html);
      expect(result.stats?.imagesTransformed).toBe(0);
    });
  });

  describe('Error Recovery', () => {
    it('should continue processing after single image failure', () => {
      const html = `
        <img src="https://example.com/good.jpg" class="process">
        <img src="bad-url" class="process">
        <img src="https://example.com/another.jpg" class="process">
      `;

      const config: Config = {
        transforms: [{
          selector: '.process',
          extract: {
            pattern: /^https:\/\/(.+)\/([^\/]+)\.([^.]+)$/,
            groups: { domain: 1, name: 2, ext: 3 }
          },
          urlTemplate: 'https://{domain}/{name}_{width}w.{ext}',
          widths: [400],
          type: 'srcset'
        }]
      };

      const result = responsify(html, config);

      expect(result.success).toBe(true);
      expect(result.stats?.imagesFound).toBe(3);
      expect(result.stats?.imagesTransformed).toBe(2);
      expect(result.html).toContain('good_400w.jpg');
      expect(result.html).toContain('another_400w.jpg');
      expect(result.html).toContain('bad-url'); // Original preserved
    });

    it('should preserve original on transformation failure', () => {
      const html = '<img src="test.jpg" alt="Important">';
      const config: Config = {
        transforms: [{
          selector: 'img',
          extract: {
            custom: () => null as any // Force extraction failure
          },
          urlTemplate: 'test',
          widths: [400],
          type: 'picture'
        }]
      };

      const result = responsify(html, config);

      expect(result.success).toBe(true);
      expect(result.html).toBe(html); // Original HTML preserved
      expect(result.stats?.imagesTransformed).toBe(0);
    });
  });
});