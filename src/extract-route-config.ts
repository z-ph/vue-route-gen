import fs from 'node:fs';
import { parse } from '@vue/compiler-sfc';
import type { RouteRecordRaw, RouteRecordRedirectOption, _RouteRecordProps } from 'vue-router';

// Type alias for backward compatibility
type RouteRecordProps = _RouteRecordProps;

/**
 * Route configuration override interface
 * Supports all RouteRecordRaw fields for complete customization
 */
export interface RouteConfigOverride {
  path?: string;
  name?: string;
  alias?: string | string[];
  redirect?: RouteRecordRedirectOption;
  props?: RouteRecordProps;
  meta?: Record<string, any>;
  children?: RouteRecordRaw[];
  beforeEnter?: any;
  [key: string]: any; // Allow any other RouteRecordRaw fields
}

/**
 * Parse Vue SFC and extract complete route configuration
 * Supports both <route> custom block and defineRoute() macro
 *
 * @param filePath - Path to the Vue SFC file
 * @returns Route configuration override, or undefined if no custom config
 * @throws Error if both <route> block and defineRoute() are present
 */
export function extractRouteConfig(filePath: string): RouteConfigOverride | undefined {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { descriptor } = parse(content);

    // Detect conflict between <route> block and defineRoute()
    const hasRouteBlock = descriptor.customBlocks.some((b) => b.type === 'route');
    const hasDefineRoute = descriptor.scriptSetup?.content.includes('defineRoute');

    if (hasRouteBlock && hasDefineRoute) {
      throw new Error(
        `[vue-route-gen] Error in ${filePath}:\n` +
          'Cannot use both <route> custom block and defineRoute() macro.\n' +
          'Please choose one method:\n' +
          '  - Use <route> block in template section\n' +
          '  - Use defineRoute() in <script setup>\n\n' +
          'Example:\n' +
          '  <route>{ "path": "/custom" }</route>\n' +
          '  OR\n' +
          '  <script setup>\n' +
          '    defineRoute({ path: "/custom" })\n' +
          '  </script>'
      );
    }

    // Extract from <route> block
    if (hasRouteBlock) {
      const routeBlock = descriptor.customBlocks.find((b) => b.type === 'route');
      return parseRouteConfig(routeBlock!.content);
    }

    // Extract from defineRoute() call
    if (hasDefineRoute) {
      const defineRouteCall = extractDefineRouteCall(descriptor.scriptSetup!.content);
      if (defineRouteCall) {
        return evaluateDefineRouteCall(defineRouteCall, descriptor.scriptSetup!.content);
      }
    }

    return undefined;
  } catch (error) {
    // Re-throw conflict errors as they are user errors
    if (error instanceof Error && error.message.includes('Cannot use both')) {
      throw error;
    }
    // Warn about other errors but don't fail the build
    console.warn(`[vue-route-gen] Failed to extract route config from ${filePath}:`, error);
    return undefined;
  }
}


/**
 * Extract defineRoute() call content from script setup
 */
function extractDefineRouteCall(scriptContent: string): string | null {
  // Match: const xxx = defineRoute(...) or defineRoute(...)
  // Support both variable assignment and direct call
  const patterns = [
    // const/let/var xxx = defineRoute(...)
    /(?:const|let|var)\s+\w+\s*=\s*defineRoute\s*\(([\s\S]*?)\)\s*(?:;|$)/,
    // Direct defineRoute(...) call
    /defineRoute\s*\(([\s\S]*?)\)\s*(?:;|$)/,
  ];

  for (const pattern of patterns) {
    const match = scriptContent.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Evaluate defineRoute() call content with constant replacement
 * Phase 1 MVP: Simple evaluation without complex constant resolution
 */
function evaluateDefineRouteCall(callContent: string, scriptContent: string): RouteConfigOverride | undefined {
  try {
    // Phase 1 MVP: Direct evaluation without constant replacement
    // Future enhancement: Parse imports and replace constants
    return parseRouteConfig(callContent);
  } catch (error) {
    console.warn('[vue-route-gen] Failed to evaluate defineRoute() call:', error);
    return undefined;
  }
}

/**
 * Parse route configuration from content
 * Supports both JSON and JavaScript object literal syntax
 */
function parseRouteConfig(content: string): RouteConfigOverride | undefined {
  const trimmed = content.trim();

  try {
    // Try parsing as JSON first
    const parsed = JSON.parse(trimmed);
    return parsed as RouteConfigOverride;
  } catch {
    // If JSON parsing fails, try evaluating as JavaScript object literal
    try {
      // Use Function constructor for safe evaluation
      const fn = new Function(`return (${trimmed});`);
      return fn() as RouteConfigOverride;
    } catch (error) {
      console.warn('[vue-route-gen] Failed to parse route config:', error);
      return undefined;
    }
  }
}
