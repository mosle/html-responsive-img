import { describe, it, expect } from 'vitest';
import type { ExtractConfig } from '@/types';
import { extractUrlComponents } from '@/extractor';

describe('URL Extraction Utilities', () => {
  describe('extractUrlComponents', () => {
    it('should extract with regex pattern', () => {
      const extractConfig: ExtractConfig = {
        pattern: /^https?:\/\/([^\/]+)\/(.+)\/([^\/]+)\.([^.]+)$/,
        groups: { domain: 1, path: 2, filename: 3, ext: 4 }
      };

      const result = extractUrlComponents(
        'https://example.com/images/photo.jpg',
        extractConfig
      );

      expect(result).toEqual({
        domain: 'example.com',
        path: 'images',
        filename: 'photo',
        ext: 'jpg'
      });
    });

    it('should extract with custom function', () => {
      const extractConfig: ExtractConfig = {
        custom: (src) => {
          const parts = src.split('/');
          const fileWithExt = parts[parts.length - 1];
          const [filename, ext] = fileWithExt.split('.');
          return {
            filename: filename || '',
            ext: ext || ''
          };
        }
      };

      const result = extractUrlComponents(
        'path/to/image.png',
        extractConfig
      );

      expect(result).toEqual({
        filename: 'image',
        ext: 'png'
      });
    });

    it('should return null for non-matching pattern', () => {
      const extractConfig: ExtractConfig = {
        pattern: /^https:/,
        groups: {}
      };

      const result = extractUrlComponents(
        'http://example.com',
        extractConfig
      );

      expect(result).toBeNull();
    });

    it('should handle complex extraction patterns', () => {
      const extractConfig: ExtractConfig = {
        pattern: /^(.+)\/v\d+\/(.+)\.([^.]+)$/,
        groups: { cdnBase: 1, publicId: 2, format: 3 }
      };

      const result = extractUrlComponents(
        'https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg',
        extractConfig
      );

      expect(result).toEqual({
        cdnBase: 'https://res.cloudinary.com/demo/image/upload',
        publicId: 'sample',
        format: 'jpg'
      });
    });

    it('should handle relative URLs', () => {
      const extractConfig: ExtractConfig = {
        pattern: /^\/(.+)\/([^\/]+)\.([^.]+)$/,
        groups: { path: 1, name: 2, ext: 3 }
      };

      const result = extractUrlComponents(
        '/assets/images/logo.svg',
        extractConfig
      );

      expect(result).toEqual({
        path: 'assets/images',
        name: 'logo',
        ext: 'svg'
      });
    });

    it('should handle URLs with query parameters', () => {
      const extractConfig: ExtractConfig = {
        custom: (src) => {
          const url = new URL(src, 'https://example.com');
          const pathname = url.pathname;
          const parts = pathname.split('/').filter(Boolean);
          const filename = parts[parts.length - 1];
          const [name, ext] = filename.split('.');

          return {
            name: name || '',
            ext: ext || '',
            query: url.search
          };
        }
      };

      const result = extractUrlComponents(
        'https://example.com/image.jpg?w=300&h=200',
        extractConfig
      );

      expect(result).toEqual({
        name: 'image',
        ext: 'jpg',
        query: '?w=300&h=200'
      });
    });
  });
});