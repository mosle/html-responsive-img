import { describe, it, expect } from 'vitest';
import { responsify } from '@/index';
import { loadPreset } from '@/config/presets';

describe('Preset Configuration Integration', () => {
  it('should transform images using cloudinary preset', () => {
    const html = `
      <div class="gallery">
        <img src="https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg" alt="Sample">
        <img src="https://res.cloudinary.com/demo/image/upload/v1234567890/products/shoe.jpg" alt="Shoe">
      </div>
    `;

    const config = loadPreset('cloudinary', {
      cdnBase: 'https://res.cloudinary.com/demo'
    });

    const result = responsify(html, config);

    expect(result.success).toBe(true);
    expect(result.stats?.imagesTransformed).toBeGreaterThan(0);

    // Should use Cloudinary transformation syntax
    expect(result.html).toContain('w_');
    expect(result.html).toContain('f_auto');
    expect(result.html).toContain('sample');
    expect(result.html).toContain('products/shoe');
  });

  it('should transform images using standard preset', () => {
    const html = `
      <img src="https://cdn.example.com/images/hero.jpg" class="hero">
      <img src="https://cdn.example.com/images/thumbnail.png" class="thumb">
    `;

    const config = loadPreset('standard', {
      cdnBase: 'https://cdn.example.com'
    });

    const result = responsify(html, config);

    expect(result.success).toBe(true);
    expect(result.stats?.imagesTransformed).toBeGreaterThan(0);

    // Should generate standard responsive images
    expect(result.html).toMatch(/hero_\d+w\.(jpg|webp)/);
    expect(result.html).toMatch(/thumbnail_\d+w\.(png|webp)/);
  });

  it('should allow customizing preset widths', () => {
    const html = '<img src="/image.jpg" alt="Test">';

    const config = loadPreset('standard', {
      transforms: [{
        selector: 'img',
        extract: {
          pattern: /^\/(.+)\.([^.]+)$/,
          groups: { name: 1, ext: 2 }
        },
        urlTemplate: '/optimized/{name}_{width}w.{format}',
        widths: [100, 200, 300, 400], // Custom widths
        formats: ['webp', 'original'],
        type: 'srcset'
      }]
    });

    const result = responsify(html, config);

    expect(result.html).toContain('image_100w.webp');
    expect(result.html).toContain('image_200w.webp');
    expect(result.html).toContain('image_300w.webp');
    expect(result.html).toContain('image_400w.webp');
  });

  it('should merge preset with custom transforms', () => {
    const html = `
      <img src="/standard.jpg" class="standard">
      <img src="/custom.jpg" class="custom">
    `;

    const standardTransform = {
      selector: '.standard',
      extract: { custom: () => ({ name: 'standard' }) },
      urlTemplate: '/std/{name}_{width}w.jpg',
      widths: [400, 800],
      type: 'srcset' as const
    };

    const customTransform = {
      selector: '.custom',
      extract: { custom: () => ({ name: 'custom' }) },
      urlTemplate: '/cst/{name}_{width}w.{format}',
      widths: [600, 1200],
      formats: ['avif', 'original'],
      type: 'picture' as const
    };

    // Load standard preset and add custom transform
    const config = loadPreset('standard', {
      transforms: [standardTransform, customTransform]
    });

    const result = responsify(html, config);

    expect(result.success).toBe(true);

    // Standard transform applied
    expect(result.html).toContain('std/standard_400w.jpg');
    expect(result.html).toContain('std/standard_800w.jpg');

    // Custom transform applied
    expect(result.html).toContain('<picture>');
    expect(result.html).toContain('cst/custom_600w.avif');
    expect(result.html).toContain('cst/custom_1200w.jpg');
  });

  it('should handle preset with complex extraction logic', () => {
    const html = `
      <img src="https://images.unsplash.com/photo-1234567890?w=1920&h=1080" alt="Unsplash">
      <img src="https://cdn.pixabay.com/photo/2024/01/15/12345.jpg" alt="Pixabay">
    `;

    // Custom preset-like configuration
    const config = {
      preset: 'image-services',
      transforms: [
        {
          selector: 'img[src*="unsplash.com"]',
          extract: {
            custom: (src) => {
              const url = new URL(src);
              const photoId = url.pathname.split('/').pop()?.split('?')[0];
              return {
                service: 'unsplash',
                id: photoId || '',
                params: url.search
              };
            }
          },
          urlTemplate: 'https://images.unsplash.com/{id}?w={width}&auto=format',
          widths: [400, 800, 1200, 1600],
          type: 'srcset' as const
        },
        {
          selector: 'img[src*="pixabay.com"]',
          extract: {
            custom: (src) => {
              const match = src.match(/\/(\d+)\.jpg$/);
              return {
                service: 'pixabay',
                id: match?.[1] || ''
              };
            }
          },
          urlTemplate: 'https://cdn.pixabay.com/photo/2024/01/15/{id}_{width}w.jpg',
          widths: [150, 300, 600],
          type: 'srcset' as const
        }
      ]
    };

    const result = responsify(html, config);

    expect(result.success).toBe(true);

    // Unsplash transformation
    expect(result.html).toContain('photo-1234567890?w=400&auto=format');
    expect(result.html).toContain('photo-1234567890?w=1600&auto=format');

    // Pixabay transformation
    expect(result.html).toContain('12345_150w.jpg');
    expect(result.html).toContain('12345_600w.jpg');
  });

  it('should apply preset defaults when not overridden', () => {
    const html = '<img src="/test.jpg">';

    // Load preset with minimal overrides
    const config = loadPreset('standard');

    const result = responsify(html, config);

    expect(result.success).toBe(true);

    // Should use preset defaults for:
    // - Selector (likely 'img')
    // - Widths (likely includes common sizes)
    // - Type (picture or srcset)
    expect(result.html).not.toBe(html); // Should be transformed
    expect(result.stats?.imagesTransformed).toBe(1);
  });

  it('should validate preset configuration', () => {
    // Test that preset configurations are valid
    const presets = ['cloudinary', 'standard'];

    presets.forEach(presetName => {
      const config = loadPreset(presetName);

      expect(config.preset).toBe(presetName);
      expect(config.transforms).toBeDefined();
      expect(Array.isArray(config.transforms)).toBe(true);
      expect(config.transforms.length).toBeGreaterThan(0);

      // Each transform should have required fields
      config.transforms.forEach(transform => {
        expect(transform.selector).toBeDefined();
        expect(transform.extract).toBeDefined();
        expect(transform.urlTemplate).toBeDefined();
        expect(transform.widths).toBeDefined();
        expect(Array.isArray(transform.widths)).toBe(true);
        expect(transform.widths.length).toBeGreaterThan(0);
        expect(['picture', 'srcset']).toContain(transform.type);
      });
    });
  });

  it('should handle preset with environment-specific CDN', () => {
    const html = '<img src="/images/product.jpg">';

    // Simulate different environments
    const environments = {
      development: 'http://localhost:3000/images',
      staging: 'https://staging-cdn.example.com',
      production: 'https://cdn.example.com'
    };

    Object.entries(environments).forEach(([env, cdnBase]) => {
      const config = loadPreset('standard', {
        cdnBase,
        transforms: [{
          selector: 'img',
          extract: {
            custom: (src) => {
              const filename = src.split('/').pop()?.split('.')[0];
              return { name: filename || '' };
            }
          },
          urlTemplate: '{cdnBase}/{name}_{width}w.{format}',
          widths: [400],
          formats: ['webp'],
          type: 'srcset'
        }]
      });

      // Add cdnBase to template data
      config.transforms[0].urlTemplate = config.transforms[0].urlTemplate.replace('{cdnBase}', cdnBase);

      const result = responsify(html, config);

      expect(result.html).toContain(`${cdnBase}/product_400w.webp`);
    });
  });
});