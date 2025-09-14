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
export function isTransformConfig(value: unknown): value is import('./types').TransformConfig {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.selector === 'string' &&
    typeof v.extract === 'object' && v.extract !== null &&
    typeof v.urlTemplate === 'string' &&
    Array.isArray(v.widths as unknown[]) &&
    (v.type === 'picture' || v.type === 'srcset')
  );
}

export function isConfig(value: unknown): value is Config {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  const transforms = v.transforms as unknown[];
  return Array.isArray(transforms) && transforms.length > 0 && transforms.every(isTransformConfig);
}

export function isExtractConfig(value: unknown): value is import('./types').ExtractConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  // Must have either pattern+groups OR custom function
  const v = value as Record<string, unknown>;
  const hasPattern = v.pattern instanceof RegExp && typeof v.groups === 'object' && v.groups !== null;
  const hasCustom = typeof v.custom === 'function';

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
