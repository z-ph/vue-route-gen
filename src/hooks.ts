import type {
  RouteLocationNormalizedLoaded,
  Router,
  RouteParams as VueRouteParams,
  LocationQuery,
} from 'vue-router';

/**
 * Type-safe route location for navigation
 */
export interface TypedRouteLocation<
  TName extends string = string,
  TParams = Record<string, any>,
> {
  name?: TName;
  path?: string;
  params?: TParams & VueRouteParams;
  query?: LocationQuery;
  hash?: string;
  state?: Record<string, any>;
}

/**
 * Type-safe router push/replace method
 */
export type TypedNavigationMethod = <
  TName extends string,
  TParams extends Record<string, any> = Record<string, any>,
>(
  location: TypedRouteLocation<TName, TParams>,
) => ReturnType<Router['push']>;

/**
 * Enhanced Router with typed navigation methods
 */
export interface TypedRouter extends Omit<Router, 'push' | 'replace'> {
  /**
   * Programmatically navigate to a new URL with type safety
   */
  push: TypedNavigationMethod;
  /**
   * Programmatically replace the current location with type safety
   */
  replace: TypedNavigationMethod;
}

/**
 * Enhanced RouteLocationNormalized with typed params
 */
export interface TypedRoute<
  TName extends string = string,
  TParams extends Record<string, any> = Record<string, any>,
> extends Omit<RouteLocationNormalizedLoaded, 'params' | 'name'> {
  name: TName;
  params: TParams & VueRouteParams;
}

/**
 * Creates a typed useRoute hook with the given route parameters type
 */
export function createTypedUseRoute<
  TName extends string,
  TParams extends Record<string, any>,
>() {
  return function useRoute(): TypedRoute<TName, TParams> {
    const { useRoute: vueUseRoute } = require('vue-router');
    return vueUseRoute() as TypedRoute<TName, TParams>;
  };
}

/**
 * Creates a typed useRouter hook with route parameter type checking
 */
export function createTypedUseRouter() {
  return function useRouter(): TypedRouter {
    const { useRouter: vueUseRouter } = require('vue-router');
    const router = vueUseRouter();

    const typedPush: TypedNavigationMethod = (location) => {
      return router.push(location as any);
    };

    const typedReplace: TypedNavigationMethod = (location) => {
      return router.replace(location as any);
    };

    return {
      ...router,
      push: typedPush,
      replace: typedReplace,
    };
  };
}
