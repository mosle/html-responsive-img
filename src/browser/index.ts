/**
 * Browser-specific exports
 */

// Import removed - Config type not used
import { transformDocument as transformDoc } from './document';
import { transformElement as transformEl } from './element';

// Re-export main functionality
export { responsify, responsifyAsync } from '../index';
export type { Config, TransformConfig, TransformResult } from '../types';

// Browser-specific functions
export const transformDocument = transformDoc;
export const transformElement = transformEl;

// Make available on window object if in browser
if (typeof window !== 'undefined') {
  (window as any).HtmlResponsiveImg = {
    transformDocument: transformDoc,
    transformElement: transformEl
  };
}