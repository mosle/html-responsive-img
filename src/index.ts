/**
 * HTML Responsive Image Converter
 * Main API entry point
 */

import type { Config, TransformResult } from './types';
import { transformImages } from './transformer';
import { transformImagesAsync } from './async';

// Re-export types
export type {
  Config,
  TransformConfig,
  ExtractConfig,
  TransformResult,
  TransformStats,
  ValidationResult,
  CliOptions,
  ImageElement,
  GeneratedSource
} from './types';

export { ErrorCode, TransformError } from './types/errors';

// Import configuration utilities
import { validateConfig } from './config/validator';
import { loadPreset, getAvailablePresets, getPresetInfo } from './config/presets';

// Re-export configuration utilities
export { validateConfig, loadPreset, getAvailablePresets, getPresetInfo };

// Import extraction utilities
import { extractUrlComponents } from './extractor';
import {
  extractCloudinaryUrl,
  extractS3Url,
  extractStandardUrl
} from './extractor/custom';

// Import generation utilities
import { generateUrl, generateSrcset, getMimeType } from './generator';

// Re-export extraction utilities
export {
  extractUrlComponents,
  extractCloudinaryUrl,
  extractS3Url,
  extractStandardUrl
};

// Re-export generation utilities
export { generateUrl, generateSrcset, getMimeType };

/**
 * Transform HTML images to responsive formats
 * @param html - Input HTML string containing img tags
 * @param config - Configuration object with transformation rules
 * @returns TransformResult with transformed HTML or error
 */
export function responsify(html: string, config: Config): TransformResult {
  // Validate config first
  const validation = validateConfig(config);
  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid configuration: ${validation.errors?.join(', ')}`,
      stats: {
        imagesFound: 0,
        imagesTransformed: 0,
        rulesApplied: 0,
        processingTime: 0
      }
    };
  }

  return transformImages(html, config);
}

/**
 * Async version of responsify for large HTML documents
 * @param html - Input HTML string containing img tags
 * @param config - Configuration object with transformation rules
 * @returns Promise resolving to TransformResult
 */
export async function responsifyAsync(
  html: string,
  config: Config
): Promise<TransformResult> {
  // Validate config first
  const validation = validateConfig(config);
  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid configuration: ${validation.errors?.join(', ')}`,
      stats: {
        imagesFound: 0,
        imagesTransformed: 0,
        rulesApplied: 0,
        processingTime: 0
      }
    };
  }

  return transformImagesAsync(html, config);
}

// Type guards
export function isTransformConfig(value: any): value is import('./types').TransformConfig {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.selector === 'string' &&
    typeof value.extract === 'object' &&
    typeof value.urlTemplate === 'string' &&
    Array.isArray(value.widths) &&
    (value.type === 'picture' || value.type === 'srcset')
  );
}

export function isConfig(value: any): value is Config {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray(value.transforms) &&
    value.transforms.length > 0 &&
    value.transforms.every(isTransformConfig)
  );
}

export function isExtractConfig(value: any): value is import('./types').ExtractConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  // Must have either pattern+groups OR custom function
  const hasPattern = value.pattern instanceof RegExp && typeof value.groups === 'object';
  const hasCustom = typeof value.custom === 'function';

  return hasPattern || hasCustom;
}

// Default export
export default {
  responsify,
  responsifyAsync,
  validateConfig,
  loadPreset,
  extractUrlComponents,
  generateUrl,
  isTransformConfig,
  isConfig,
  isExtractConfig
};