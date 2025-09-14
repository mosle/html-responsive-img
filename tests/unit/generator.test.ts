import { describe, it, expect } from 'vitest';
import { generateSrcset, getMimeType, selectDefaultSrc } from '@/generator';

describe('Generator utils', () => {
  it('generateSrcset builds comma-separated width descriptors', () => {
    const s = generateSrcset([
      { url: 'a_320.jpg', width: 320 },
      { url: 'a_640.jpg', width: 640 }
    ]);
    expect(s).toBe('a_320.jpg 320w, a_640.jpg 640w');
  });

  it('getMimeType returns known types and empty string for unknown', () => {
    expect(getMimeType('jpg')).toBe('image/jpeg');
    expect(getMimeType('webp')).toBe('image/webp');
    expect(getMimeType('unknown')).toBe('');
  });

  it('selectDefaultSrc returns middle item or first', () => {
    expect(selectDefaultSrc([200, 400, 800], ['a', 'b', 'c'])).toBe('b');
    expect(selectDefaultSrc([400], ['x'])).toBe('x');
  });
});

