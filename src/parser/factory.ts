/**
 * Factory for creating the appropriate parser based on environment
 */

let parserModule: any = null;

/**
 * Get the appropriate parser for the current environment
 */
export async function getParser() {
  if (parserModule) {
    return parserModule;
  }

  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    parserModule = await import('./browser');
  } else {
    // Node.js environment
    parserModule = await import('./index');
  }

  return parserModule;
}

/**
 * Get the parser synchronously (must be pre-loaded)
 */
export function getParserSync() {
  if (!parserModule) {
    // Default to Node.js parser in synchronous mode
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // In browser, we can use browser parser directly
      parserModule = require('./browser');
    } else {
      parserModule = require('./index');
    }
  }

  return parserModule;
}