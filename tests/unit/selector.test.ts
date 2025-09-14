import { describe, it, expect } from 'vitest';
import { isValidSelector, parseSelector, matchesParsedSelector } from '@/transformer/selector';

describe('Selector utilities', () => {
  it('isValidSelector allows common selectors and rejects obviously invalid ones', () => {
    expect(isValidSelector('img')).toBe(true);
    expect(isValidSelector('.responsive')).toBe(true);
    expect(isValidSelector('#main')).toBe(true);
    expect(isValidSelector('img[src="photo.jpg"]')).toBe(true);

    // Obviously invalid patterns
    expect(isValidSelector('> img')).toBe(false);
    expect(isValidSelector('img >>> .foo')).toBe(false);
  });

  it('parseSelector extracts tag, id, classes, attributes', () => {
    const parsed = parseSelector('img.responsive#hero[src="a.jpg"][data-id]');
    expect(parsed.tagName).toBe('img');
    expect(parsed.id).toBe('hero');
    expect(parsed.classes).toEqual(['responsive']);
    expect(parsed.attributes).toEqual({ src: 'a.jpg', 'data-id': '' });
  });

  it('matchesParsedSelector validates element against parsed parts', () => {
    const parsed = parseSelector('img.gallery#main[data-x="1"][data-y]');
    const element = {
      tagName: 'img',
      id: 'main',
      className: 'gallery featured',
      getAttribute: (name: string) => {
        const map: Record<string, string> = { 'data-x': '1' };
        return map[name];
      },
      hasAttribute: (name: string) => name === 'data-y'
    };

    expect(matchesParsedSelector(element, parsed)).toBe(true);

    // ID mismatch
    const wrongId = { ...element, id: 'other' };
    expect(matchesParsedSelector(wrongId, parsed)).toBe(false);

    // Missing class
    const noClass = { ...element, className: 'featured' };
    expect(matchesParsedSelector(noClass, parsed)).toBe(false);

    // Attribute value mismatch
    const badAttr = { ...element, getAttribute: (n: string) => (n === 'data-x' ? '2' : undefined) };
    expect(matchesParsedSelector(badAttr, parsed)).toBe(false);

    // Missing attribute existence
    const missingExist = { ...element, hasAttribute: (_n: string) => false };
    expect(matchesParsedSelector(missingExist, parsed)).toBe(false);
  });
});

