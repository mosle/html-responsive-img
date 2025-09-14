import { describe, it, expect } from 'vitest';
import { transformImages } from '@/transformer';
import type { Config } from '@/types';

describe('Transformer engine branches', () => {
  it('skips on invalid selector without failing', () => {
    const html = '<img src="x.jpg">';
    const config = {
      transforms: [{
        selector: 'img[', // invalid selector that should cause matchesSelector to throw
        extract: {
          pattern: /(.+)/,
          groups: { x: 1 }
        },
        urlTemplate: '{x}',
        widths: [100],
        type: 'srcset'
      }]
    } as unknown as Config;

    const res = transformImages(html, config);
    expect(res.success).toBe(true);
    expect(res.html).toContain('<img'); // unchanged
    expect(res.stats?.imagesTransformed).toBe(0);
  });

  it('continues when extraction returns null', () => {
    const html = '<img src="x.jpg">';
    const config = {
      transforms: [{
        selector: 'img',
        extract: {
          pattern: /no-match\/(.+)/,
          groups: { name: 1 }
        },
        urlTemplate: '{name}_{width}.jpg',
        widths: [200],
        type: 'srcset'
      }]
    } as unknown as Config;

    const res = transformImages(html, config);
    expect(res.success).toBe(true);
    expect(res.stats?.imagesTransformed).toBe(0);
  });
});

