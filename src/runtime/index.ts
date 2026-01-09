/**
 * Runtime types and utilities for @zphhpzzph/vue-route-gen
 *
 * This module provides type definitions and utilities for working with route metadata.
 * The actual route metadata is extracted at build time from <route> custom blocks in SFC files.
 */

import type { ComputedRef } from 'vue';
export type { RouteMeta } from './types';

/**
 * Runtime route metadata types
 */
export interface RouteMetaOptions {
  title?: string;
  layout?: string | false;
  keepAlive?: boolean;
  requiresAuth?: boolean;
  roles?: string[];
  redirect?: string | { name: string; path?: string };
  [key: string]: any;
}

/**
 * Route metadata with context information
 */
export interface RouteMetaWithContext {
  meta: RouteMetaOptions;
  routePath: string;
  routeName: string;
}

/**
 * Injection key for route metadata (optional)
 */
export const RouteMetaKey = Symbol('routeMeta');

/**
 * Composable to access current route's metadata (optional)
 * This would require a provider to be set up in the app
 *
 * @example
 * ```ts
 * import { useRouteMeta } from '@zphhpzzph/vue-route-gen/runtime';
 *
 * const meta = useRouteMeta();
 * console.log(meta.value.meta.title); // Page title
 * ```
 */
export function useRouteMeta(): ComputedRef<RouteMetaWithContext> | null {
  // This would be injected by a provider in the app
  // For now, return null as the injection setup is optional
  return null;
}
