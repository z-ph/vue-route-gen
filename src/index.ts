import fs from 'node:fs';
import path from 'node:path';
import { extractRouteMeta } from './extract-meta.js';

const EXCLUDED_DIRS = new Set(['components', 'hooks', 'services','types','constants','utils']);
const CACHE_FILE = path.resolve(process.cwd(), 'node_modules/.cache/route-gen.json');

export interface GenerateRoutesOptions {
  pagesDir?: string;
  outFile?: string;
}

export interface RouteEntry {
  path: string;
  name: string;
  importPath: string;
  children: RouteEntry[];
  params?: string[];
  meta?: Record<string, any>;
}

export interface RouteData {
  routes: RouteEntry[];
  routeNameList: readonly string[];
  routePathList: readonly string[];
  routePathByName: [string, string][];
  routeParamsByName: [string, string[]][];
}

interface FileCache {
  files: string;
  lastRoutesHash: string | null;
}

interface RouteKeyEntry {
  key: string;
  name: string;
  path: string;
}

function normalizePath(p: string): string {
  return p.split(path.sep).join('/');
}

function loadCache(): FileCache {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf8');
      return JSON.parse(data) as FileCache;
    }
  } catch {
    // Ignore cache read errors
  }
  return { files: '{}', lastRoutesHash: null };
}

function saveCache(cache: FileCache): void {
  const cacheDir = path.dirname(CACHE_FILE);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

function getFileHash(filePath: string): string {
  const stats = fs.statSync(filePath);
  return `${stats.mtimeMs}-${stats.size}`;
}

function buildFileHash(pagesDir: string): string {
  const files = scanVueFiles(pagesDir);
  const hashObj: Record<string, string> = {};
  for (const file of files) {
    hashObj[normalizePath(path.relative(pagesDir, file))] = getFileHash(file);
  }
  return JSON.stringify(hashObj);
}

function scanVueFiles(rootDir: string): string[] {
  const files: string[] = [];
  const stack: string[] = [rootDir];

  while (stack.length > 0) {
    const dir = stack.pop()!;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry.name)) {
          continue;
        }
        stack.push(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith('.vue')) {
        files.push(fullPath);
      }
    }
  }

  return files.sort();
}

function isLayout(segments: string[]): boolean {
  const last = segments[segments.length - 1];
  const secondLast = segments[segments.length - 2];
  return last === 'layout' || (last === 'index' && secondLast === 'layout');
}

function extractParamName(segment: string): string | null {
  if (segment.startsWith('$')) {
    return segment.slice(1);
  }
  if (segment.startsWith('[') && segment.endsWith(']')) {
    return segment.slice(1, -1);
  }
  return null;
}

