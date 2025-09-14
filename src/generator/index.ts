/**
 * URL generation utilities
 */

/**
 * Generate a URL from a template and data
 */
export function generateUrl(
  template: string,
  data: Record<string, string>,
  width: number,
  format: string
): string {
  let url = template;

  // Handle special format value "original"
  const actualFormat = format === 'original'
    ? (data.ext || data.originalExt || 'jpg')
    : format;

  // Replace all placeholders
  const replacements: Record<string, string> = {
    ...data,
    width: width.toString(),
    format: actualFormat
  };

  for (const [key, value] of Object.entries(replacements)) {
    const placeholder = `{${key}}`;
    url = url.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  }

  return url;
}

/**
 * Generate srcset string from URLs and widths
 */
export function generateSrcset(urls: Array<{ url: string; width: number }>): string {
  return urls.map(({ url, width }) => `${url} ${width}w`).join(', ');
}

/**
 * Get MIME type for an image format
 */
export function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    avif: 'image/avif',
    svg: 'image/svg+xml',
    gif: 'image/gif',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
    tiff: 'image/tiff',
    auto: 'image/webp' // Default for auto format
  };

  return mimeTypes[format.toLowerCase()] || '';
}

/**
 * Select the default src URL from available widths
 */
export function selectDefaultSrc(widths: number[], urls: string[]): string {
  // Select middle size as default, or first if only one
  const middleIndex = Math.floor(widths.length / 2);
  return urls[middleIndex] || urls[0] || '';
}