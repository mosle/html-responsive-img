import { describe, it, expect } from 'vitest';
import { responsify } from '@/index';
import type { Config } from '@/types';

describe('Srcset Attribute Generation', () => {
  it('should generate srcset attribute with multiple widths', () => {
    const html = '<img src="https://cdn.example.com/photo.jpg" alt="Photo">';

    const config: Config = {
      transforms: [{
        selector: 'img',
        extract: {
          pattern: /^(.+)\/([^\/]+)\.([^.]+)$/,
          groups: { basePath: 1, filename: 2, ext: 3 }
        },
        urlTemplate: '{basePath}/{filename}_{width}w.{ext}',
        widths: [320, 640, 960, 1280, 1920],
        type: 'srcset'
      }]
    };

    const result = responsify(html, config);

    expect(result.success).toBe(true);
    expect(result.html).toContain('srcset="');
    expect(result.html).toContain('photo_320w.jpg 320w');
    expect(result.html).toContain('photo_640w.jpg 640w');
    expect(result.html).toContain('photo_960w.jpg 960w');
    expect(result.html).toContain('photo_1280w.jpg 1280w');
    expect(result.html).toContain('photo_1920w.jpg 1920w');
    expect(result.html).toContain('alt="Photo"');
  });

  it('should add sizes attribute when specified', () => {
    const html = '<img src="/images/responsive.png" class="responsive">';

    const config: Config = {
      transforms: [{
        selector: '.responsive',
        extract: {
          custom: (src) => {
            const parts = src.split('/');
            const filename = parts[parts.length - 1].split('.')[0];
            return {
              path: '/cdn/images',
              name: filename,
              ext: 'png'
            };
          }
        },
        urlTemplate: '{path}/{name}_{width}w.{ext}',
        widths: [400, 800, 1200],
        type: 'srcset',
        sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px'
      }]
    };

    const result = responsify(html, config);

    expect(result.html).toContain('sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"');
    expect(result.html).toContain('srcset=');
    expect(result.html).toContain('responsive_400w.png 400w');
  });

  it('should update src to appropriate default size', () => {
    const html = '<img src="/small.jpg">';

    const config: Config = {
      transforms: [{
        selector: 'img',
        extract: { custom: () => ({ name: 'image' }) },
        urlTemplate: '/optimized/{name}_{width}w.jpg',
        widths: [200, 400, 800, 1600],
        type: 'srcset'
      }]
    };

    const result = responsify(html, config);

    // Should pick a middle size as default
    expect(result.html).toMatch(/src="\/optimized\/image_[48]00w\.jpg"/);
  });

  it('should handle single width srcset', () => {
    const html = '<img src="thumbnail.jpg">';

    const config: Config = {
      transforms: [{
        selector: 'img',
        extract: { custom: () => ({ name: 'thumbnail' }) },
        urlTemplate: '{name}_{width}w.jpg',
        widths: [150],
        type: 'srcset'
      }]
    };

    const result = responsify(html, config);

    expect(result.html).toContain('srcset="thumbnail_150w.jpg 150w"');
    expect(result.html).toContain('src="thumbnail_150w.jpg"');
  });

  it('should preserve existing attributes while adding srcset', () => {
    const html = `<img
      src="/original.jpg"
      alt="Original"
      class="lazy loaded"
      id="main-image"
      data-index="1"
      loading="lazy"
    >`;

    const config: Config = {
      transforms: [{
        selector: '#main-image',
        extract: { custom: () => ({ base: '/cdn' }) },
        urlTemplate: '{base}/img_{width}w.jpg',
        widths: [400, 800],
        type: 'srcset',
        sizes: '100vw'
      }]
    };

    const result = responsify(html, config);

    expect(result.html).toContain('alt="Original"');
    expect(result.html).toContain('class="lazy loaded"');
    expect(result.html).toContain('id="main-image"');
    expect(result.html).toContain('data-index="1"');
    expect(result.html).toContain('loading="lazy"');
    expect(result.html).toContain('srcset=');
    expect(result.html).toContain('sizes="100vw"');
  });

  it('should handle srcset with custom format', () => {
    const html = '<img src="image.jpg">';

    const config: Config = {
      transforms: [{
        selector: 'img',
        extract: { custom: () => ({ name: 'image' }) },
        urlTemplate: '{name}_{width}w.{format}',
        widths: [400, 800],
        formats: ['webp'], // Even with format, srcset uses single format
        type: 'srcset'
      }]
    };

    const result = responsify(html, config);

    expect(result.html).toContain('srcset="image_400w.webp 400w, image_800w.webp 800w"');
    expect(result.html).toContain('src="image_800w.webp"'); // Middle size selected as default
  });

  it('should handle complex URL patterns in srcset', () => {
    const html = '<img src="https://cdn.example.com/v1/images/photo.jpg?quality=80">';

    const config: Config = {
      transforms: [{
        selector: 'img',
        extract: {
          custom: (src) => {
            const url = new URL(src);
            const pathParts = url.pathname.split('/');
            const filename = pathParts[pathParts.length - 1].split('.')[0];
            return {
              base: url.origin,
              version: pathParts[1],
              path: pathParts.slice(2, -1).join('/'),
              name: filename,
              query: url.search
            };
          }
        },
        urlTemplate: '{base}/{version}/{path}/{name}_{width}w.jpg{query}',
        widths: [480, 960, 1440],
        type: 'srcset'
      }]
    };

    const result = responsify(html, config);

    expect(result.html).toContain('photo_480w.jpg?quality=80 480w');
    expect(result.html).toContain('photo_960w.jpg?quality=80 960w');
    expect(result.html).toContain('photo_1440w.jpg?quality=80 1440w');
  });

  it('should handle responsive breakpoints correctly', () => {
    const html = '<img src="hero.jpg" class="hero">';

    const config: Config = {
      transforms: [{
        selector: '.hero',
        extract: { custom: () => ({ name: 'hero' }) },
        urlTemplate: '/responsive/{name}_{width}w.jpg',
        widths: [320, 640, 768, 1024, 1366, 1920, 2560],
        type: 'srcset',
        sizes: `(max-width: 320px) 280px,
                (max-width: 640px) 600px,
                (max-width: 768px) 720px,
                (max-width: 1024px) 960px,
                (max-width: 1366px) 1280px,
                (max-width: 1920px) 1800px,
                2400px`
      }]
    };

    const result = responsify(html, config);

    expect(result.html).toContain('srcset=');
    // All widths should be present
    [320, 640, 768, 1024, 1366, 1920, 2560].forEach(width => {
      expect(result.html).toContain(`hero_${width}w.jpg ${width}w`);
    });
    expect(result.html).toContain('sizes=');
  });
});