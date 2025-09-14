import type { TransformResult } from '../types';

/**
 * Format output based on format type
 */
export function formatOutput(result: TransformResult, format: 'html' | 'json'): string {
  if (format === 'json') {
    return JSON.stringify(result, null, 2);
  }

  // Default to HTML
  return result.html || '';
}