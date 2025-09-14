/**
 * Template processing utilities
 */

/**
 * Extract placeholder names from a template string
 */
export function extractPlaceholders(template: string): string[] {
  const placeholderRegex = /\{([^}]+)\}/g;
  const placeholders: string[] = [];
  let match;

  while ((match = placeholderRegex.exec(template)) !== null) {
    if (!placeholders.includes(match[1])) {
      placeholders.push(match[1]);
    }
  }

  return placeholders;
}

/**
 * Validate that all required placeholders have values
 */
export function validateTemplateData(
  template: string,
  data: Record<string, string>
): { valid: boolean; missing: string[] } {
  const placeholders = extractPlaceholders(template);
  const missing: string[] = [];

  // Special placeholders that are always available
  const builtInPlaceholders = ['width', 'format'];

  for (const placeholder of placeholders) {
    if (!builtInPlaceholders.includes(placeholder) && !(placeholder in data)) {
      missing.push(placeholder);
    }
  }

  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Process URL template with fallback values
 */
export function processTemplate(
  template: string,
  data: Record<string, string>,
  fallbacks: Record<string, string> = {}
): string {
  let processed = template;

  const allData = {
    ...fallbacks,
    ...data
  };

  for (const [key, value] of Object.entries(allData)) {
    const placeholder = `{${key}}`;
    processed = processed.replace(
      new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      value || ''
    );
  }

  return processed;
}