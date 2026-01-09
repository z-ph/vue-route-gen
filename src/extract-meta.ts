import fs from 'node:fs';
import { parse } from '@vue/compiler-sfc';

export interface RouteMeta {
  title?: string;
  layout?: string | false;
  keepAlive?: boolean;
  requiresAuth?: boolean;
  roles?: string[];
  redirect?: string | { name: string; path?: string };
  [key: string]: any;
}

/**
 * Parse Vue SFC and extract metadata from <route> custom block
 */
export function extractRouteMeta(filePath: string): RouteMeta {
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
function parseRouteBlockContent(content: string): RouteMeta {
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
