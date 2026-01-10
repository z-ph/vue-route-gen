/**
 * Get unique values from array
 */
export function unique<T>(values: T[]): T[] {
  const seen = new Set<T>();
  const out: T[] = [];
  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      out.push(value);
    }
  }
  return out;
}

/**
 * Convert string to constant key format (e.g., "user-detail" -> "USER_DETAIL")
 */
export function toConstKey(input: string): string {
  const withWordBreaks = input.replace(/([a-z0-9])([A-Z])/g, '$1_$2');
  const normalized = withWordBreaks
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return normalized.toUpperCase();
}
