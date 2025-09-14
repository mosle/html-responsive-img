/**
 * Error codes for transformation failures
 */
export enum ErrorCode {
  INVALID_CONFIG = 'INVALID_CONFIG',
  INVALID_HTML = 'INVALID_HTML',
  EXTRACTION_FAILED = 'EXTRACTION_FAILED',
  GENERATION_FAILED = 'GENERATION_FAILED',
  SELECTOR_ERROR = 'SELECTOR_ERROR',
}

/**
 * Custom error class for transformation errors
 */
export class TransformError extends Error {
  code: ErrorCode;
  context?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'TransformError';
    this.code = code;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TransformError);
    }
  }
}