function segmentToPath(segment: string): string {
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

function segmentsToPath(segments: string[], leadingSlash: boolean): string {
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

function joinPaths(parent: string, child: string): string {
  if (!child) {
    return parent || '/';
  }
  if (!parent || parent === '/') {
    return `/${child}`.replace(/\/+/g, '/');
  }
  return `${parent.replace(/\/$/, '')}/${child}`.replace(/\/+/g, '/');
}

function renderRoute(route: RouteEntry, indent = '  '): string {
  const nextIndent = `${indent}  `;
  const lines: string[] = [];

  lines.push(`${indent}{`);
  lines.push(`${nextIndent}path: ${JSON.stringify(route.path)},`);
  lines.push(`${nextIndent}name: ${JSON.stringify(route.name)},`);
  lines.push(
    `${nextIndent}component: () => import(${JSON.stringify(route.importPath)}),`
  );

  // Add meta if present
  if (route.meta && Object.keys(route.meta).length > 0) {
    lines.push(`${nextIndent}meta: ${JSON.stringify(route.meta)},`);
  }

  if (route.children.length === 0) {
    lines.push(`${nextIndent}children: [],`);
  } else {
    lines.push(`${nextIndent}children: [`);
    lines.push(
      route.children
        .map((child) => renderRoute(child, `${nextIndent}  `))
        .join(',\n')
    );
    lines.push(`${nextIndent}],`);
  }

  lines.push(`${indent}}`);
  return lines.join('\n');
}

function unique<T>(values: T[]): T[] {
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

function toConstKey(input: string): string {
  const withWordBreaks = input.replace(/([a-z0-9])([A-Z])/g, '$1_$2');
  const normalized = withWordBreaks
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return normalized.toUpperCase();
}

function buildRoutes({ pagesDir, outFile }: { pagesDir: string; outFile: string }): RouteData {
  const files = scanVueFiles(pagesDir);
  const outDir = path.dirname(outFile);

  const entries = files.map((filePath) => {
    const relPath = normalizePath(path.relative(pagesDir, filePath));
    const withoutExt = relPath.replace(/\.vue$/, '');
    const segments = withoutExt.split('/');
    const importPath = normalizePath(path.relative(outDir, filePath));
    const normalizedImportPath =
      importPath.startsWith('.') ? importPath : `./${importPath}`;

    return {
      filePath,
      importPath: normalizedImportPath,
      segments,
    };
  });

  const layoutEntries = entries.filter((entry) => isLayout(entry.segments));
  const layouts = layoutEntries
    .map((entry) => {
      const layoutIndex = entry.segments.indexOf('layout');
      return {
        importPath: entry.importPath,
        segments: entry.segments.slice(0, layoutIndex),
        depth: layoutIndex,
      };
    })
    .sort((a, b) => a.depth - b.depth);

  const pageEntries = entries
    .filter((entry) => !isLayout(entry.segments))
    .sort((a, b) => a.segments.join('/').localeCompare(b.segments.join('/')));

  const pages = pageEntries.map((entry) => {
    const pageLayouts = layouts.filter((layout) => {
      if (layout.segments.length > entry.segments.length) {
        return false;
      }
      return layout.segments.every(
        (segment, index) => segment === entry.segments[index]
      );
    });

    return {
      importPath: entry.importPath,
      segments: entry.segments,
      layouts: pageLayouts,
    };
  });

  const layoutGroups = new Map<string, typeof pages>();
  const standalonePages: typeof pages = [];

  for (const page of pages) {
    if (page.layouts.length === 0) {
      standalonePages.push(page);
      continue;
    }

    const layoutKey = page.layouts[0].segments.join('/');
    const group = layoutGroups.get(layoutKey) ?? [];
    group.push(page);
    layoutGroups.set(layoutKey, group);
  }

  const routeEntries: Array<{ name: string; path: string; params: string[] }> = [];
  const standaloneRoutes = standalonePages.map((page) => {
    const name = page.segments.join('-');
    const routePath = segmentsToPath(page.segments, true);
    const params = page.segments
      .map((s) => extractParamName(s))
      .filter((p): p is string => p !== null);

    routeEntries.push({ name, path: routePath, params });

    // Extract meta from page component
    const fullPath = path.resolve(pagesDir, page.importPath.replace(/^\.\//, ''));
    const meta = extractRouteMeta(fullPath);

    return {
      path: routePath,
      name,
      importPath: page.importPath,
      children: [],
      params,
      meta,
    };
  });

  const layoutRoutes = Array.from(layoutGroups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, pagesInLayout]) => {
      const sortedPages = [...pagesInLayout].sort((a, b) =>
        a.segments.join('/').localeCompare(b.segments.join('/'))
      );
      const layout = sortedPages[0].layouts[0];
      const layoutNameBase = layout.segments.join('-');
      const layoutName = layoutNameBase ? `${layoutNameBase}-layout` : 'layout';
      const layoutPath = segmentsToPath(layout.segments, true);
      const layoutParams = layout.segments
        .map((s) => extractParamName(s))
        .filter((p): p is string => p !== null);

      routeEntries.push({ name: layoutName, path: layoutPath, params: layoutParams });

      const children = sortedPages.map((page) => {
        const name = page.segments.join('-');
        const relativeSegments = page.segments.slice(layout.segments.length);
        const childPath = segmentsToPath(relativeSegments, false);
        const fullPath = joinPaths(layoutPath, childPath);
        const params = relativeSegments
          .map((s) => extractParamName(s))
          .filter((p): p is string => p !== null);

        routeEntries.push({ name, path: fullPath, params });

        // Extract meta from page component
        const pageFilePath = path.resolve(pagesDir, page.importPath.replace(/^\.\//, ''));
        const meta = extractRouteMeta(pageFilePath);

        return {
          path: childPath,
          name,
          importPath: page.importPath,
          children: [],
          params,
          meta,
        };
      });

      return {
        path: layoutPath,
        name: layoutName,
        importPath: layout.importPath,
        children,
      };
    });

  const routes = [...standaloneRoutes, ...layoutRoutes];

  const uniqueNames = unique(routeEntries.map((entry) => entry.name));
  const uniquePaths = unique(routeEntries.map((entry) => entry.path));

  const pathByName = new Map<string, string>();
  const paramsByName = new Map<string, string[]>();
  for (const entry of routeEntries) {
    if (!pathByName.has(entry.name)) {
      pathByName.set(entry.name, entry.path);
    }
    if (!paramsByName.has(entry.name)) {
      paramsByName.set(entry.name, entry.params);
    }
  }

  const routePathByName: [string, string][] = uniqueNames.map((name) => [name, pathByName.get(name)!]);

  return {
    routes,
    routeNameList: uniqueNames,
    routePathList: uniquePaths,
    routePathByName,
    routeParamsByName: Array.from(paramsByName.entries()),
  };
}

function renderRoutesFile({
  routes,
  routeNameList,
  routePathList,
  routePathByName,
  routeParamsByName
}: RouteData): string {
  const lines: string[] = [];
  const pathByName = new Map<string, string>(routePathByName);
  const paramsByName = new Map<string, string[]>(routeParamsByName);
  const routeKeyEntries: RouteKeyEntry[] = [];
  const usedKeys = new Set<string>();

  for (const name of routeNameList) {
    const baseKey = toConstKey(name) || 'ROUTE';
    let key = baseKey;
    let suffix = 1;
    while (usedKeys.has(key)) {
      suffix += 1;
      key = `${baseKey}_${suffix}`;
    }
    usedKeys.add(key);
    routeKeyEntries.push({
      key,
      name,
      path: pathByName.get(name)!,
    });
  }

  lines.push('// This file is auto-generated by @zphhpzzph/vue-route-gen.');
  lines.push('// Do not edit this file directly.');
  lines.push("import type { RouteRecordRaw, RouteLocationNormalizedLoaded, Router, LocationQuery } from 'vue-router';");
  lines.push('');

  lines.push('export const ROUTE_NAME = {');
  lines.push(
    routeKeyEntries
      .map((entry) => `  ${entry.key}: ${JSON.stringify(entry.name)},`)
      .join('\n')
  );
  lines.push('} as const;');
  lines.push('');
  lines.push('export type RouteName = (typeof ROUTE_NAME)[keyof typeof ROUTE_NAME];');
  lines.push('');

  lines.push('export const ROUTE_PATH = {');
  lines.push(
    routeKeyEntries
      .map((entry) => `  ${entry.key}: ${JSON.stringify(entry.path)},`)
      .join('\n')
  );
  lines.push('} as const;');
  lines.push('');
  lines.push('export type RoutePath = (typeof ROUTE_PATH)[keyof typeof ROUTE_PATH];');
  lines.push('');

  lines.push('export const ROUTE_PATH_BY_NAME = {');
  lines.push(
    routeKeyEntries
      .map((entry) => `  ${JSON.stringify(entry.name)}: ROUTE_PATH.${entry.key},`)
      .join('\n')
  );
  lines.push('} as const;');
  lines.push('');
  lines.push('export type RoutePathByName = typeof ROUTE_PATH_BY_NAME;');
  lines.push('');

  lines.push('export const routeNameList = [');
  lines.push(routeNameList.map((name) => `  ${JSON.stringify(name)},`).join('\n'));
  lines.push('] as const;');
  lines.push('');

  lines.push('export const routePathList = [');
  lines.push(routePathList.map((path) => `  ${JSON.stringify(path)},`).join('\n'));
  lines.push('] as const;');
  lines.push('');

  lines.push('export const routePathByName = {');
  lines.push(
    routePathByName
      .map(([name, pathValue]) =>
        `  ${JSON.stringify(name)}: ${JSON.stringify(pathValue)},`
      )
      .join('\n')
  );
  lines.push('} as const;');
  lines.push('');

  // Generate route parameter types
  lines.push('// Route parameter types');
  lines.push('export interface RouteParams {');
  for (const [name, params] of routeParamsByName) {
    if (params.length > 0) {
      const paramsStr = params.map(p => `    ${p}: string;`).join('\n');
      lines.push(`  '${name}': {`);
      lines.push(paramsStr);
      lines.push(`  };`);
    } else {
      lines.push(`  '${name}': Record<string, never>;`);
    }
  }
  lines.push('}');
  lines.push('');

  lines.push('export type RouteParamsByName<T extends RouteName> = RouteParams[T];');
  lines.push('');

  // Generate route meta types
  lines.push('// Route metadata types (extracted from <route> blocks)');
  lines.push('export interface RouteMetaMap {');
  for (const route of routes) {
    const routeName = route.name;
    const meta = route.meta;

    if (meta && Object.keys(meta).length > 0) {
      // Generate type definition for this route's meta
      const metaFields = Object.entries(meta)
        .map(([key, value]) => {
          const valueType = typeof value;
          if (valueType === 'string') {
            return `    ${key}: string;`;
          } else if (valueType === 'boolean') {
            return `    ${key}: boolean;`;
          } else if (valueType === 'number') {
            return `    ${key}: number;`;
          } else if (Array.isArray(value)) {
            return `    ${key}: ${typeof value[0]}[];`;
          } else if (valueType === 'object') {
            return `    ${key}: Record<string, any>;`;
          }
          return `    ${key}: any;`;
        })
        .join('\n');

      lines.push(`  '${routeName}': {`);
      lines.push(metaFields);
      lines.push(`  };`);
    } else {
      lines.push(`  '${routeName}': Record<string, never>;`);
    }
  }
  lines.push('}');
  lines.push('');

  lines.push('export type RouteMetaByName<T extends RouteName> = RouteMetaMap[T];');
  lines.push('');

  lines.push('export const routes = [');
  lines.push(routes.map((route) => renderRoute(route)).join(',\n'));
  lines.push('] satisfies RouteRecordRaw[];');
  lines.push('');
  lines.push('export default routes;');
  lines.push('');

  // Add type-enhanced hooks
  lines.push('// Type-enhanced hooks');
  lines.push("import { useRoute as vueUseRoute, useRouter as vueUseRouter } from 'vue-router';");
  lines.push('');

  // Generate useRoute with proper types
  lines.push('/**');
  lines.push(' * Type-safe useRoute hook');
  lines.push(' * Route params and meta are typed based on the current route name');
  lines.push(' *');
  lines.push(' * @example');
  lines.push(' * ```ts');
  lines.push(' * const route = useRoute();');
  lines.push(' * // route.params.id is typed as string if route has :id param');
  lines.push(' * // route.meta.title is typed based on the route\'s <route> block');
  lines.push(' * ```');
  lines.push(' */');
  lines.push('export function useRoute<TName extends RouteName = RouteName>(');
  lines.push('  name?: TName');
  lines.push('): Omit<RouteLocationNormalizedLoaded, \'params\' | \'name\' | \'meta\'> & {');
  lines.push('  name: TName;');
  lines.push('  params: TName extends keyof RouteParams ? RouteParams[TName] : RouteParams[RouteName];');
  lines.push('  meta: TName extends keyof RouteMetaMap ? RouteMetaMap[TName] : RouteMetaMap[RouteName];');
  lines.push('} {');
  lines.push('  return vueUseRoute() as any;');
  lines.push('}');
  lines.push('');

  // Generate useRouter with proper types
  lines.push('/**');
  lines.push(' * Type-safe useRouter hook');
  lines.push(' * Navigation methods are type-safe based on route names and params');
  lines.push(' *');
  lines.push(' * @example');
  lines.push(' * ```ts');
  lines.push(' * const router = useRouter();');
  lines.push(' * router.push({');
  lines.push(' *   name: ROUTE_NAME.USER_DETAIL,');
  lines.push(' *   params: { id: \'123\' }');
  lines.push(' * });');
  lines.push(' * ```');
  lines.push(' */');
  lines.push('export function useRouter(): Omit<Router, \'push\' | \'replace\'> & {');
  lines.push('  push: <TName extends RouteName>(location: {');
  lines.push('    name?: TName;');
  lines.push('    path?: string;');
  lines.push('    params?: TName extends keyof RouteParams ? Partial<RouteParams[TName]> : Record<string, any>;');
  lines.push('    query?: LocationQuery;');
  lines.push('    hash?: string;');
  lines.push('  }) => ReturnType<Router[\'push\']>;');
  lines.push('  replace: <TName extends RouteName>(location: {');
  lines.push('    name?: TName;');
  lines.push('    path?: string;');
  lines.push('    params?: TName extends keyof RouteParams ? Partial<RouteParams[TName]> : Record<string, any>;');
  lines.push('    query?: LocationQuery;');
  lines.push('    hash?: string;');
  lines.push('  }) => ReturnType<Router[\'replace\']>;');
  lines.push('} {');
  lines.push('  const router = vueUseRouter();');
  lines.push('  return router as any;');
  lines.push('}');
  lines.push('');

  // Add type-enhanced RouteLink component
  lines.push('// Type-enhanced RouteLink component');
  lines.push("import { RouteLink as BaseRouteLink } from '@zphhpzzph/vue-route-gen/runtime';");
  lines.push('');

  lines.push('/**');
  lines.push(' * Type-safe RouteLink component');
  lines.push(' *');
  lines.push(' * For full type safety, use the component with specific route name and params:');
  lines.push(' *');
  lines.push(' * @example');
  lines.push(' * ```vue');
  lines.push(' * <RouteLink :name="ROUTE_NAME.USERS_ID" :params="{ id: \'123\' }">');
  lines.push(' *   View User');
  lines.push(' * </RouteLink>');
  lines.push(' *');
  lines.push(' * <RouteLink :name="ROUTE_NAME.INDEX">');
  lines.push(' *   Home');
  lines.push(' * </RouteLink>');
  lines.push(' * ```');
  lines.push(' *');
  lines.push(' * Type helpers:');
  lines.push(' * - `name`: RouteName (autocompletes route names)');
  lines.push(' * - `params`: RouteParamsByName<typeof ROUTE_NAME.YOUR_ROUTE>');
  lines.push(' */');
  lines.push('export const RouteLink = BaseRouteLink;');
  lines.push('');

  return `${lines.join('\n')}\n`;
}

export function generateRoutes({
  pagesDir = path.resolve(process.cwd(), 'src/pages'),
  outFile = path.resolve(process.cwd(), 'src/router/route.gen.ts'),
}: GenerateRoutesOptions = {}): boolean {
  if (!fs.existsSync(pagesDir)) {
    throw new Error(`Pages directory not found: ${pagesDir}`);
  }

  // Load cache and check if we can skip generation
  const cache = loadCache();
  const currentFilesHash = buildFileHash(pagesDir);

  // If files haven't changed and output exists, skip generation
  if (cache.files === currentFilesHash && fs.existsSync(outFile)) {
    return false;
  }

  const data = buildRoutes({ pagesDir, outFile });
  const output = renderRoutesFile(data);

  fs.mkdirSync(path.dirname(outFile), { recursive: true });

  if (fs.existsSync(outFile)) {
    const current = fs.readFileSync(outFile, 'utf8');
    if (current === output) {
      // Save cache even if output unchanged
      saveCache({ files: currentFilesHash, lastRoutesHash: currentFilesHash });
      return false;
    }
  }

  fs.writeFileSync(outFile, output, 'utf8');

  // Save cache after successful generation
  saveCache({ files: currentFilesHash, lastRoutesHash: currentFilesHash });
  return true;
}
