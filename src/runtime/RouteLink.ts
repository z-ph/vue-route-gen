import { defineComponent, computed, type PropType, h } from 'vue';
import { RouterLink } from 'vue-router';
import type { LocationQuery, RouterLinkProps } from 'vue-router';

/**
 * Base RouteLink component without type augmentation
 *
 * The actual type-safe version should be generated in route.gen.ts
 * with proper RouteName and RouteParams types
 *
 * This component will work at runtime but won't provide type safety
 * Use the type-enhanced version from route.gen.ts for full type safety
 *
 * @example
 * ```vue
 * // Without type safety (runtime only)
 * <RouteLink name="users-[id]" :params="{ id: '123' }">
 *   View User
 * </RouteLink>
 *
 * // With type safety (import from route.gen.ts)
 * <RouteLink :name="ROUTE_NAME.USERS_ID" :params="{ id: '123' }">
 *   View User
 * </RouteLink>
 * ```
 */
export const RouteLink = defineComponent({
  name: 'RouteLink',
  inheritAttrs: false,
  props: {
    /**
     * Route name from ROUTE_NAME constants
     */
    name: {
      type: String as PropType<string>,
      required: true,
      validator: (value: string) => {
        if (process.env.NODE_ENV !== 'production') {
          // Validation will be handled by generated type-safe version
          return true;
        }
        return true;
      },
    },
    /**
     * Route parameters
     * Type-safe version will validate parameters based on route name
     */
    params: {
      type: Object as PropType<Record<string, string | number>>,
      required: false,
    },
    /**
     * Query parameters
     */
    query: {
      type: Object as PropType<LocationQuery>,
      required: false,
    },
    /**
     * URL hash
     */
    hash: {
      type: String,
      required: false,
      default: '',
    },
    /**
     * RouterLink custom prop
     */
    custom: {
      type: Boolean,
      required: false,
      default: false,
    },
    /**
     * RouterLink replace prop
     */
    replace: {
      type: Boolean,
      required: false,
      default: false,
    },
    /**
     * Active class for the link
     */
    activeClass: {
      type: String,
      required: false,
      default: undefined,
    },
    /**
     * Exact active class for the link
     */
    exactActiveClass: {
      type: String,
      required: false,
      default: undefined,
    },
    /**
     * aria-current value for the link
     */
    ariaCurrentValue: {
      type: String as PropType<'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false'>,
      required: false,
      default: undefined,
    },
  },
  setup(props, { slots, attrs }) {
    const to = computed(() => {
      const location: Record<string, any> = {
        name: props.name,
      };

      if (props.params) {
        location.params = props.params;
      }

      if (props.query) {
        location.query = props.query;
      }

      if (props.hash) {
        location.hash = props.hash;
      }

      return location;
    });

    return () => {
      return h(
        RouterLink,
        {
          to: to.value,
          custom: props.custom,
          replace: props.replace,
          activeClass: props.activeClass,
          exactActiveClass: props.exactActiveClass,
          ariaCurrentValue: props.ariaCurrentValue,
          ...attrs,
        },
        slots
      );
    };
  },
});

export default RouteLink;
