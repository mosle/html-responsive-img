import { parse } from 'node-html-parser';
import type { ImageElement } from '../types';
import { TransformError, ErrorCode } from '../types/errors';

/**
 * Parse HTML and extract image elements
 */
export function parseHTML(html: string): { root: any; images: ImageElement[] } {
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
    const imgElements = root.querySelectorAll('img');

    for (const img of imgElements) {
      // Check for malformed HTML - unclosed tags in attributes
      if ((img as any).rawAttrs && (img as any).rawAttrs.includes('<')) {
        throw new TransformError(
          ErrorCode.INVALID_HTML,
          'Invalid HTML: Malformed img tag with unclosed attributes',
          { html: html.substring(0, 100) }
        );
      }

      const attributes: Record<string, string> = {};

      // Extract all attributes
      for (const [key, value] of Object.entries((img as any).attributes || {})) {
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
export function matchesSelector(element: any, selector: string): boolean {
  try {
    // Simple selector matching for node-html-parser
    // Since the element doesn't have a native matches method, we'll do basic matching

    // Handle tag name selector
    if (selector === 'img') {
      return element.tagName?.toLowerCase() === 'img';
    }

    // Handle class selector (including compound selectors like .class1.class2)
    if (selector.startsWith('.')) {
      // Check for compound class selector
      if (selector.includes('.', 1)) {
        const classes = selector.substring(1).split('.');
        const elementClasses = (element.getAttribute?.('class') || '').split(/\s+/);
        // All classes must be present
        return classes.every(cls => elementClasses.includes(cls));
      } else {
        const className = selector.substring(1);
        const elementClasses = (element.getAttribute?.('class') || '').split(/\s+/);
        return elementClasses.includes(className);
      }
    }

    // Handle ID selector
    if (selector.startsWith('#')) {
      const id = selector.substring(1);
      return element.getAttribute?.('id') === id;
    }

    // Handle combined selectors like img[src*="..."]
    if (selector.includes('[') && selector.includes(']')) {
      // Check if it's a combined selector (e.g., img[src*="..."])
      const tagAndAttrMatch = selector.match(/^(\w+)(\[.+\])$/);
      if (tagAndAttrMatch) {
        const [, tag, attrPart] = tagAndAttrMatch;
        // Check tag name first
        if (element.tagName?.toLowerCase() !== tag.toLowerCase()) {
          return false;
        }
        // Then check attribute part
        selector = attrPart;
      }

      // Handle different attribute selector types
      const attrContainsMatch = selector.match(/\[([^*=\]]+)\*="([^"]+)"\]/);
      if (attrContainsMatch) {
        const [, attr, value] = attrContainsMatch;
        const attrValue = element.getAttribute?.(attr);
        return attrValue ? attrValue.includes(value) : false;
      }

      const attrEqualsMatch = selector.match(/\[([^=\]]+)="([^"]+)"\]/);
      if (attrEqualsMatch) {
        const [, attr, value] = attrEqualsMatch;
        const attrValue = element.getAttribute?.(attr);
        return attrValue === value;
      }

      const attrExistsMatch = selector.match(/\[([^\]]+)\]/);
      if (attrExistsMatch) {
        const [, attr] = attrExistsMatch;
        return element.getAttribute?.(attr) !== undefined;
      }
    }

    // For complex selectors, try to use the root to query
    // This is a fallback and may not work for all cases
    if (element.parentNode) {
      const parent = element.parentNode;
      const matchingElements = parent.querySelectorAll(selector);
      for (const match of matchingElements) {
        if (match === element) {
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
export function serializeHTML(root: any): string {
  return root.toString();
}