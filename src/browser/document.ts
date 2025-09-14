import type { Config } from '../types';
import { responsify } from '../index';

/**
 * Transform all images in the current document
 */
export function transformDocument(config: Config): number {
  if (typeof document === 'undefined') {
    throw new Error('transformDocument is only available in browser environment');
  }

  // Get current HTML
  const html = document.documentElement.outerHTML;

  // Transform HTML
  const result = responsify(html, config);

  if (result.success && result.html) {
    // Use DOMParser if available, otherwise update innerHTML directly
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const newDoc = parser.parseFromString(result.html, 'text/html');

      // Replace body content
      document.body.innerHTML = newDoc.body.innerHTML;

      // Update head if needed (for preload hints, etc.)
      const newLinks = newDoc.head.querySelectorAll('link[rel="preload"]');
      newLinks.forEach(link => {
        if (!document.head.querySelector(`link[href="${link.getAttribute('href')}"]`)) {
          document.head.appendChild(link.cloneNode(true));
        }
      });
    } else {
      // Fallback for environments without DOMParser
      // Extract body content from transformed HTML
      const bodyMatch = result.html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      if (bodyMatch) {
        document.body.innerHTML = bodyMatch[1];
      }
    }

    return result.stats?.imagesTransformed || 0;
  }

  return 0;
}