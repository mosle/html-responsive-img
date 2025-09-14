import { describe, it, expect } from 'vitest';
import { generateUrl } from '@/generator';

describe('URL Generation Utilities', () => {
  describe('generateUrl', () => {
    it('should substitute all placeholders', () => {
      const template = '{protocol}//{domain}/{path}/{name}_{width}w.{format}';
      const data = {
        protocol: 'https:',
        domain: 'cdn.example.com',
        path: 'images',
        name: 'photo'
      };

      const result = generateUrl(template, data, 800, 'webp');

      expect(result).toBe('https://cdn.example.com/images/photo_800w.webp');
    });

    it('should handle special format value "original"', () => {
      const template = '{name}_{width}w.{format}';
      const data = { name: 'image', ext: 'jpg' };

      const result = generateUrl(template, data, 400, 'original');

      expect(result).toBe('image_400w.jpg');
    });

    it('should handle missing placeholders gracefully', () => {
      const template = '{base}/{missing}_{width}.{format}';
      const data = { base: 'path' };

      const result = generateUrl(template, data, 400, 'jpg');

      expect(result).toBe('path/{missing}_400.jpg');
    });

    it('should handle complex templates', () => {
      const template = '{scheme}://{host}:{port}/{path}/{file}_{width}w_{quality}.{format}';
      const data = {
        scheme: 'https',
        host: 'cdn.example.com',
        port: '443',
        path: 'assets/images',
        file: 'hero',
        quality: 'q80'
      };

      const result = generateUrl(template, data, 1200, 'webp');

      expect(result).toBe('https://cdn.example.com:443/assets/images/hero_1200w_q80.webp');
    });

    it('should handle Cloudinary-style URLs', () => {
      const template = '{base}/w_{width},f_{format}/{publicId}';
      const data = {
        base: 'https://res.cloudinary.com/demo/image/upload',
        publicId: 'sample'
      };

      const result = generateUrl(template, data, 600, 'auto');

      expect(result).toBe('https://res.cloudinary.com/demo/image/upload/w_600,f_auto/sample');
    });

    it('should handle nested placeholders', () => {
      const template = '{base}/{size}/{name}.{format}';
      const data = {
        base: '/images',
        name: 'photo',
        size: 'large'
      };

      const result = generateUrl(template, data, 1920, 'jpg');

      expect(result).toBe('/images/large/photo.jpg');
    });

    it('should preserve special characters in template', () => {
      const template = '{base}?width={width}&format={format}&name={name}';
      const data = {
        base: '/api/image',
        name: 'test-image'
      };

      const result = generateUrl(template, data, 800, 'webp');

      expect(result).toBe('/api/image?width=800&format=webp&name=test-image');
    });

    it('should handle format as original with custom extension', () => {
      const template = '{name}_{width}w.{format}';
      const data = {
        name: 'image',
        originalExt: 'png'
      };

      const result = generateUrl(template, data, 400, 'original');

      expect(result).toBe('image_400w.png');
    });
  });
});