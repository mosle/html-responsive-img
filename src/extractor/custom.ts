/**
 * Collection of common custom extraction functions
 */

/**
 * Extract components from Cloudinary URLs
 */
export function extractCloudinaryUrl(src: string): Record<string, string> | null {
  const match = src.match(
    /cloudinary\.com\/([^\/]+)\/image\/upload\/(?:.*\/)?v\d+\/(.+)\.([^.]+)$/
  );

  if (match) {
    return {
      account: match[1],
      publicId: match[2],
      ext: match[3],
      base: src.substring(0, src.indexOf('/v'))
    };
  }

  return null;
}

/**
 * Extract components from S3 URLs
 */
export function extractS3Url(src: string): Record<string, string> | null {
  try {
    const url = new URL(src);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const filename = pathParts[pathParts.length - 1];
    const [name, ext] = filename.split('.');
    const bucket = url.hostname.split('.')[0];
    const path = pathParts.slice(0, -1).join('/');

    return {
      bucket,
      path,
      name: name || '',
      ext: ext || '',
      region: url.hostname.includes('.s3.')
        ? url.hostname.split('.s3.')[1].split('.')[0]
        : 'us-east-1'
    };
  } catch {
    return null;
  }
}

/**
 * Extract components from a standard URL
 */
export function extractStandardUrl(src: string): Record<string, string> | null {
  try {
    const url = new URL(src, 'https://example.com');
    const pathParts = url.pathname.split('/').filter(Boolean);
    const filename = pathParts[pathParts.length - 1] || '';
    const [name, ext] = filename.split('.');

    return {
      protocol: url.protocol.replace(':', ''),
      domain: url.hostname,
      path: pathParts.slice(0, -1).join('/'),
      filename: name || '',
      ext: ext || '',
      query: url.search
    };
  } catch {
    // Try as relative path
    const parts = src.split('/').filter(Boolean);
    const filename = parts[parts.length - 1] || '';
    const [name, ext] = filename.split('.');

    return {
      path: parts.slice(0, -1).join('/'),
      filename: name || '',
      ext: ext || ''
    };
  }
}