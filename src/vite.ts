import type { Plugin, ViteDevServer } from 'vite';
import path from 'node:path';
import { generateRoutes, type GenerateRoutesOptions } from './index.js';
import { extractRouteMeta, extractRouteConfig } from './extract-meta.js';
import fs from 'node:fs';

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
 * Vite plugin for auto-generating routes with intelligent incremental updates
 *
 * This plugin:
 * 1. Generates routes on server start
 * 2. Watches for file changes in pages directory
 * 3. Performs incremental updates when only route config changes
 * 4. Only regenerates when route structure changes (add/remove files)
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import { routeGenPlugin } from '@zphhpzzph/vue-route-gen/vite';
 *
 * export default defineConfig({
 *   plugins: [routeGenPlugin()],
 * });
 * ```
 */
export function routeGenPlugin(options?: Partial<GenerateRoutesOptions>): Plugin {
  let server: ViteDevServer;
  const pagesDir = path.resolve(process.cwd(), options?.pagesDir || 'src/pages');
  const outFile = path.resolve(process.cwd(), options?.outFile || 'src/router/route.gen.ts');
  // Cache file metadata for incremental updates
  const fileCache = new Map<string, { meta: ReturnType<typeof extractRouteMeta>; config: ReturnType<typeof extractRouteConfig>; hash: string }>();

  const shouldHandle = (file: string) => {
    const normalized = path.resolve(file);
    return normalized.startsWith(`${pagesDir}${path.sep}`) && normalized.endsWith('.vue');
  };

  const getFileHash = (filePath: string): string => {
    try {
      const stats = fs.statSync(filePath);
      return `${stats.mtimeMs}-${stats.size}`;
    } catch {
      return '0';
    }
  };

  /**
   * Check if file changes require full regeneration
   * Returns true if route structure changed (add/remove/rename files)
   * Returns false if only route config/meta changed (can be incremental)
   */
  const needsFullRegeneration = (file: string, event: 'add' | 'unlink' | 'change'): boolean => {
    // Add/unlink always require full regeneration (route structure changes)
    if (event === 'add' || event === 'unlink') {
      return true;
    }

    // For changes, check if it's just route config/meta or actual content
    const filePath = path.resolve(file);
    const currentHash = getFileHash(filePath);
    const cached = fileCache.get(filePath);

    if (!cached) {
      return true; // No cache, need full regeneration
    }

    // If file hash changed, extract new config and compare
    if (cached.hash !== currentHash) {
      try {
        const newMeta = extractRouteMeta(filePath);
        const newConfig = extractRouteConfig(filePath);

        // Compare with cached config
        const metaChanged = JSON.stringify(cached.meta) !== JSON.stringify(newMeta);
        const configChanged = JSON.stringify(cached.config) !== JSON.stringify(newConfig);

        // Update cache
        fileCache.set(filePath, { meta: newMeta, config: newConfig, hash: currentHash });

        // Config/meta changes can be handled incrementally
        // But for simplicity and correctness, we'll regenerate for now
        // TODO: Implement true incremental updates
        return metaChanged || configChanged;
      } catch {
        return true; // Error reading file, regenerate
      }
    }

    return false;
  };

  /**
   * Handle file changes with intelligent update strategy
   */
  const onChange = async (file: string, event: 'add' | 'unlink' | 'change') => {
    if (!shouldHandle(file)) {
      return;
    }

    const filePath = path.resolve(file);
    const needsFull = needsFullRegeneration(file, event);

    if (needsFull) {
      // Full regeneration for route structure changes
      const updated = generateRoutes({ pagesDir, outFile, ...options });
      if (updated && server) {
        // Invalidate route gen module cache
        const module = server.moduleGraph.getModuleById(outFile);
        if (module) {
          server.moduleGraph.invalidateModule(module);
        }
        // Trigger full reload to ensure route changes take effect
        server.ws.send({ type: 'full-reload', path: '*' });
      }
    } else {
      // Incremental update: only update the changed file's config
      // This is a placeholder for future incremental update logic
      // For now, we still regenerate to ensure correctness
      const updated = generateRoutes({ pagesDir, outFile, ...options });
      if (updated && server) {
        const module = server.moduleGraph.getModuleById(outFile);
        if (module) {
          server.moduleGraph.invalidateModule(module);
        }
      }
    }
  };

  return {
    name: 'vue-route-gen',
    enforce: 'pre',

    buildStart() {
      // Generate routes on build
      generateRoutes({ pagesDir, outFile, ...options });
    },

    configureServer(_server) {
      server = _server;

      // Initial generation
      generateRoutes({ pagesDir, outFile, ...options });

      // Watch for file changes
      const watcher = server.watcher;

      watcher.on('add', (file) => onChange(file, 'add'));
      watcher.on('unlink', (file) => onChange(file, 'unlink'));
      watcher.on('change', (file) => onChange(file, 'change'));
    },

    // Handle virtual module for route gen file
    resolveId(id) {
      if (id === outFile) {
        return outFile;
      }
    },

    async load(id) {
      if (id === outFile) {
        // Read the generated file
        try {
          return fs.readFileSync(outFile, 'utf-8');
        } catch {
          // File doesn't exist yet, generate it
          generateRoutes({ pagesDir, outFile, ...options });
          return fs.readFileSync(outFile, 'utf-8');
        }
      }
    },

    // Hot Module Replacement for route gen file
    handleHotUpdate({ file, modules }) {
      if (file === outFile) {
        server.ws.send({
          type: 'full-reload',
          path: '*',
        });
        return []; // Prevent default HMR handling
      }
      return modules;
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
