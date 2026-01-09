import type { Plugin } from 'vite';

/**
 * Vite plugin to handle <route> custom blocks and defineRoute() macro in Vue SFC files
 *
 * This plugin removes:
 * 1. <route> custom blocks from Vue files during development/build
 * 2. defineRoute() macro calls from <script setup>
 *
 * These are extracted at build time by vue-route-gen and merged into route config,
 * so they should be ignored at runtime to avoid parse errors.
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import vue from '@vitejs/plugin-vue';
 * import { routeBlockPlugin } from '@zphhpzzph/vue-route-gen/vite';
 *
 * export default defineConfig({
 *   plugins: [
 *     routeBlockPlugin(),
 *     vue(),
 *   ],
 * });
 * ```
 */
export function routeBlockPlugin(): Plugin {
  return {
    name: 'vue-route-blocks',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('.vue')) {
        return undefined;
      }

      let transformed = code;
      let hasChanges = false;

      // Remove <route> custom blocks from the code
      // They've already been extracted by vue-route-gen
      const routeBlockRemoved = transformed.replace(/<route[^>]*>[\s\S]*?<\/route>/gi, '');
      if (routeBlockRemoved !== transformed) {
        transformed = routeBlockRemoved;
        hasChanges = true;
      }

      // Remove defineRoute() calls from <script setup>
      // Keep the import statement, remove the call
      const defineRouteRemoved = removeDefineRouteCalls(transformed);
      if (defineRouteRemoved !== transformed) {
        transformed = defineRouteRemoved;
        hasChanges = true;
      }

      // Only return transformed code if something changed
      if (hasChanges) {
        return {
          code: transformed,
          map: null, // No source map needed for this simple transformation
        };
      }

      return undefined;
    },
  };
}

/**
 * Remove defineRoute() calls from Vue SFC code
 * Preserves import statements while removing the macro calls
 */
function removeDefineRouteCalls(code: string): string {
  // Pattern to match defineRoute() calls
  // Supports:
  // - const xxx = defineRoute(...)
  // - defineRoute(...)
  // - With or without variable assignment
  // - With or without trailing semicolon
  const defineRoutePattern = /(?:const|let|var)?\s*\w+\s*=\s*defineRoute\s*\([^)]*\)\s*(?:;|$)?\s*\n?/g;

  // Replace with a comment
  return code.replace(
    defineRoutePattern,
    '// defineRoute() extracted by vue-route-gen\n'
  );
}

export default routeBlockPlugin;
