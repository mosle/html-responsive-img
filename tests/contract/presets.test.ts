import { describe, it, expect } from 'vitest';
import { loadPreset } from '@/config/presets';
import type { Config } from '@/types';

describe('Preset Loading', () => {
  describe('loadPreset', () => {
    it('should load cloudinary preset with default settings', () => {
      const config = loadPreset('cloudinary');

      expect(config.preset).toBe('cloudinary');
      expect(config.transforms).toHaveLength(1);
      expect(config.transforms[0].urlTemplate).toContain('{width}');
      expect(config.transforms[0].formats).toContain('auto');
    });

    it('should load cloudinary preset with custom CDN base', () => {
      const config = loadPreset('cloudinary', {
        cdnBase: 'https://res.cloudinary.com/myaccount'
      });

      expect(config.cdnBase).toBe('https://res.cloudinary.com/myaccount');
      expect(config.preset).toBe('cloudinary');
    });

    it('should load standard preset', () => {
      const config = loadPreset('standard');

      expect(config.preset).toBe('standard');
      expect(config.transforms).toBeDefined();
      expect(config.transforms[0].type).toBeDefined();
    });

    it('should load standard preset with custom widths', () => {
      const config = loadPreset('standard', {
        transforms: [{
          selector: 'img',
          extract: {
            pattern: /^(.+)\/([^\/]+)\.([^.]+)$/,
            groups: { basePath: 1, filename: 2, ext: 3 }
          },
          urlTemplate: '{basePath}/{filename}_{width}w.{format}',
          widths: [200, 400, 800, 1600],
          type: 'srcset'
        }]
      });

      expect(config.transforms[0].widths).toEqual([200, 400, 800, 1600]);
    });

    it('should throw error for unknown preset', () => {
      expect(() => loadPreset('invalid-preset')).toThrow('Unknown preset: invalid-preset');
    });

    it('should merge custom transforms with preset', () => {
      const customTransform = {
        selector: '.hero',
        extract: { custom: () => ({ test: 'value' }) },
        urlTemplate: 'custom-{width}',
        widths: [1920],
        type: 'picture' as const
      };

      const config = loadPreset('standard', {
        transforms: [customTransform]
      });

      expect(config.transforms).toContainEqual(expect.objectContaining({
        selector: '.hero',
        widths: [1920]
      }));
    });

    it('should preserve preset defaults when merging', () => {
      const config = loadPreset('cloudinary', {
        cdnBase: 'https://custom.cdn.com'
      });

      expect(config.cdnBase).toBe('https://custom.cdn.com');
      expect(config.transforms).toBeDefined();
      expect(config.transforms.length).toBeGreaterThan(0);
    });

    it('should handle empty options', () => {
      const config = loadPreset('standard', {});

      expect(config.preset).toBe('standard');
      expect(config.transforms).toBeDefined();
    });

    it('should validate preset configuration', () => {
      const config = loadPreset('standard');

      // Each preset transform should be valid
      config.transforms.forEach(transform => {
        expect(transform.selector).toBeDefined();
        expect(transform.extract).toBeDefined();
        expect(transform.urlTemplate).toBeDefined();
        expect(transform.widths.length).toBeGreaterThan(0);
        expect(['picture', 'srcset']).toContain(transform.type);
      });
    });
  });

  describe('Built-in Presets', () => {
    it('cloudinary preset should have correct structure', () => {
      const config = loadPreset('cloudinary', {
        cdnBase: 'https://res.cloudinary.com/demo'
      });

      const transform = config.transforms[0];
      expect(transform.extract.custom).toBeDefined();
      expect(transform.formats).toContain('auto');
      expect(transform.urlTemplate).toContain('w_{width}');
    });

    it('standard preset should support common CDN patterns', () => {
      const config = loadPreset('standard', {
        cdnBase: 'https://cdn.example.com'
      });

      expect(config.cdnBase).toBe('https://cdn.example.com');
      const transform = config.transforms[0];
      expect(transform.urlTemplate).toContain('{width}');
      expect(transform.formats).toBeDefined();
    });
  });
});