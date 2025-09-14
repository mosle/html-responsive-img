import type { Config } from '../types';
import { responsify } from '../index';

/**
 * Transform images within a specific element
 */
export function transformElement(element: HTMLElement, config: Config): number {
  if (typeof document === 'undefined') {
    throw new Error('transformElement is only available in browser environment');
  }

  if (!element || !(element instanceof HTMLElement)) {
    throw new Error('Invalid element provided');
  }

  // Get element's inner HTML to preserve the container
  const html = element.innerHTML;

  // Transform HTML
  const result = responsify(html, config);

  if (result.success && result.html) {
    // Update the element's innerHTML with transformed content
    element.innerHTML = result.html;

    return result.stats?.imagesTransformed || 0;
  }

  return 0;
}