/**
 * Selector matching utilities
 */

/**
 * Validate CSS selector syntax
 */
export function isValidSelector(selector: string): boolean {
  try {
    // If a real DOM API is present, try using it
    if (
      typeof document !== 'undefined' &&
      typeof (document as unknown as { createElement?: unknown }).createElement === 'function'
    ) {
      const el = (document as Document).createElement('div');
      const matches = (el as Element).matches as ((sel: string) => boolean) | undefined;
      if (typeof matches === 'function') {
        matches.call(el, selector);
      }
      return true;
    }

    // Fallback validation for non-DOM environments (e.g., test shims)
    // Only reject obviously invalid patterns
    if (selector.startsWith('>') || selector.includes('>>>')) {
      return false;
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

  // Remove attribute selectors for tag/id/class parsing
  const withoutAttrs = selector.replace(/\[[^\]]*\]/g, '');

  // Extract tag name
  const tagMatch = withoutAttrs.match(/^([a-zA-Z][a-zA-Z0-9]*)/);
  if (tagMatch) {
    result.tagName = tagMatch[1];
  }

  // Extract ID
  const idMatch = withoutAttrs.match(/#([^.\s\[]+)/);
  if (idMatch) {
    result.id = idMatch[1];
  }

  // Extract classes (CSS identifiers): start with letter/_ then letters/digits/-/_
  const classMatches = withoutAttrs.matchAll(/\.([_a-zA-Z][_a-zA-Z0-9-]*)/g);
  for (const match of classMatches) {
    result.classes.push(match[1]);
  }

  // Extract attributes
  const attrMatches = selector.matchAll(/\[([^=\]]+)(?:=(?:\"([^\"]*)\"|'([^']*)'))?\]/g);
  for (const match of attrMatches) {
    const name = match[1];
    const value = (match[2] !== undefined ? match[2] : (match[3] !== undefined ? match[3] : '')) as string;
    result.attributes[name] = value;
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
