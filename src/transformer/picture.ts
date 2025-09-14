import { getMimeType, selectDefaultSrc } from '../generator';
import { preserveAttributes } from './attributes';

/**
 * Generate a picture element with multiple sources
 */
export function generatePictureElement(
  generatedUrls: Array<{ url: string; width: number; format: string }>,
  originalAttributes: Record<string, string>,
  widths: number[],
  formats: string[],
  sizes?: string,
  loading?: 'lazy' | 'eager',
  _extractedData?: Record<string, string>
): string {
  const sources: string[] = [];

  // Group URLs by format
  const urlsByFormat = new Map<string, Array<{ url: string; width: number }>>();
  for (const { url, width, format } of generatedUrls) {
    if (!urlsByFormat.has(format)) {
      urlsByFormat.set(format, []);
    }
    urlsByFormat.get(format)!.push({ url, width });
  }

  // Generate source elements for each format (except original)
  for (const format of formats) {
    if (format === 'original') continue;

    const urls = urlsByFormat.get(format);
    if (!urls || urls.length === 0) continue;

    const srcset = urls.map(({ url, width }) => `${url} ${width}w`).join(', ');
    const mimeType = getMimeType(format);

    let sourceTag = `<source`;
    if (mimeType) {
      sourceTag += ` type="${mimeType}"`;
    }
    sourceTag += ` srcset="${srcset}"`;
    if (sizes) {
      sourceTag += ` sizes="${sizes}"`;
    }
    sourceTag += `>`;

    sources.push(sourceTag);
  }

  // Generate source for original format (without type attribute)
  const originalUrls = urlsByFormat.get('original') || [];
  if (originalUrls.length > 0) {
    const srcset = originalUrls.map(({ url, width }) => `${url} ${width}w`).join(', ');
    let sourceTag = `<source srcset="${srcset}"`;
    if (sizes) {
      sourceTag += ` sizes="${sizes}"`;
    }
    sourceTag += `>`;
    sources.push(sourceTag);
  }

  // Select default src for img fallback - prefer original format
  const originalFormatUrls = generatedUrls.filter(u => u.format === 'original' || u.format === (_extractedData?.ext || 'jpg'));
  const fallbackUrls = originalFormatUrls.length > 0 ? originalFormatUrls : generatedUrls;
  const defaultSrc = selectDefaultSrc(widths, fallbackUrls.map(u => u.url));

  // Preserve original attributes and add new ones
  const imgAttributes = preserveAttributes(originalAttributes, {
    src: defaultSrc,
    loading: loading || originalAttributes.loading || 'lazy'
  });

  // Build img tag
  let imgTag = '<img';
  for (const [key, value] of Object.entries(imgAttributes)) {
    if (value !== undefined && value !== null) {
      imgTag += ` ${key}="${value}"`;
    }
  }
  imgTag += '>';

  // Combine into picture element
  return `<picture>${sources.join('')}${imgTag}</picture>`;
}