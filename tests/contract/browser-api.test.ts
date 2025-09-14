import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import type { Config } from '@/types';

describe('Browser-specific Functions', () => {
  let dom: JSDOM;
  let originalDocument: any;
  let originalWindow: any;

  beforeEach(() => {
    // Setup JSDOM
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="test-container">
            <img src="test1.jpg" alt="Test 1" class="responsive">
            <img src="test2.jpg" alt="Test 2">
          </div>
        </body>
      </html>
    `, { url: 'http://localhost' });

    // Store originals
    originalDocument = global.document;
    originalWindow = global.window;

    // Set globals
    global.document = dom.window.document as any;
    global.window = dom.window as any;
    global.HTMLElement = dom.window.HTMLElement as any;
    global.DOMParser = dom.window.DOMParser as any;
  });

  afterEach(() => {
    // Restore originals
    global.document = originalDocument;
    global.window = originalWindow;
  });

  describe('transformDocument', () => {
    it('should transform all images in document', async () => {
      const { transformDocument } = await import('@/browser');

      const config: Config = {
        transforms: [{
          selector: 'img',
          extract: {
            pattern: /^(.+)\.([^.]+)$/,
            groups: { name: 1, ext: 2 }
          },
          urlTemplate: '{name}_{width}w.{ext}',
          widths: [400, 800],
          type: 'srcset'
        }]
      };

      const count = transformDocument(config);

      expect(count).toBe(2);

      // Check that images were transformed
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        expect(img.hasAttribute('srcset')).toBe(true);
        const srcset = img.getAttribute('srcset');
        expect(srcset).toContain('400w');
        expect(srcset).toContain('800w');
      });
    });

    it('should handle no images in document', async () => {
      const { transformDocument } = await import('@/browser');

      // Clear images
      document.body.innerHTML = '<div>No images here</div>';

      const config: Config = {
        transforms: [{
          selector: 'img',
          extract: { custom: () => ({ name: 'test' }) },
          urlTemplate: 'test_{width}w.jpg',
          widths: [400],
          type: 'srcset'
        }]
      };

      const count = transformDocument(config);

      expect(count).toBe(0);
    });
  });

  describe('transformElement', () => {
    it('should transform images within specific element', async () => {
      const { transformElement } = await import('@/browser');

      const config: Config = {
        transforms: [{
          selector: 'img',
          extract: {
            pattern: /^(.+)\.([^.]+)$/,
            groups: { name: 1, ext: 2 }
          },
          urlTemplate: '{name}_{width}w.{ext}',
          widths: [400],
          type: 'srcset'
        }]
      };

      const container = document.getElementById('test-container');
      expect(container).toBeTruthy();

      const count = transformElement(container as HTMLElement, config);

      expect(count).toBe(2);

      const images = container!.querySelectorAll('img');
      images.forEach(img => {
        expect(img.hasAttribute('srcset')).toBe(true);
      });
    });

    it('should handle element with no matching images', async () => {
      const { transformElement } = await import('@/browser');

      const config: Config = {
        transforms: [{
          selector: '.non-existent',
          extract: { custom: () => ({ name: 'test' }) },
          urlTemplate: 'test_{width}w.jpg',
          widths: [400],
          type: 'srcset'
        }]
      };

      const container = document.getElementById('test-container');
      const count = transformElement(container as HTMLElement, config);

      expect(count).toBe(0);
    });

    it('should apply selector filtering within element', async () => {
      const { transformElement } = await import('@/browser');

      const config: Config = {
        transforms: [{
          selector: '.responsive',
          extract: {
            pattern: /^(.+)\.([^.]+)$/,
            groups: { name: 1, ext: 2 }
          },
          urlTemplate: '{name}_{width}w.{ext}',
          widths: [400],
          type: 'srcset'
        }]
      };

      const container = document.getElementById('test-container');
      const count = transformElement(container as HTMLElement, config);

      expect(count).toBe(1); // Only .responsive image

      const responsiveImg = container!.querySelector('.responsive') as HTMLImageElement;
      expect(responsiveImg.hasAttribute('srcset')).toBe(true);

      const otherImg = container!.querySelector('img:not(.responsive)') as HTMLImageElement;
      expect(otherImg.hasAttribute('srcset')).toBe(false);
    });
  });
});