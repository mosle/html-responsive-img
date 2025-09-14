import type { ExtractConfig } from '../types';
import { TransformError, ErrorCode } from '../types/errors';

/**
 * Extract URL components using the provided extraction config
 */
export function extractUrlComponents(
  url: string,
  extractConfig: ExtractConfig
): Record<string, string> | null {
  try {
    // Try custom extraction first
    if (extractConfig.custom) {
      const result = extractConfig.custom(url);
      if (result && Object.keys(result).length > 0) {
        return result;
      }
      return null;
    }

    // Try regex pattern extraction
    if (extractConfig.pattern && extractConfig.groups) {
      // Convert string pattern to RegExp if needed
      const pattern = typeof extractConfig.pattern === 'string'
        ? new RegExp(extractConfig.pattern)
        : extractConfig.pattern;

      const match = url.match(pattern);
      if (match) {
        const extracted: Record<string, string> = {};

        // If groups is empty, extraction should fail
        if (!extractConfig.groups || Object.keys(extractConfig.groups).length === 0) {
          return null;
        }

        for (const [name, index] of Object.entries(extractConfig.groups)) {
          if (match[index]) {
            extracted[name] = match[index];
          }
        }

        if (Object.keys(extracted).length > 0) {
          return extracted;
        }
      }
    }

    return null;
  } catch (err) {
    throw new TransformError(
      ErrorCode.EXTRACTION_FAILED,
      `Failed to extract URL components: ${err instanceof Error ? err.message : 'Unknown error'}`,
      { url, extractConfig }
    );
  }
}

/**
 * Validate extraction configuration
 */
export function validateExtractConfig(config: ExtractConfig): boolean {
  // Must have either pattern+groups OR custom function
  if (config.custom && typeof config.custom === 'function') {
    return true;
  }

  // Pattern can be RegExp or string (for JSON compatibility)
  if (config.pattern && config.groups) {
    if (config.pattern instanceof RegExp) {
      return true;
    }
    if (typeof config.pattern === 'string') {
      return true;
    }
  }

  return false;
}