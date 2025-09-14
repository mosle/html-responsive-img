import { parse } from 'node-html-parser';
import type { HTMLElement as NHPElement } from 'node-html-parser';
import type { ImageElement } from '../types';
import { TransformError, ErrorCode } from '../types/errors';

/**
 * Parse HTML and extract image elements
 */
export function parseHTML(html: string): { root: NHPElement; images: ImageElement[] } {
  try {
    const root = parse(html, {
      lowerCaseTagName: false,
      comment: true,
      blockTextElements: {
        script: true,
        noscript: true,
        style: true,
        pre: true
      }
    });

    const images: ImageElement[] = [];
    const imgElements = root.querySelectorAll('img') as NHPElement[];

    for (const img of imgElements) {
      // Check for malformed HTML - unclosed tags in attributes
      const rawAttrs = (img as unknown as { rawAttrs?: string }).rawAttrs;
      if (typeof rawAttrs === 'string' && rawAttrs.includes('<')) {
        throw new TransformError(
          ErrorCode.INVALID_HTML,
          'Invalid HTML: Malformed img tag with unclosed attributes',
          { html: html.substring(0, 100) }
        );
      }

      const attributes: Record<string, string> = {};

      // Extract all attributes
      const nodeAttrs = (img as unknown as { attributes?: Record<string, string> }).attributes || {};
      for (const [key, value] of Object.entries(nodeAttrs)) {
        attributes[key] = value as string;
      }

      images.push({
        src: attributes.src || '',
        attributes,
        selector: '',
        element: img
      });
    }

    return { root, images };
  } catch (err) {
    if (err instanceof TransformError) {
      throw err;
    }
    throw new TransformError(
      ErrorCode.INVALID_HTML,
      `Failed to parse HTML: ${err instanceof Error ? err.message : 'Unknown error'}`,
      { html: html.substring(0, 100) }
    );
  }
}

/**
 * Check if an image element matches a CSS selector
 */
export function matchesSelector(element: unknown, selector: string): boolean {
  try {
    const el = element as NHPElement;
    // Simple selector matching for node-html-parser
    // Since the element doesn't have a native matches method, we'll do basic matching

    // Handle tag name selector
    if (selector === 'img') {
      return el.tagName?.toLowerCase() === 'img';
    }

    // Handle class selector (including compound selectors like .class1.class2)
    if (selector.startsWith('.')) {
      // Check for compound class selector
      if (selector.includes('.', 1)) {
        const classes = selector.substring(1).split('.');
        const elementClasses = (el.getAttribute?.('class') || '').split(/\s+/);
        // All classes must be present
        return classes.every(cls => elementClasses.includes(cls));
      } else {
        const className = selector.substring(1);
        const elementClasses = (el.getAttribute?.('class') || '').split(/\s+/);
        return elementClasses.includes(className);
      }
    }

    // Handle ID selector
    if (selector.startsWith('#')) {
      const id = selector.substring(1);
      return el.getAttribute?.('id') === id;
    }

    // Handle combined selectors like img[src*="..."]
    if (selector.includes('[') && selector.includes(']')) {
      // Check if it's a combined selector (e.g., img[src*="..."])
      const tagAndAttrMatch = selector.match(/^(\w+)(\[.+\])$/);
      if (tagAndAttrMatch) {
        const [, tag, attrPart] = tagAndAttrMatch;
        // Check tag name first
        if (el.tagName?.toLowerCase() !== tag.toLowerCase()) {
          return false;
        }
        // Then check attribute part
        selector = attrPart;
      }

      // Handle different attribute selector types
      const attrContainsMatch = selector.match(/\[([^*=\]]+)\*="([^"]+)"\]/);
      if (attrContainsMatch) {
        const [, attr, value] = attrContainsMatch;
        const attrValue = el.getAttribute?.(attr);
        return attrValue ? attrValue.includes(value) : false;
      }

      const attrEqualsMatch = selector.match(/\[([^=\]]+)="([^"]+)"\]/);
      if (attrEqualsMatch) {
        const [, attr, value] = attrEqualsMatch;
        const attrValue = el.getAttribute?.(attr);
        return attrValue === value;
      }

      const attrExistsMatch = selector.match(/\[([^\]]+)\]/);
      if (attrExistsMatch) {
        const [, attr] = attrExistsMatch;
        return el.getAttribute?.(attr) !== undefined;
      }
    }

    // For complex selectors, try to use the root to query
    // This is a fallback and may not work for all cases
    if ((el as unknown as { parentNode?: NHPElement | null }).parentNode) {
      const parent = (el as unknown as { parentNode?: NHPElement | null }).parentNode as NHPElement | null;
      const matchingElements = parent?.querySelectorAll(selector) || [];
      for (const match of matchingElements) {
        if (match === el) {
          return true;
        }
      }
    }

    // Default: assume it matches if it's a simple tag selector
    return false;
  } catch {
    throw new TransformError(
      ErrorCode.SELECTOR_ERROR,
      `Invalid CSS selector: ${selector}`,
      { selector }
    );
  }
}

/**
 * Serialize HTML element back to string
 */
export function serializeHTML(root: NHPElement): string {
  return root.toString();
}
