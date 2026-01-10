/**
 * Check if segments represent a layout file
 */
export function isLayout(segments: string[]): boolean {
  const last = segments[segments.length - 1];
  const secondLast = segments[segments.length - 2];
  return last === 'layout' || (last === 'index' && secondLast === 'layout');
}

/**
 * Extract parameter name from segment (e.g., $id or [id] -> id)
 */
export function extractParamName(segment: string): string | null {
  if (segment.startsWith('$')) {
    return segment.slice(1);
  }
  if (segment.startsWith('[') && segment.endsWith(']')) {
    return segment.slice(1, -1);
  }
  return null;
}

/**
 * Convert segment to path segment
 */
export function segmentToPath(segment: string): string {
  if (segment.includes('.')) {
    return segment.split('.').join('/');
  }
  if (segment === 'index') {
    return '';
  }
  const paramName = extractParamName(segment);
  if (paramName) {
    return `:${paramName}`;
  }
  return segment;
}

/**
 * Convert segments array to path string
 */
export function segmentsToPath(segments: string[], leadingSlash: boolean): string {
  const rawPath = segments.map(segmentToPath).join('/');
  const cleaned = rawPath.replace(/\/+/g, '/').replace(/\/$/, '');

  if (leadingSlash) {
    if (!cleaned) {
      return '/';
    }
    return `/${cleaned}`;
  }

  return cleaned;
}

/**
 * Join parent and child paths
 */
export function joinPaths(parent: string, child: string): string {
  if (!child) {
    return parent || '/';
  }
  if (!parent || parent === '/') {
    return `/${child}`.replace(/\/+/g, '/');
  }
  return `${parent.replace(/\/$/, '')}/${child}`.replace(/\/+/g, '/');
}
