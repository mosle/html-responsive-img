// Lazy wrapper around jsdom to avoid import-time side effects in Node 18.

// Export a class compatible with `new JSDOM(...)` usage.
// The constructor defers loading the real jsdom until it is actually instantiated
// (after test setup files have applied any required polyfills).
export class JSDOM {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(...args: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const real = require('jsdom');
    // Return the real instance so callers get a proper JSDOM object
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return new real.JSDOM(...args);
  }
}

