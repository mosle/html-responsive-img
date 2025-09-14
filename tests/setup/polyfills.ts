// Ensure Node 18 has the browser-like globals JSDOM and dependencies expect.

// URL and URLSearchParams
if (typeof (globalThis as any).URL === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { URL, URLSearchParams } = require('node:url');
  (globalThis as any).URL = URL;
  (globalThis as any).URLSearchParams = URLSearchParams;
}

// TextEncoder/TextDecoder
if (typeof (globalThis as any).TextEncoder === 'undefined' || typeof (globalThis as any).TextDecoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { TextEncoder, TextDecoder } = require('node:util');
  (globalThis as any).TextEncoder = TextEncoder;
  (globalThis as any).TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
}

// atob/btoa
if (typeof (globalThis as any).atob === 'undefined') {
  (globalThis as any).atob = (data: string) => Buffer.from(data, 'base64').toString('binary');
}
if (typeof (globalThis as any).btoa === 'undefined') {
  (globalThis as any).btoa = (data: string) => Buffer.from(data, 'binary').toString('base64');
}

// structuredClone (Node < 17)
if (typeof (globalThis as any).structuredClone === 'undefined') {
  (globalThis as any).structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}

