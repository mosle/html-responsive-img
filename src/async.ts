import type { Config, TransformResult, TransformStats } from './types';
import { getParser } from './parser/factory';
import { extractUrlComponents } from './extractor';
import { generateUrl } from './generator';
import { generatePictureElement } from './transformer/picture';
import { generateSrcsetAttribute } from './transformer/srcset';

/**
 * Async version of transform for large documents
 */
export async function transformImagesAsync(
  html: string,
  config: Config
): Promise<TransformResult> {
  const startTime = Date.now();

  try {
    // Get the appropriate parser for the environment
    const parser = await getParser();
    const { parseHTML, matchesSelector, serializeHTML } = parser;

    // Parse HTML
    const { root, images } = parseHTML(html);

    // Initialize statistics
    const stats: TransformStats = {
      imagesFound: images.length,
      imagesTransformed: 0,
      rulesApplied: 0,
      processingTime: 0
    };

    // Track which images have been transformed
    const transformedImages = new Set<unknown>();

    // Process in chunks for better performance
    const CHUNK_SIZE = 50;
    const imageChunks = [];
    for (let i = 0; i < images.length; i += CHUNK_SIZE) {
      imageChunks.push(images.slice(i, i + CHUNK_SIZE));
    }

    // Process each chunk
    for (const chunk of imageChunks) {
      await processImageChunk(
        chunk,
        config,
        transformedImages,
        stats,
        { matchesSelector, parseHTML }
      );

      // Yield to event loop
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    // Calculate processing time
    stats.processingTime = Date.now() - startTime;

    // Serialize back to HTML
    const transformedHtml = serializeHTML(root);

    return {
      success: true,
      html: transformedHtml,
      stats
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
      stats: {
        imagesFound: 0,
        imagesTransformed: 0,
        rulesApplied: 0,
        processingTime: Date.now() - startTime
      }
    };
  }
}

/**
 * Process a chunk of images
 */
type ParserAdapter = {
  matchesSelector: (element: unknown, selector: string) => boolean;
  parseHTML: (html: string) => { root: unknown; images: import('./types').ImageElement[] };
};

async function processImageChunk(
  images: import('./types').ImageElement[],
  config: Config,
  transformedImages: Set<unknown>,
  stats: TransformStats,
  parser: ParserAdapter
): Promise<void> {
  const { matchesSelector, parseHTML } = parser;

  for (const transform of config.transforms) {
    let ruleApplied = false;

    for (const image of images) {
      // Skip if already transformed
      if (transformedImages.has(image.element)) {
        continue;
      }

      // Check if image matches selector
      try {
        if (!matchesSelector(image.element, transform.selector)) {
          continue;
        }
      } catch {
        continue;
      }

      // Extract URL components
      const extractedData = extractUrlComponents(image.src, transform.extract);
      if (!extractedData) {
        continue;
      }

      // Generate URLs for each width and format
      const generatedUrls: Array<{ url: string; width: number; format: string }> = [];
      const formats = transform.formats || ['original'];

      for (const format of formats) {
        for (const width of transform.widths) {
          const url = generateUrl(transform.urlTemplate, extractedData, width, format);
          generatedUrls.push({ url, width, format });
        }
      }

      // Transform based on type
      let newElement: string;
      if (transform.type === 'picture') {
        newElement = generatePictureElement(
          generatedUrls,
          image.attributes,
          transform.widths,
          formats,
          transform.sizes,
          transform.loading,
          extractedData
        );
      } else {
        newElement = generateSrcsetAttribute(
          generatedUrls,
          image.attributes,
          transform.widths,
          formats[0] || 'original',
          transform.sizes,
          transform.loading,
          extractedData
        );
      }

      // Replace the original element
      const el = image.element as {
        replaceWith?: (replacement: string) => void;
        parentNode?: {
          insertBefore?: (node: unknown, ref: unknown) => void;
          removeChild?: (node: unknown) => void;
        } | null;
      } | undefined;
      if (el && typeof el.replaceWith === 'function') {
        el.replaceWith(newElement);
      } else {
        // Fallback for environments without replaceWith
        const temp = parseHTML(newElement);
        const rootAny = temp.root as unknown as { firstChild?: unknown };
        const newNode = rootAny.firstChild || temp.root;
        const parent = (image.element as unknown as {
          parentNode?: {
            insertBefore?: (node: unknown, ref: unknown) => void;
            removeChild?: (node: unknown) => void;
          } | null;
        }).parentNode;
        if (parent && typeof parent.insertBefore === 'function' && typeof parent.removeChild === 'function') {
          parent.insertBefore(newNode, image.element as unknown);
          parent.removeChild(image.element as unknown);
        }
      }

      transformedImages.add(image.element);
      stats.imagesTransformed++;
      ruleApplied = true;
    }

    if (ruleApplied) {
      stats.rulesApplied++;
    }
  }
}
