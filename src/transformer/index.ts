import type { Config, TransformResult, TransformStats } from '../types';
import { parseHTML, matchesSelector, serializeHTML } from '../parser';
import { extractUrlComponents } from '../extractor';
import { generateUrl } from '../generator';
import { generatePictureElement } from './picture';
import { generateSrcsetAttribute } from './srcset';

/**
 * Main transformation engine
 */
export function transformImages(html: string, config: Config): TransformResult {
  const startTime = Date.now();

  try {
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
    let extractionFailures = 0;

    // Apply each transformation rule
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
          // Invalid selector, skip this rule
          continue;
        }

        // Extract URL components
        const extractedData = extractUrlComponents(image.src, transform.extract);
        if (!extractedData) {
          extractionFailures++;
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
        // For node-html-parser, we need to use set_content or replaceWith properly
        if (image.element) {
          try {
            // Try to parse the new element and replace
            const tempRoot = parseHTML(newElement);
            // Get the first child which is our new element
            const replacement = tempRoot.root.firstChild || tempRoot.root;

            // Use node-html-parser's replacement method
            if (image.element.replaceWith) {
              image.element.replaceWith(replacement.toString());
            } else if (image.element.parentNode) {
              // Manual replacement
              const parent = image.element.parentNode;
              const index = parent.childNodes.indexOf(image.element);
              if (index !== -1) {
                parent.childNodes[index] = replacement;
              }
            }
          } catch {
            // If parsing fails, try direct string replacement
            if (image.element.replaceWith) {
              image.element.replaceWith(newElement);
            }
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

    // Calculate processing time
    stats.processingTime = Date.now() - startTime;

    // Note: We don't fail if no images were transformed - this is valid behavior
    // Some configurations may intentionally skip certain images

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