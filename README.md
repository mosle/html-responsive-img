# html-responsive-img

Transform HTML img tags into responsive picture elements or srcset attributes with configurable transformation rules.

## Features

- 🖼️ Transform `<img>` tags to `<picture>` elements with multiple formats (AVIF, WebP, original)
- 📱 Generate responsive `srcset` attributes for different screen sizes
- 🎯 CSS selector-based targeting for precise transformations
- 🔧 Flexible URL extraction and generation with templates
- 🚀 Works in both Node.js and browser environments
- ⚡ Fast HTML parsing and transformation
- 🛠️ CLI tool for batch processing

## Installation

```bash
npm install html-responsive-img
```

## Quick Start

### Node.js

```javascript
import { responsify } from 'html-responsive-img';

const html = '<img src="https://example.com/photo.jpg" class="hero">';

const config = {
  transforms: [{
    selector: '.hero',
    extract: {
      pattern: /^(.+)\/([^\/]+)\.([^.]+)$/,
      groups: { basePath: 1, filename: 2, ext: 3 }
    },
    urlTemplate: '{basePath}/{filename}_{width}w.{format}',
    widths: [400, 800, 1200],
    formats: ['avif', 'webp', 'original'],
    type: 'picture'
  }]
};

const result = responsify(html, config);
console.log(result.html);
// Output: <picture>...</picture> with multiple source elements
```

### CLI

```bash
# Transform a single file
responsify --input index.html --config config.json --output result.html

# Use with pipes
cat page.html | responsify --config config.json > output.html

# Output as JSON for inspection
responsify --input page.html --config config.json --format json
```

## Configuration

### Transform Configuration

Each transform rule in the config can have the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `selector` | string | CSS selector to match images |
| `extract` | object | URL extraction configuration |
| `urlTemplate` | string | Template for generating new URLs |
| `widths` | number[] | Array of widths to generate |
| `formats` | string[] | Array of formats (e.g., 'avif', 'webp', 'original') |
| `type` | 'picture' \| 'srcset' | Output type |
| `sizes` | string | Optional sizes attribute for responsive images |
| `loading` | 'lazy' \| 'eager' | Optional loading attribute |

### URL Extraction

Extract URL components using regex patterns or custom functions:

```javascript
// Regex pattern extraction
{
  extract: {
    pattern: /^(.+)\/([^\/]+)\.([^.]+)$/,
    groups: { basePath: 1, filename: 2, ext: 3 }
  }
}

// Custom extraction function
{
  extract: {
    custom: (url) => {
      // Custom logic to extract components
      return { basePath: '...', filename: '...', ext: '...' };
    }
  }
}
```

### URL Templates

Use placeholders in URL templates that will be replaced with extracted values:

- `{basePath}` - Base path from extraction
- `{filename}` - Filename from extraction
- `{ext}` - Original file extension
- `{format}` - Current format being generated
- `{width}` - Current width being generated

Example: `{basePath}/{filename}_{width}w.{format}`

## API

### `responsify(html: string, config: Config): TransformResult`

Synchronously transform HTML with the given configuration.

**Returns:**
```typescript
{
  success: boolean;
  html?: string;        // Transformed HTML (if success)
  error?: string;       // Error message (if failed)
  stats?: {
    imagesFound: number;
    imagesTransformed: number;
    rulesApplied: number;
    processingTime: number;
  };
}
```

### `responsifyAsync(html: string, config: Config): Promise<TransformResult>`

Asynchronously transform HTML (useful for large documents).

### `validateConfig(config: Config): ValidationResult`

Validate a configuration object before use.

### `loadPreset(presetName: string): Config`

Load a predefined configuration preset.

Available presets:
- `'standard'` - Common responsive image setup
- `'cloudinary'` - Cloudinary CDN optimized

## Browser Usage

When using this library in the browser, import from `html-responsive-img/browser`.

- For whole-page transforms: use `transformDocument(config)`; it reads the current `document` HTML and updates the DOM.
- For a specific container: use `transformElement(element, config)`.
- For transforming an HTML string: use `responsify(html, config)` from the browser entry and apply the result yourself.

Note: The top-level import `html-responsive-img` targets Node.js and depends on `node-html-parser`. In browser code, always import from `html-responsive-img/browser`.

```html
<script type="module">
  import { transformDocument } from 'html-responsive-img/browser';

  const config = { /* ... */ };
  transformDocument(config);
</script>
```

### Transform a specific element (browser)

```html
<script type="module">
  import { transformElement } from 'html-responsive-img/browser';

  const config = { /* ... */ };
  const container = document.querySelector('#content');
  if (container) transformElement(container, config);
</script>
```

### Transform a string and apply (browser)

```html
<script type="module">
  import { responsify } from 'html-responsive-img/browser';

  const config = { /* ... */ };
  const html = `<div><img class="hero" src="/images/photo.jpg"></div>`;
  const result = responsify(html, config);
  if (result.success && result.html) {
    document.getElementById('app').innerHTML = result.html;
  }
  // result.stats contains counters like imagesTransformed
</script>
```

## Examples

### Picture Element with Multiple Formats

```javascript
const config = {
  transforms: [{
    selector: 'img',
    extract: {
      pattern: /^(.+)\/([^\/]+)\.([^.]+)$/,
      groups: { basePath: 1, filename: 2, ext: 3 }
    },
    urlTemplate: '{basePath}/{filename}_{width}w.{format}',
    widths: [400, 800, 1200],
    formats: ['avif', 'webp', 'original'],
    type: 'picture'
  }]
};
```

### Responsive Srcset

```javascript
const config = {
  transforms: [{
    selector: '.responsive',
    extract: {
      pattern: /^(.+)\/([^\/]+)\.([^.]+)$/,
      groups: { basePath: 1, filename: 2, ext: 3 }
    },
    urlTemplate: '{basePath}/{filename}_{width}w.{ext}',
    widths: [320, 640, 1280],
    type: 'srcset',
    sizes: '(max-width: 640px) 100vw, 50vw'
  }]
};
```

### Multiple Rules

```javascript
const config = {
  transforms: [
    {
      selector: '.hero',
      // Hero image configuration
    },
    {
      selector: '.thumbnail',
      // Thumbnail configuration
    }
  ]
};
```

## TypeScript

Full TypeScript support with type definitions included:

```typescript
import { Config, TransformResult } from 'html-responsive-img';

const config: Config = {
  transforms: [/* ... */]
};

const result: TransformResult = responsify(html, config);
```

## Performance

- Efficient HTML parsing with minimal overhead
- Batched transformations for multiple images
- Streaming support for large documents
- ~85 tests ensuring reliability

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Author

Created with ❤️ for modern responsive web development
