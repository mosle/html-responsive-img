import type { Config } from '../types';
import { responsify } from '../index';

/**
 * Transform images within a specific element
 */
export function transformElement(element: HTMLElement, config: Config): number {
  if (typeof document === 'undefined') {
    throw new Error('transformElement is only available in browser environment');
  }

  // In test shims, HTMLElement may not be a real DOM class, so relax the check
  if (!element || (typeof HTMLElement !== 'undefined' && !(element instanceof HTMLElement))) {
    throw new Error('Invalid element provided');
  }

  // Get element's inner HTML to preserve the container
  const html = element.innerHTML;

  // Transform HTML
  const result = responsify(html, config);

  if (result.success && result.html) {
    // Count directly from transformed fragment
    const srcsetMatches = result.html.match(/\ssrcset=\"/g) || [];
    const directCount = srcsetMatches.length;
    // Update the element's innerHTML with transformed content
    element.innerHTML = result.html;

    let count = directCount || result.stats?.imagesTransformed || 0;
    if (count === 0) {
      try {
        const imgs = Array.from(element.querySelectorAll('img'));
        count = imgs.reduce((acc, img) => acc + (img.hasAttribute('srcset') ? 1 : 0), 0);
      } catch {
        // ignore
      }
    }
    return count;
  }

  return 0;
}
