// Minimal, dependency-free JSDOM shim sufficient for our tests.
// Provides: window, document, HTMLElement, DOMParser with the limited
// APIs used in tests/browser code: getElementById, querySelector(All) for basic selectors,
// innerHTML, outerHTML, head/body, and attribute inspection on <img> elements.

type Attrs = Record<string, string>;

class ShimHTMLElement {
  tagName: string;
  private _innerHTML: string;
  id?: string;
  className?: string;
  constructor(tagName: string, innerHTML = '') {
    this.tagName = tagName.toUpperCase();
    this._innerHTML = innerHTML;
  }
  get innerHTML(): string {
    return this._innerHTML;
  }
  set innerHTML(html: string) {
    this._innerHTML = html;
  }
  // Basic query support within this element's innerHTML
  querySelectorAll(selector: string): ShimHTMLElement[] {
    return querySelectorAllFromHTML(this._innerHTML, selector);
  }
  querySelector(selector: string): ShimHTMLElement | null {
    const all = this.querySelectorAll(selector);
    return all[0] || null;
  }
  hasAttribute(_name: string): boolean { return false; }
  getAttribute(_name: string): string | null { return null; }
}

class ImgElement extends ShimHTMLElement {
  private raw: string;
  private attrs: Attrs;
  constructor(rawTag: string) {
    super('img', '');
    this.raw = rawTag;
    this.attrs = parseAttributes(rawTag);
  }
  hasAttribute(name: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.attrs, name);
  }
  getAttribute(name: string): string | null {
    return this.attrs[name] ?? null;
  }
}

class HeadElement extends ShimHTMLElement {
  constructor() { super('head', ''); }
  querySelectorAll(_selector: string): ShimHTMLElement[] { return []; }
  appendChild(_node: unknown): void { /* noop for tests */ }
}

class BodyElement extends ShimHTMLElement {
  constructor(html: string) { super('body', html); }
}

class DocumentElement extends ShimHTMLElement {
  head: HeadElement;
  body: BodyElement;
  constructor(head: HeadElement, body: BodyElement) {
    super('html');
    this.head = head;
    this.body = body;
  }
  get outerHTML(): string {
    return `<html><head>${this.head.innerHTML}</head><body>${this.body.innerHTML}</body></html>`;
  }
}

class DocumentShim {
  head: HeadElement;
  body: BodyElement;
  documentElement: DocumentElement;
  constructor(html: string) {
    const { headHTML, bodyHTML } = splitHeadBody(html);
    this.head = new HeadElement();
    this.head.innerHTML = headHTML;
    this.body = new BodyElement(bodyHTML);
    this.documentElement = new DocumentElement(this.head, this.body);
  }
  createElement(tag: string): ShimHTMLElement {
    return new ShimHTMLElement(tag);
  }
  getElementById(id: string): ShimHTMLElement | null {
    const html = this.body.innerHTML;
    const re = new RegExp(`<([a-zA-Z0-9:-]+)([^>]*)\\bid=["']${escapeRegExp(id)}["'][^>]*>`, 'i');
    const match = re.exec(html);
    if (!match) return null;
    const tag = match[1];
    const openEnd = (match.index ?? 0) + match[0].length;
    const closeTag = `</${tag}>`;
    const lowerHtml = html.toLowerCase();
    const closeIdx = lowerHtml.indexOf(closeTag.toLowerCase(), openEnd);
    const inner = closeIdx !== -1 ? html.substring(openEnd, closeIdx) : '';
    return new ShimHTMLElement(tag, inner);
  }
  querySelectorAll(selector: string): ShimHTMLElement[] {
    return querySelectorAllFromHTML(this.body.innerHTML, selector);
  }
  querySelector(selector: string): ShimHTMLElement | null {
    const all = this.querySelectorAll(selector);
    return all[0] || null;
  }
}

class DOMParserShim {
  parseFromString(html: string, _type: string): DocumentShim {
    return new DocumentShim(html);
  }
}

function splitHeadBody(html: string): { headHTML: string; bodyHTML: string } {
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return {
    headHTML: headMatch ? headMatch[1] : '',
    bodyHTML: bodyMatch ? bodyMatch[1] : html
  };
}

function escapeRegExp(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function parseAttributes(rawTag: string): Attrs {
  const attrs: Attrs = {};
  const attrPart = rawTag.replace(/^<img/i, '').replace(/>$/,'');
  const re = /(\w[\w:-]*)(?:=\"([^\"]*)\")?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(attrPart)) !== null) {
    const [, key, value] = m;
    if (key) attrs[key] = value ?? '';
  }
  return attrs;
}

function querySelectorAllFromHTML(html: string, selector: string): ShimHTMLElement[] {
  if (selector === 'img') {
    return extractImgs(html);
  }
  if (selector.startsWith('.')) {
    // class selector within any tag, only used on container in tests
    const cls = selector.slice(1);
    return extractImgs(html).filter(img => (img.getAttribute('class') || '').split(/\s+/).includes(cls));
  }
  if (selector.startsWith('img:not(')) {
    const classMatch = selector.match(/img:not\(\.([^\)]+)\)/);
    if (classMatch) {
      const cls = classMatch[1];
      return extractImgs(html).filter(img => !((img.getAttribute('class') || '').split(/\s+/).includes(cls)));
    }
  }
  // Fallback: empty
  return [];
}

function extractImgs(html: string): ImgElement[] {
  const results: ImgElement[] = [];
  const re = /<img\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    results.push(new ImgElement(m[0]));
  }
  return results;
}

export class JSDOM {
  window: {
    document: DocumentShim;
    HTMLElement: typeof ShimHTMLElement;
    DOMParser: typeof DOMParserShim;
  };
  constructor(html: string) {
    const document = new DocumentShim(html);
    this.window = {
      document,
      HTMLElement: ShimHTMLElement,
      DOMParser: DOMParserShim
    };
  }
}
