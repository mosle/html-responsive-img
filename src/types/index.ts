/**
 * Configuration for extracting URL components from image sources
 */
export interface ExtractConfig {
  /** Regular expression pattern for extraction (RegExp or string for JSON) */
  pattern?: RegExp | string;
  /** Mapping of named groups to regex capture group indices */
  groups?: Record<string, number>;
  /** Custom extraction function */
  custom?: (src: string) => Record<string, string> | null;
}

/**
 * Configuration for a single transformation rule
 */
export interface TransformConfig {
  /** CSS selector to match target images */
  selector: string;
  /** URL extraction configuration */
  extract: ExtractConfig;
  /** Template for generating new URLs with placeholders */
  urlTemplate: string;
  /** Array of widths to generate (in pixels) */
  widths: number[];
  /** Image formats to generate (e.g., ['avif', 'webp', 'original']) */
  formats?: string[];
  /** Output type: picture element or srcset attribute */
  type: 'picture' | 'srcset';
  /** Sizes attribute for responsive images */
  sizes?: string;
  /** Loading strategy for images */
  loading?: 'lazy' | 'eager';
}

/**
 * Main configuration object
 */
export interface Config {
  /** Array of transformation rules to apply */
  transforms: TransformConfig[];
  /** Optional preset configuration name */
  preset?: string;
  /** Base URL for CDN (used with presets) */
  cdnBase?: string;
}

/**
 * Statistics about a transformation operation
 */
export interface TransformStats {
  /** Total number of images found in HTML */
  imagesFound: number;
  /** Number of images successfully transformed */
  imagesTransformed: number;
  /** Number of transformation rules that matched */
  rulesApplied: number;
  /** Processing time in milliseconds */
  processingTime: number;
}

/**
 * Result of a transformation operation
 */
export interface TransformResult {
  /** Whether the transformation succeeded */
  success: boolean;
  /** Transformed HTML (present if success is true) */
  html?: string;
  /** Error message (present if success is false) */
  error?: string;
  /** Statistics about the transformation */
  stats?: TransformStats;
}

/**
 * Validation result for configuration
 */
export interface ValidationResult {
  /** Whether the configuration is valid */
  valid: boolean;
  /** Array of error messages if invalid */
  errors?: string[];
}

/**
 * CLI options for the responsify command
 */
export interface CliOptions {
  /** Input HTML file path */
  input?: string;
  /** Output file path (optional, defaults to stdout) */
  output?: string;
  /** Configuration file path */
  config: string;
  /** Output format */
  format?: 'html' | 'json';
  /** Enable verbose output */
  verbose?: boolean;
  /** Show version information */
  version?: boolean;
  /** Show help information */
  help?: boolean;
}

/**
 * Internal representation of an image element
 */
export interface ImageElement {
  /** Original source URL */
  src: string;
  /** All HTML attributes */
  attributes: Record<string, string>;
  /** CSS selector that matched this image */
  selector: string;
  /** The HTML element reference (if available) */
  element?: any;
}

/**
 * A generated image source for responsive images
 */
export interface GeneratedSource {
  /** Generated URL */
  url: string;
  /** Width descriptor */
  width: number;
  /** Image format */
  format: string;
  /** MIME type for source element */
  mimeType?: string;
}