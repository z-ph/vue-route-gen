/**
 * Convert a value to its TypeScript literal type representation
 * Generates precise literal types instead of wide types like string/boolean
 */
export function valueToLiteralType(value: any): string {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }

  const valueType = typeof value;

  // Handle primitive types with literal values
  if (valueType === 'string') {
    return JSON.stringify(value); // Returns "value" with quotes
  }
  if (valueType === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (valueType === 'number') {
    return value.toString();
  }

  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }
    const elementType = value.map(v => valueToLiteralType(v)).join(' | ');
    return `[${elementType}]`;
  }

  // Handle objects
  if (valueType === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return '{}';
    }
    const fields = entries
      .map(([key, val]) => {
        const literalType = valueToLiteralType(val);
        return `    ${key}: ${literalType}`;
      })
      .join(';\n');
    return `{\n${fields}\n  }`;
  }

  return 'any';
}
