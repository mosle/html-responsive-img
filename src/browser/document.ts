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
    // Prefer DOMParser, but guard against environments where it may throw (e.g. some JSDOM setups)
    let applied = false;
    if (typeof DOMParser !== 'undefined') {
      try {
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(result.html, 'text/html');

        // Replace body content
        if (newDoc?.body) {
          document.body.innerHTML = newDoc.body.innerHTML;
          applied = true;
        }

        // Update head if needed (for preload hints, etc.)
        if (newDoc?.head) {
          const newLinks = newDoc.head.querySelectorAll('link[rel="preload"]');
          newLinks.forEach(link => {
            if (!document.head.querySelector(`link[href="${link.getAttribute('href')}"]`)) {
              document.head.appendChild(link.cloneNode(true));
            }
          });
        }
      } catch {
        // Fall back below
      }
    }

    if (!applied) {
      // Fallback for environments without DOMParser or when parsing fails
      const bodyMatch = result.html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      if (bodyMatch) {
        document.body.innerHTML = bodyMatch[1];
      } else {
        // If no <body>, treat entire HTML as body content
        document.body.innerHTML = result.html;
      }
    }

    return result.stats?.imagesTransformed || 0;
  }

  return 0;
}
