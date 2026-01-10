import path from 'node:path';
import type { RouteRecordRaw } from 'vue-router';
import { extractRouteConfig, type RouteConfigOverride } from './extract-route-config.js';
import { normalizePath, scanVueFiles } from './fs-utils.js';
import {
  extractParamName,
  isLayout,
  joinPaths,
  segmentsToPath,
} from './path-utils.js';
import { unique } from './utils.js';

/**
 * Route entry with Vue Router compatible fields
 * Extends RouteRecordRaw but replaces component with importPath string
 */
export interface RouteEntry
  extends Omit<
    RouteRecordRaw,
    'component' | 'components' | 'children' | 'path' | 'name'
  > {
  path: string;
  name: string;  // Override to ensure it's always a string
  importPath: string;
  children: RouteEntry[];
  params?: string[];
}
export interface RouteEntryWithOverride extends RouteEntry{
  configOverride?: RouteConfigOverride;
}

export interface RouteData {
  routes: RouteEntry[];
  routeNameList: readonly string[];
  routePathList: readonly string[];
  routePathByName: [string, string][];
  routeParamsByName: [string, string[]][];
  routeKeyData: Array<{ name: string; path: string; defaultName: string }>;
}

// ============================================================================
// Type Definitions for Intermediate Data Structures
// ============================================================================

interface FileEntry {
  filePath: string;
  importPath: string;
  segments: string[];
}

interface LayoutInfo {
  importPath: string;
  segments: string[];
  depth: number;
}

interface PageWithLayouts {
  importPath: string;
  segments: string[];
  layouts: LayoutInfo[];
}

interface RouteEntryInfo {
  name: string;
  path: string;
  params: string[];
  defaultName: string;
}

