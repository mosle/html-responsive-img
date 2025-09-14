/**
 * Factory for creating the appropriate parser based on environment
 */

type ParserModule = {
  parseHTML: (html: string) => { root: unknown; images: import('../types').ImageElement[] };
  matchesSelector: (element: unknown, selector: string) => boolean;
  serializeHTML: (root: unknown) => string;
};

let parserModule: ParserModule | null = null;

/**
 * Get the appropriate parser for the current environment
 */
export async function getParser(): Promise<ParserModule> {
  if (parserModule) {
    return parserModule;
  }

  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const mod = await import('./browser');
    parserModule = {
      parseHTML: mod.parseHTML,
      matchesSelector: (element: unknown, selector: string) => mod.matchesSelector(element as Element, selector),
      serializeHTML: (root: unknown) => mod.serializeHTML(root as Document | DocumentFragment)
    } satisfies ParserModule;
  } else {
    // Node.js environment
    const mod = await import('./index');
    parserModule = {
      parseHTML: mod.parseHTML,
      matchesSelector: (element: unknown, selector: string) => mod.matchesSelector(element as import('node-html-parser').HTMLElement, selector),
      serializeHTML: (root: unknown) => mod.serializeHTML(root as import('node-html-parser').HTMLElement)
    } satisfies ParserModule;
  }

  return parserModule as ParserModule;
}

/**
 * Get the parser synchronously (must be pre-loaded)
 */
export function getParserSync(): ParserModule {
  if (!parserModule) {
    // Default to Node.js parser in synchronous mode
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // In browser, we can use browser parser directly
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('./browser') as typeof import('./browser');
      parserModule = {
        parseHTML: mod.parseHTML,
        matchesSelector: (element: unknown, selector: string) => mod.matchesSelector(element as Element, selector),
        serializeHTML: (root: unknown) => mod.serializeHTML(root as Document | DocumentFragment)
      } satisfies ParserModule;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('./index') as typeof import('./index');
      parserModule = {
        parseHTML: mod.parseHTML,
        matchesSelector: (element: unknown, selector: string) => mod.matchesSelector(element as import('node-html-parser').HTMLElement, selector),
        serializeHTML: (root: unknown) => mod.serializeHTML(root as import('node-html-parser').HTMLElement)
      } satisfies ParserModule;
    }
  }

  return parserModule as ParserModule;
}
