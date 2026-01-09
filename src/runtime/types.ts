/**
 * Runtime route metadata types
 */

export interface RouteMeta {
  title?: string;
  layout?: string | false;
  keepAlive?: boolean;
  requiresAuth?: boolean;
  roles?: string[];
  redirect?: string | { name: string; path?: string };
}
