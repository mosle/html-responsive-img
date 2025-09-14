import { describe, it, expect } from 'vitest';
import { responsify } from '@/index';
import type { Config } from '@/types';

describe('Picture Element Generation', () => {
  it('should generate complete picture element with multiple formats', () => {
    const html = '<img src="https://cdn.example.com/images/hero.jpg" alt="Hero Image" class="hero">';

    const config: Config = {
      transforms: [{
        selector: '.hero',
        extract: {
          pattern: /^(.+)\/([^\/]+)\.([^.]+)$/,
          groups: { basePath: 1, filename: 2, ext: 3 }
        },
        urlTemplate: '{basePath}/{filename}_{width}w.{format}',
        widths: [400, 800, 1200, 1600],
        formats: ['avif', 'webp', 'original'],
        type: 'picture',
        loading: 'lazy'
      }]
    };

    const result = responsify(html, config);

    expect(result.success).toBe(true);
    expect(result.html).toContain('<picture>');
    expect(result.html).toContain('</picture>');

    // Check AVIF sources
    expect(result.html).toContain('type="image/avif"');
    expect(result.html).toContain('hero_400w.avif 400w');
    expect(result.html).toContain('hero_800w.avif 800w');
    expect(result.html).toContain('hero_1200w.avif 1200w');
    expect(result.html).toContain('hero_1600w.avif 1600w');

    // Check WebP sources
    expect(result.html).toContain('type="image/webp"');
    expect(result.html).toContain('hero_400w.webp 400w');
    expect(result.html).toContain('hero_800w.webp 800w');

    // Check original format sources
    expect(result.html).toContain('hero_400w.jpg 400w');
    expect(result.html).toContain('hero_1600w.jpg 1600w');

    // Check img fallback
    expect(result.html).toContain('<img');
    expect(result.html).toContain('alt="Hero Image"');
    expect(result.html).toContain('loading="lazy"');
  });

  it('should maintain source order for browser selection priority', () => {
    const html = '<img src="/images/photo.png" alt="Photo">';

    const config: Config = {
      transforms: [{
        selector: 'img',
        extract: {
          custom: (src) => {
            const parts = src.split('/');
            const filename = parts[parts.length - 1].split('.')[0];
            const ext = parts[parts.length - 1].split('.')[1];
            return {
              path: parts.slice(0, -1).join('/'),
              filename,
              ext
            };
          }
        },
        urlTemplate: '{path}/{filename}_{width}w.{format}',
        widths: [600, 1200],
        formats: ['avif', 'webp', 'original'],
        type: 'picture'
      }]
    };

    const result = responsify(html, config);

    // Extract source elements in order
    const sourceMatches = result.html?.match(/<source[^>]*>/g) || [];

    expect(sourceMatches.length).toBe(3); // avif, webp, original
    expect(sourceMatches[0]).toContain('image/avif');
    expect(sourceMatches[1]).toContain('image/webp');
    expect(sourceMatches[2]).not.toContain('type='); // Original has no type
  });

  it('should handle single format picture element', () => {
    const html = '<img src="https://example.com/banner.jpg">';

    const config: Config = {
      transforms: [{
        selector: 'img',
        extract: {
          pattern: /^(.+)\/([^\/]+)\.([^.]+)$/,
          groups: { base: 1, name: 2, ext: 3 }
        },
        urlTemplate: '{base}/{name}_{width}w.{format}',
        widths: [320, 640, 1280],
        formats: ['webp'],
        type: 'picture'
      }]
    };

    const result = responsify(html, config);

    expect(result.success).toBe(true);
    expect(result.html).toContain('<picture>');
    expect(result.html).toContain('type="image/webp"');
    expect(result.html).toContain('banner_320w.webp 320w');
    expect(result.html).toContain('banner_640w.webp 640w');
    expect(result.html).toContain('banner_1280w.webp 1280w');
  });

  it('should add sizes attribute when provided', () => {
    const html = '<img src="/hero.jpg">';

    const config: Config = {
      transforms: [{
        selector: 'img',
        extract: { custom: () => ({ name: 'hero' }) },
        urlTemplate: '/images/{name}_{width}w.{format}',
        widths: [400, 800, 1200],
        formats: ['webp', 'original'],
        type: 'picture',
        sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
      }]
    };

    const result = responsify(html, config);

    expect(result.html).toContain('sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"');
  });

  it('should preserve all original img attributes', () => {
    const html = `<img
      src="/test.jpg"
      alt="Test Image"
      class="responsive hero"
      id="hero-img"
      data-caption="Hero caption"
      title="Hero title"
      style="width: 100%;"
    >`;

    const config: Config = {
      transforms: [{
        selector: '#hero-img',
        extract: { custom: () => ({ name: 'test' }) },
        urlTemplate: '{name}_{width}w.{format}',
        widths: [800],
        formats: ['webp'],
        type: 'picture'
      }]
    };

    const result = responsify(html, config);

    expect(result.html).toContain('alt="Test Image"');
    expect(result.html).toContain('class="responsive hero"');
    expect(result.html).toContain('id="hero-img"');
    expect(result.html).toContain('data-caption="Hero caption"');
    expect(result.html).toContain('title="Hero title"');
    expect(result.html).toContain('style="width: 100%;"');
  });

  it('should select appropriate default src for img fallback', () => {
    const html = '<img src="/photo.jpg">';

    const config: Config = {
      transforms: [{
        selector: 'img',
        extract: { custom: () => ({ name: 'photo' }) },
        urlTemplate: '{name}_{width}w.{format}',
        widths: [400, 800, 1200],
        formats: ['webp', 'original'],
        type: 'picture'
      }]
    };

    const result = responsify(html, config);

    // Should use middle size as default
    expect(result.html).toMatch(/<img[^>]*src="photo_800w\.jpg"/);
  });
});