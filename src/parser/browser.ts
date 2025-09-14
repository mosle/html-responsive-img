import type { ImageElement } from '../types';
import { TransformError, ErrorCode } from '../types/errors';

/**
 * Parse HTML using browser's DOM API
 */
export function parseHTML(html: string): { root: Document | DocumentFragment; images: ImageElement[] } {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const images: ImageElement[] = [];
    const imgElements = doc.querySelectorAll('img');

    imgElements.forEach((img) => {
      const attributes: Record<string, string> = {};

      // Extract all attributes
      for (let i = 0; i < img.attributes.length; i++) {
        const attr = img.attributes[i];
        attributes[attr.name] = attr.value;
      }

      images.push({
        src: img.src || attributes.src || '',
        attributes,
        selector: '',
        element: img
      });
    });

    return { root: doc, images };
  } catch (err) {
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
export function matchesSelector(element: Element, selector: string): boolean {
  try {
    return element.matches(selector);
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
export function serializeHTML(root: Document | DocumentFragment): string {
  if (root instanceof Document) {
    return root.documentElement.outerHTML;
  }
  const div = document.createElement('div');
  div.appendChild(root.cloneNode(true));
  return div.innerHTML;
}