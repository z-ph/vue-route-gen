import fs from 'node:fs';
import { parse } from '@vue/compiler-sfc';

/**
 * Parse Vue SFC and extract metadata from <route> custom block
 */
export function extractRouteMeta(filePath: string): Record<string, any> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { descriptor } = parse(content);

    // Find the <route> custom block
    const routeBlock = descriptor.customBlocks.find(
      (block) => block.type === 'route'
    );

    if (!routeBlock) {
      return {};
    }

    // Parse the content of the <route> block
    return parseRouteBlockContent(routeBlock.content);
  } catch (error) {
    // If parsing fails, return empty meta
    console.warn(`Failed to extract meta from ${filePath}:`, error);
    return {};
  }
}

/**
 * Parse the content of <route> custom block
 * The content should be valid JSON or JavaScript object literal
 */
function parseRouteBlockContent(content: string): Record<string, any> {
  const trimmed = content.trim();

  try {
    // Try parsing as JSON first
    return JSON.parse(trimmed);
  } catch {
    // If JSON parsing fails, try evaluating as JavaScript object literal
    try {
      // Use Function constructor for safe evaluation
      // This handles things like unquoted keys, trailing commas, etc.
      const fn = new Function(`return (${trimmed});`);
      return fn();
    } catch (error) {
      console.warn('Failed to parse route block content:', error);
      return {};
    }
  }
}
