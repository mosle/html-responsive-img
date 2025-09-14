import { describe, it, expect } from 'vitest';
import { responsify } from '@/index';
import type { Config } from '@/types';

describe('Multiple Rules Application', () => {
  it('should apply different rules to different images', () => {
    const html = `
      <div class="content">
        <img src="/hero.jpg" class="hero" alt="Hero">
        <img src="/thumbnail.jpg" class="thumb" alt="Thumbnail">
        <img src="/logo.svg" class="logo" alt="Logo">
        <img src="/banner.png" class="banner" alt="Banner">
      </div>
    `;

    const config: Config = {
      transforms: [
        {
          selector: '.hero',
          extract: { custom: () => ({ name: 'hero' }) },
          urlTemplate: '/images/hero/{name}_{width}w.{format}',
          widths: [800, 1200, 1600, 2400],
          formats: ['avif', 'webp', 'original'],
          type: 'picture'
        },
        {
          selector: '.thumb',
          extract: { custom: () => ({ name: 'thumb' }) },
          urlTemplate: '/images/thumbs/{name}_{width}w.jpg',
          widths: [150, 300],
          type: 'srcset'
        },
        {
          selector: '.banner',
          extract: { custom: (url) => ({ name: 'banner', ext: 'png' }) },
          urlTemplate: '/images/banners/{name}_{width}w.{format}',
          widths: [728, 970, 1200],
          formats: ['webp', 'original'],
          type: 'picture'
        }
        // Note: .logo is not transformed (no matching rule)
      ]
    };

    const result = responsify(html, config);

    expect(result.success).toBe(true);
    expect(result.stats?.imagesFound).toBe(4);
    expect(result.stats?.imagesTransformed).toBe(3);
    expect(result.stats?.rulesApplied).toBe(3);

    // Hero should be picture with multiple formats
    expect(result.html).toContain('<picture>');
    expect(result.html).toContain('hero_800w.avif');
    expect(result.html).toContain('hero_1600w.webp');

    // Thumbnail should be srcset
    expect(result.html).toContain('thumb_150w.jpg 150w');
    expect(result.html).toContain('thumb_300w.jpg 300w');

    // Banner should be picture with webp
    expect(result.html).toContain('banner_728w.webp');
    expect(result.html).toContain('banner_1200w.png');

    // Logo should remain unchanged
    expect(result.html).toContain('src="/logo.svg"');
    expect(result.html).toContain('class="logo"');
  });

  it('should apply rules in order with first match wins', () => {
    const html = `
      <img src="/image.jpg" class="responsive hero">
    `;

    const config: Config = {
      transforms: [
        {
          selector: '.hero',
          extract: { custom: () => ({ name: 'hero-rule' }) },
          urlTemplate: '{name}_{width}w.jpg',
          widths: [1200],
          type: 'srcset'
        },
        {
          selector: '.responsive',
          extract: { custom: () => ({ name: 'responsive-rule' }) },
          urlTemplate: '{name}_{width}w.jpg',
          widths: [800],
          type: 'srcset'
        }
      ]
    };

    const result = responsify(html, config);

    // First rule should win
    expect(result.html).toContain('hero-rule_1200w.jpg');
    expect(result.html).not.toContain('responsive-rule');
  });

  it('should handle overlapping selectors correctly', () => {
    const html = `
      <div>
        <img src="1.jpg" class="image">
        <img src="2.jpg" class="image large">
        <img src="3.jpg" class="image small">
      </div>
    `;

    const config: Config = {
      transforms: [
        {
          selector: '.image.large',
          extract: { custom: (src) => ({ name: src.replace('.jpg', '-large') }) },
          urlTemplate: '{name}_{width}w.jpg',
          widths: [1200, 1600],
          type: 'srcset'
        },
        {
          selector: '.image.small',
          extract: { custom: (src) => ({ name: src.replace('.jpg', '-small') }) },
          urlTemplate: '{name}_{width}w.jpg',
          widths: [200, 400],
          type: 'srcset'
        },
        {
          selector: '.image',
          extract: { custom: (src) => ({ name: src.replace('.jpg', '-default') }) },
          urlTemplate: '{name}_{width}w.jpg',
          widths: [600, 800],
          type: 'srcset'
        }
      ]
    };

    const result = responsify(html, config);

    expect(result.html).toContain('1-default_600w.jpg');
    expect(result.html).toContain('2-large_1200w.jpg');
    expect(result.html).toContain('3-small_200w.jpg');
  });

  it('should handle mixed picture and srcset outputs', () => {
    const html = `
      <article>
        <img src="/featured.jpg" class="featured">
        <img src="/inline.jpg" class="inline">
      </article>
    `;

    const config: Config = {
      transforms: [
        {
          selector: '.featured',
          extract: { custom: () => ({ name: 'featured' }) },
          urlTemplate: '/optimized/{name}_{width}w.{format}',
          widths: [800, 1200],
          formats: ['webp', 'original'],
          type: 'picture',
          loading: 'eager'
        },
        {
          selector: '.inline',
          extract: { custom: () => ({ name: 'inline' }) },
          urlTemplate: '/optimized/{name}_{width}w.jpg',
          widths: [400, 600],
          type: 'srcset',
          sizes: '(max-width: 600px) 100vw, 600px',
          loading: 'lazy'
        }
      ]
    };

    const result = responsify(html, config);

    // Featured should be picture
    expect(result.html).toMatch(/<picture>[\s\S]*featured[\s\S]*<\/picture>/);
    expect(result.html).toContain('loading="eager"');

    // Inline should be srcset
    expect(result.html).toContain('srcset="');
    expect(result.html).toContain('inline_400w.jpg 400w');
    expect(result.html).toContain('sizes="(max-width: 600px) 100vw, 600px"');
    expect(result.html).toContain('loading="lazy"');
  });

  it('should handle complex nested HTML structures', () => {
    const html = `
      <div class="gallery">
        <figure>
          <img src="/photo1.jpg" class="gallery-image" alt="Photo 1">
          <figcaption>Caption 1</figcaption>
        </figure>
        <figure>
          <img src="/photo2.jpg" class="gallery-image featured" alt="Photo 2">
          <figcaption>Caption 2</figcaption>
        </figure>
        <div class="sidebar">
          <img src="/ad.jpg" class="advertisement" alt="Ad">
        </div>
      </div>
    `;

    const config: Config = {
      transforms: [
        {
          selector: '.gallery-image.featured',
          extract: { custom: () => ({ name: 'featured' }) },
          urlTemplate: '/gallery/{name}_{width}w.{format}',
          widths: [600, 1200, 1800],
          formats: ['avif', 'webp', 'original'],
          type: 'picture'
        },
        {
          selector: '.gallery-image',
          extract: { custom: (src) => ({ name: src.split('/').pop()?.replace('.jpg', '') || '' }) },
          urlTemplate: '/gallery/{name}_{width}w.jpg',
          widths: [400, 800],
          type: 'srcset'
        },
        {
          selector: '.advertisement',
          extract: { custom: () => ({ name: 'ad' }) },
          urlTemplate: '/ads/{name}_{width}w.jpg',
          widths: [300, 600],
          type: 'srcset'
        }
      ]
    };

    const result = responsify(html, config);

    expect(result.stats?.imagesTransformed).toBe(3);

    // photo1 should get gallery-image rule (srcset)
    expect(result.html).toContain('photo1_400w.jpg');

    // photo2 should get featured rule (picture)
    expect(result.html).toContain('<picture>');
    expect(result.html).toContain('featured_600w.avif');

    // ad should get advertisement rule
    expect(result.html).toContain('ad_300w.jpg');

    // Structure should be preserved
    expect(result.html).toContain('<figure>');
    expect(result.html).toContain('<figcaption>Caption 1</figcaption>');
    expect(result.html).toContain('<figcaption>Caption 2</figcaption>');
  });
});