interface PageGroupResult {
  layoutGroups: Map<string, PageWithLayouts[]>;
  standalonePages: PageWithLayouts[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Apply route configuration override to default route entry
 * Merges user-provided config with auto-generated defaults
 */
function applyConfigOverride(route: RouteEntryWithOverride): RouteEntry {
  if (!route.configOverride) {
    return route;
  }

  const override = route.configOverride;

  // Fields that should not be overridden
  const { children, params, importPath } = route;

  return {
    ...route,
    // Spread all override fields (alias, redirect, props, beforeEnter, etc.)
    ...override,
    // These fields are always auto-generated and cannot be overridden
    importPath,
    children,
    params,
    // Merge meta: user config takes precedence
    meta: {
      ...route.meta,
      ...override.meta,
    },
  };
}

/**
 * Scan pages directory and convert file paths to entries with normalized paths
 */
function scanAndConvertEntries(
  pagesDir: string,
  outDir: string
): FileEntry[] {
  const files = scanVueFiles(pagesDir);

  return files.map((filePath) => {
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
}

/**
 * Detect and classify layout files from all entries
 */
function classifyLayouts(entries: FileEntry[]): LayoutInfo[] {
  const layoutEntries = entries.filter((entry) => isLayout(entry.segments));

  return layoutEntries
    .map((entry) => {
      const layoutIndex = entry.segments.indexOf('layout');
      return {
        importPath: entry.importPath,
        segments: entry.segments.slice(0, layoutIndex),
        depth: layoutIndex,
      };
    })
    .sort((a, b) => a.depth - b.depth);
}

/**
 * Associate pages with their applicable layouts
 */
function associatePagesWithLayouts(
  pageEntries: FileEntry[],
  layouts: LayoutInfo[]
): PageWithLayouts[] {
  return pageEntries.map((entry) => {
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
}

/**
 * Group pages by their layout (or mark as standalone)
 */
function groupPagesByLayout(pages: PageWithLayouts[]): PageGroupResult {
  const layoutGroups = new Map<string, PageWithLayouts[]>();
  const standalonePages: PageWithLayouts[] = [];

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

  return { layoutGroups, standalonePages };
}

/**
 * Build a single route entry from page information
 * Extracts route config, applies overrides, and generates route metadata
 */
function buildRouteEntry(
  page: PageWithLayouts,
  pagesDir: string,
  basePath: string,
  isTopLevel: boolean
): { route: RouteEntry; info: RouteEntryInfo } {
  const defaultName = page.segments.join('-');
  const routePath = isTopLevel
    ? segmentsToPath(page.segments, true)
    : basePath;

  const params = page.segments
    .map((s) => extractParamName(s))
    .filter((p): p is string => p !== null);

  // Extract config and meta from page component
  const fullPath = path.resolve(
    pagesDir,
    page.importPath.replace(/^\.\//, '')
  );
  const configOverride = extractRouteConfig(fullPath);

  // Apply config override to get the final name and path
  const finalName = configOverride?.name ?? defaultName;
  const finalPath = configOverride?.path ?? routePath;

  const info: RouteEntryInfo = {
    name: finalName,
    path: finalPath,
    params,
    defaultName,
  };

  const route = applyConfigOverride({
    path: routePath,
    name: finalName,
    importPath: page.importPath,
    children: [],
    params,
    configOverride,
  });

  return { route, info };
}

/**
 * Build all standalone routes (pages without layouts)
 */
function buildStandaloneRoutes(
  standalonePages: PageWithLayouts[],
  pagesDir: string
): { routes: RouteEntry[]; infos: RouteEntryInfo[] } {
  const routes: RouteEntry[] = [];
  const infos: RouteEntryInfo[] = [];

  for (const page of standalonePages) {
    const { route, info } = buildRouteEntry(page, pagesDir, '', true);
    routes.push(route);
    infos.push(info);
  }

  return { routes, infos };
}

/**
 * Build layout routes with their children
 */
function buildLayoutRoutes(
  layoutGroups: Map<string, PageWithLayouts[]>,
  pagesDir: string
): { routes: RouteEntry[]; infos: RouteEntryInfo[] } {
  const routes: RouteEntry[] = [];
  const infos: RouteEntryInfo[] = [];

  const sortedGroups = Array.from(layoutGroups.entries()).sort(
    ([a], [b]) => a.localeCompare(b)
  );

  for (const [, pagesInLayout] of sortedGroups) {
    const sortedPages = [...pagesInLayout].sort(
      (a, b) => a.segments.join('/').localeCompare(b.segments.join('/'))
    );

    const layout = sortedPages[0].layouts[0];
    const layoutNameBase = layout.segments.join('-');
    const layoutName = layoutNameBase ? `${layoutNameBase}-layout` : 'layout';
    const layoutPath = segmentsToPath(layout.segments, true);
    const layoutParams = layout.segments
      .map((s) => extractParamName(s))
      .filter((p): p is string => p !== null);

    // Add layout info to metadata
    infos.push({
      name: layoutName,
      path: layoutPath,
      params: layoutParams,
      defaultName: layoutName,
    });

    // Build child routes
    const children: RouteEntry[] = [];
    for (const page of sortedPages) {
      const relativeSegments = page.segments.slice(layout.segments.length);
      const childPath = segmentsToPath(relativeSegments, false);
      const fullPath = joinPaths(layoutPath, childPath);
      const params = relativeSegments
        .map((s) => extractParamName(s))
        .filter((p): p is string => p !== null);

      // Extract config and meta from page component
      const pageFilePath = path.resolve(
        pagesDir,
        page.importPath.replace(/^\.\//, '')
      );
      const configOverride = extractRouteConfig(pageFilePath);

      // Apply config override to get the final name and path
      const defaultName = page.segments.join('-');
      const finalName = configOverride?.name ?? defaultName;
      const finalPath = configOverride?.path ?? fullPath;

      infos.push({
        name: finalName,
        path: finalPath,
        params,
        defaultName,
      });

      children.push(
        applyConfigOverride({
          path: childPath,
          name: finalName,
          importPath: page.importPath,
          children: [],
          params,
          configOverride,
        })
      );
    }

    routes.push({
      path: layoutPath,
      name: layoutName,
      importPath: layout.importPath,
      children,
    });
  }

  return { routes, infos };
}

/**
 * Build route metadata (name/path/params mappings) from route entries
 */
function buildRouteMetadata(
  routeInfos: RouteEntryInfo[]
): {
  routeNameList: readonly string[];
  routePathList: readonly string[];
  routePathByName: [string, string][];
  routeParamsByName: [string, string[]][];
} {
  const uniqueNames = unique(routeInfos.map((entry) => entry.name));
  const uniquePaths = unique(routeInfos.map((entry) => entry.path));

  const pathByName = new Map<string, string>();
  const paramsByName = new Map<string, string[]>();

  for (const entry of routeInfos) {
    if (!pathByName.has(entry.name)) {
      pathByName.set(entry.name, entry.path);
    }
    if (!paramsByName.has(entry.name)) {
      paramsByName.set(entry.name, entry.params);
    }
  }

  const routePathByName: [string, string][] = uniqueNames.map((name) => [
    name,
    pathByName.get(name)!,
  ]);

  return {
    routeNameList: uniqueNames,
    routePathList: uniquePaths,
    routePathByName,
    routeParamsByName: Array.from(paramsByName.entries()),
  };
}

// ============================================================================
// Main Export
// ============================================================================

/**
 * Build route data from pages directory
 */
export function buildRoutes({
  pagesDir,
  outFile,
}: {
  pagesDir: string;
  outFile: string;
}): RouteData {
  const outDir = path.dirname(outFile);

  // Step 1: Scan files and convert to entries
  const entries = scanAndConvertEntries(pagesDir, outDir);

  // Step 2: Classify layouts
  const layouts = classifyLayouts(entries);

  // Step 3: Filter pages and associate with layouts
  const pageEntries = entries
    .filter((entry) => !isLayout(entry.segments))
    .sort((a, b) => a.segments.join('/').localeCompare(b.segments.join('/')));

  const pages = associatePagesWithLayouts(pageEntries, layouts);

  // Step 4: Group pages by layout
  const { layoutGroups, standalonePages } = groupPagesByLayout(pages);

  // Step 5: Build routes
  const { routes: standaloneRoutes, infos: standaloneInfos } =
    buildStandaloneRoutes(standalonePages, pagesDir);

  const { routes: layoutRoutes, infos: layoutInfos } = buildLayoutRoutes(
    layoutGroups,
    pagesDir
  );

  const routes = [...standaloneRoutes, ...layoutRoutes];
  const routeInfos = [...standaloneInfos, ...layoutInfos];

  // Step 6: Build metadata
  const metadata = buildRouteMetadata(routeInfos);

  return {
    routes,
    routeKeyData: routeInfos,
    ...metadata,
  };
}
