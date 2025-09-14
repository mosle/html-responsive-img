/**
 * Selector matching utilities
 */

/**
 * Validate CSS selector syntax
 */
export function isValidSelector(selector: string): boolean {
  try {
    // Try to use the selector in a dummy context
    if (typeof document !== 'undefined') {
      document.createElement('div').matches(selector);
    } else {
      // Basic validation for Node.js environment
      // Check for common invalid patterns
      if (selector.startsWith('>') || selector.includes('>>>')) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse selector to extract tag name, classes, id, and attributes
 */
export function parseSelector(selector: string): {
  tagName?: string;
  id?: string;
  classes: string[];
  attributes: Record<string, string>;
} {
  const result: {
    tagName?: string;
    id?: string;
    classes: string[];
    attributes: Record<string, string>;
  } = {
    classes: [],
    attributes: {}
  };

  // Extract tag name
  const tagMatch = selector.match(/^([a-zA-Z][a-zA-Z0-9]*)/);
  if (tagMatch) {
    result.tagName = tagMatch[1];
  }

  // Extract ID
  const idMatch = selector.match(/#([^.\s\[]+)/);
  if (idMatch) {
    result.id = idMatch[1];
  }

  // Extract classes
  const classMatches = selector.matchAll(/\.([^.\s\[#]+)/g);
  for (const match of classMatches) {
    result.classes.push(match[1]);
  }

  // Extract attributes
  const attrMatches = selector.matchAll(/\[([^=\]]+)(?:="([^"]+)")?\]/g);
  for (const match of attrMatches) {
    result.attributes[match[1]] = match[2] || '';
  }

  return result;
}

/**
 * Check if element matches parsed selector components
 */
export function matchesParsedSelector(
  element: {
    tagName?: string;
    id?: string;
    className?: string;
    getAttribute?: (attr: string) => string | undefined;
    hasAttribute?: (attr: string) => boolean;
  },
  parsed: ReturnType<typeof parseSelector>
): boolean {
  // Check tag name
  if (parsed.tagName && element.tagName?.toLowerCase() !== parsed.tagName.toLowerCase()) {
    return false;
  }

  // Check ID
  if (parsed.id && element.id !== parsed.id) {
    return false;
  }

  // Check classes
  const elementClasses = (element.className || '').split(/\s+/);
  for (const className of parsed.classes) {
    if (!elementClasses.includes(className)) {
      return false;
    }
  }

  // Check attributes
  for (const [attr, value] of Object.entries(parsed.attributes)) {
    const elementValue = element.getAttribute?.(attr);
    if (value && elementValue !== value) {
      return false;
    }
    if (!value && !element.hasAttribute?.(attr)) {
      return false;
    }
  }

  return true;
}
