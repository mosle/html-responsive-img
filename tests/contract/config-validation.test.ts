import { describe, it, expect } from 'vitest';
import type { Config } from '@/types';
import { validateConfig, loadPreset } from '@/config';

describe('Configuration Management', () => {
  describe('validateConfig', () => {
    it('should validate correct config', () => {
      const config: Config = {
        transforms: [{
          selector: 'img',
          extract: { custom: () => ({}) },
          urlTemplate: 'test_{width}',
          widths: [400],
          type: 'picture'
        }]
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should detect empty transforms array', () => {
      const config: Config = { transforms: [] };
      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Transforms array cannot be empty');
    });

    it('should detect invalid selector', () => {
      const config: Config = {
        transforms: [{
          selector: '>>>invalid',
          extract: { custom: () => ({}) },
          urlTemplate: 'test',
          widths: [400],
          type: 'picture'
        }]
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors?.some(e => e.includes('selector'))).toBe(true);
    });

    it('should detect missing extraction config', () => {
      const config = {
        transforms: [{
          selector: 'img',
          extract: {},
          urlTemplate: 'test',
          widths: [400],
          type: 'picture'
        }]
      } as Config;

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors?.some(e => e.includes('extract'))).toBe(true);
    });

    it('should detect empty widths array', () => {
      const config: Config = {
        transforms: [{
          selector: 'img',
          extract: { custom: () => ({}) },
          urlTemplate: 'test',
          widths: [],
          type: 'picture'
        }]
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors?.some(e => e.includes('widths'))).toBe(true);
    });

    it('should detect invalid type', () => {
      const config = {
        transforms: [{
          selector: 'img',
          extract: { custom: () => ({}) },
          urlTemplate: 'test',
          widths: [400],
          type: 'invalid'
        }]
      } as any;

      const result = validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors?.some(e => e.includes('type'))).toBe(true);
    });
  });

  describe('loadPreset', () => {
    it('should load cloudinary preset', () => {
      const config = loadPreset('cloudinary', {
        cdnBase: 'https://res.cloudinary.com/demo'
      });

      expect(config.preset).toBe('cloudinary');
      expect(config.cdnBase).toBe('https://res.cloudinary.com/demo');
      expect(config.transforms).toHaveLength(1);
    });

    it('should load standard preset', () => {
      const config = loadPreset('standard');

      expect(config.preset).toBe('standard');
      expect(config.transforms).toBeDefined();
    });

    it('should throw error for unknown preset', () => {
      expect(() => loadPreset('unknown')).toThrow('Unknown preset');
    });

    it('should merge options with preset', () => {
      const config = loadPreset('standard', {
        transforms: [{
          selector: '.custom',
          extract: { custom: () => ({ test: 'value' }) },
          urlTemplate: 'test',
          widths: [100],
          type: 'srcset'
        }]
      });

      expect(config.transforms).toContainEqual(
        expect.objectContaining({ selector: '.custom' })
      );
    });
  });
});