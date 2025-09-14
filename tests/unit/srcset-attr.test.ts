import { describe, it, expect } from 'vitest';
import { generateSrcsetAttribute } from '@/transformer/srcset';

describe('generateSrcsetAttribute', () => {
  const original = { src: 'orig.jpg', alt: 'x', sizes: '50vw', loading: 'lazy' };

  it('filters by format and preserves original sizes when not provided', () => {
    const html = generateSrcsetAttribute(
      [
        { url: 'img_400.webp', width: 400, format: 'webp' },
        { url: 'img_800.webp', width: 800, format: 'webp' },
        { url: 'img_400.jpg', width: 400, format: 'original' }
      ],
      original,
      [400, 800],
      'webp'
    );

    expect(html).toContain('srcset="img_400.webp 400w, img_800.webp 800w"');
    expect(html).toContain('sizes="50vw"');
    expect(html).toContain('loading="lazy"');
  });

  it('falls back to original src when no URLs match target format', () => {
    const html = generateSrcsetAttribute(
      [
        { url: 'img_400.webp', width: 400, format: 'webp' },
        { url: 'img_800.webp', width: 800, format: 'webp' }
      ],
      original,
      [400, 800],
      'avif'
    );

    // When no URLs match, srcset is omitted and src falls back to original
    expect(html).toContain('src="orig.jpg"');
    expect(html).not.toContain('srcset="');
  });

  it('uses first available format when format argument is falsy', () => {
    const html = generateSrcsetAttribute(
      [
        { url: 'img_400.avif', width: 400, format: 'avif' },
        { url: 'img_800.avif', width: 800, format: 'avif' }
      ],
      { src: 'orig.jpg', alt: 'x' },
      [400, 800],
      '' as unknown as string
    );

    expect(html).toContain('srcset="img_400.avif 400w, img_800.avif 800w"');
  });
});

