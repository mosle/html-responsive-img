/**
 * Attribute preservation and manipulation utilities
 */

/**
 * Preserve original attributes while adding/updating new ones
 */
export function preserveAttributes(
  original: Record<string, string>,
  updates: Record<string, string | undefined>
): Record<string, string> {
  const preserved: Record<string, string> = {};

  // Copy all original attributes
  for (const [key, value] of Object.entries(original)) {
    // Skip src attribute as it will be updated
    if (key !== 'src' && key !== 'srcset' && key !== 'sizes') {
      preserved[key] = value;
    }
  }

  // Apply updates
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && value !== null) {
      preserved[key] = value;
    }
  }

  return preserved;
}

/**
 * Extract specific attributes from an element
 */
export function extractAttributes(element: any): Record<string, string> {
  const attributes: Record<string, string> = {};

  if (element.attributes) {
    // For node-html-parser
    for (const [key, value] of Object.entries(element.attributes)) {
      attributes[key] = value as string;
    }
  } else if (element.attrs) {
    // For other parsers
    for (const attr of element.attrs) {
      attributes[attr.name] = attr.value;
    }
  }

  return attributes;
}

/**
 * Serialize attributes to HTML string
 */
export function serializeAttributes(attributes: Record<string, string>): string {
  return Object.entries(attributes)
    .map(([key, value]) => {
      if (value === '') {
        return key;
      }
      return `${key}="${escapeAttributeValue(value)}"`;
    })
    .join(' ');
}

/**
 * Escape attribute value for HTML
 */
export function escapeAttributeValue(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}