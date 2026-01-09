import type { Plugin } from 'vite';

/**
 * Vite plugin to handle <route> custom blocks in Vue SFC files
 *
 * This plugin removes <route> custom blocks from Vue files during development/build.
 * The blocks are extracted at build time by vue-route-gen and merged into route config,
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
      if (id.endsWith('.vue')) {
        // Remove <route> custom blocks from the code
        // They've already been extracted by vue-route-gen
        const transformed = code.replace(/<route[^>]*>[\s\S]*?<\/route>/gi, '');

        // Only return transformed code if something changed
        if (transformed !== code) {
          return {
            code: transformed,
            map: null, // No source map needed for this simple transformation
          };
        }
      }
      return undefined;
    },
  };
}

export default routeBlockPlugin;
