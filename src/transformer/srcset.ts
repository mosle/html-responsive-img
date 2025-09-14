import { selectDefaultSrc } from '../generator';
import { preserveAttributes } from './attributes';

/**
 * Generate an img element with srcset attribute
 */
export function generateSrcsetAttribute(
  generatedUrls: Array<{ url: string; width: number; format: string }>,
  originalAttributes: Record<string, string>,
  widths: number[],
  format: string,
  sizes?: string,
  loading?: 'lazy' | 'eager',
  _extractedData?: Record<string, string>
): string {
  // Filter URLs for the specified format (or first available)
  const targetFormat = format || generatedUrls[0]?.format || 'original';
  const urls = generatedUrls.filter(u => u.format === targetFormat);

  // Generate srcset string
  const srcset = urls.map(({ url, width }) => `${url} ${width}w`).join(', ');

  // Select default src
  const allUrls = urls.map(u => u.url);
  const defaultSrc = selectDefaultSrc(widths, allUrls) || originalAttributes.src;

  // Preserve original attributes and add new ones
  const imgAttributes = preserveAttributes(originalAttributes, {
    src: defaultSrc,
    srcset,
    sizes: sizes || originalAttributes.sizes,
    loading: loading || originalAttributes.loading || 'lazy'
  });

  // Build img tag
  let imgTag = '<img';
  for (const [key, value] of Object.entries(imgAttributes)) {
    if (value !== undefined && value !== null && value !== '') {
      imgTag += ` ${key}="${value}"`;
    }
  }
  imgTag += '>';

  return imgTag;
}