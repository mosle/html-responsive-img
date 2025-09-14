import type { Config, ValidationResult, TransformConfig } from '../types';
import { isValidSelector } from '../transformer/selector';
import { validateExtractConfig } from '../extractor';

/**
 * Validate a configuration object
 */
export function validateConfig(config: Config): ValidationResult {
  const errors: string[] = [];

  // Check transforms array
  if (!config.transforms || !Array.isArray(config.transforms)) {
    errors.push('Configuration must have a transforms array');
    return { valid: false, errors };
  }

  if (config.transforms.length === 0) {
    errors.push('Transforms array cannot be empty');
    return { valid: false, errors };
  }

  // Validate each transform
  config.transforms.forEach((transform, index) => {
    const transformErrors = validateTransform(transform);
    transformErrors.forEach(error => {
      errors.push(`Transform ${index}: ${error}`);
    });
  });

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Validate a single transform configuration
 */
function validateTransform(transform: TransformConfig): string[] {
  const errors: string[] = [];

  // Validate selector
  if (!transform.selector || typeof transform.selector !== 'string') {
    errors.push('selector is required and must be a string');
  } else if (!isValidSelector(transform.selector)) {
    errors.push(`Invalid CSS selector: ${transform.selector}`);
  }

  // Validate extraction config
  if (!transform.extract) {
    errors.push('extract configuration is required');
  } else if (!validateExtractConfig(transform.extract)) {
    errors.push('extract configuration must have either pattern+groups or custom function');
  }

  // Validate URL template
  if (!transform.urlTemplate || typeof transform.urlTemplate !== 'string') {
    errors.push('urlTemplate is required and must be a string');
  }

  // Validate widths
  if (!transform.widths || !Array.isArray(transform.widths)) {
    errors.push('widths must be an array');
  } else if (transform.widths.length === 0) {
    errors.push('widths array cannot be empty');
  } else if (!transform.widths.every(w => typeof w === 'number' && w > 0)) {
    errors.push('widths must contain only positive numbers');
  }

  // Validate formats if provided
  if (transform.formats !== undefined) {
    if (!Array.isArray(transform.formats)) {
      errors.push('formats must be an array if provided');
    } else if (transform.formats.length === 0) {
      errors.push('formats array cannot be empty if provided');
    }
  }

  // Validate type
  if (!transform.type || !['picture', 'srcset'].includes(transform.type)) {
    errors.push('type must be either "picture" or "srcset"');
  }

  // Validate loading if provided
  if (transform.loading !== undefined && !['lazy', 'eager'].includes(transform.loading)) {
    errors.push('loading must be either "lazy" or "eager" if provided');
  }

  return errors;
}