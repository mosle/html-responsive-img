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
    const transformedImages = new Set<any>();

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
async function processImageChunk(
  images: any[],
  config: Config,
  transformedImages: Set<any>,
  stats: TransformStats,
  parser: any
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
      if (image.element && image.element.replaceWith) {
        image.element.replaceWith(newElement);
      } else {
        // Fallback for environments without replaceWith
        const temp = parseHTML(newElement);
        const newNode = temp.root.firstChild || temp.root;
        const parent = image.element.parentNode;
        if (parent) {
          parent.insertBefore(newNode, image.element);
          parent.removeChild(image.element);
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