# @zphhpzzph/vue-route-gen

> English | [简体中文](./README.md)

Vue 3 file-based route generator for Vue Router with complete type inference support.

## Features

- Automatic route discovery from file structure
- Layout support (`layout.vue` or `layout/index.vue`)
- Dynamic route parameters (`$param` or `[param]`)
- Cache mechanism for fast rebuilds
- TypeScript support with generated types
- **Type-safe route hooks** (`useRoute` and `useRouter` with full type inference)
- **Automatic route parameter type extraction from dynamic routes**

## Installation

```bash
npm install @zphhpzzph/vue-route-gen
# or
pnpm install @zphhpzzph/vue-route-gen
# or
yarn add @zphhpzzph/vue-route-gen
```

## Usage

### CLI

```bash
vue-route-gen
```

### Programmatic

```typescript
import { generateRoutes } from '@zphhpzzph/vue-route-gen';

// Generate routes with default options
generateRoutes();

// Or specify custom directories
generateRoutes({
  pagesDir: './src/pages',
  outFile: './src/router/route.gen.ts'
});
```

## File Structure

```
src/pages/
├── layout.vue              # Root layout
├── index.vue               # Home page (/)
├── about.vue               # About page (/about)
├── users/
│   ├── layout.vue          # Users layout (/users)
│   ├── index.vue           # Users list (/users)
│   └── [id].vue            # User detail (/users/:id)
└── $slug.vue               # Catch-all (/:slug)
```

## Configuration

### Options

- `pagesDir`: Pages directory path (default: `src/pages`)
- `outFile`: Output file path (default: `src/router/route.gen.ts`)

### Excluded Directories

The following directories are automatically excluded:
- `components`
- `hooks`
- `services`
- `types`
- `constants`
- `utils`

## Generated Output

The generator creates:

1. `ROUTE_NAME` - Route name constants
2. `ROUTE_PATH` - Route path constants
3. `ROUTE_PATH_BY_NAME` - Path lookup by name
4. `RouteParams` - Interface with parameter types for each route
5. `RouteParamsByName<T>` - Utility type to get params by route name
6. `routes` - Vue Router route records array
7. `useRoute()` - Type-safe hook for accessing current route with typed params
8. `useRouter()` - Type-safe hook for navigation with parameter validation

## Type-Safe Routing

### Generated Parameter Types

For a route like `/users/[id].vue`, the generator automatically extracts the `id` parameter:

```typescript
// Generated in route.gen.ts
export interface RouteParams {
  'users-[id]': {
    id: string;
  };
  // ... other routes
}
```

### Using useRoute

The generated `useRoute` hook provides full type inference for route parameters:

```typescript
import { useRoute, ROUTE_NAME } from '@/router/route.gen';

const route = useRoute<'users-[id]'>();
// route.params.id is typed as `string`

if (route.name === ROUTE_NAME.USERS_ID) {
  console.log(route.params.id); // Fully typed!
}
```

### Using useRouter

The generated `useRouter` hook provides type-safe navigation:

```typescript
import { useRouter, ROUTE_NAME } from '@/router/route.gen';

const router = useRouter();

// Type-safe navigation - TypeScript will validate params
router.push({
  name: ROUTE_NAME.USERS_ID,
  params: { id: '123' } // Required parameters are checked
});

// Error: Type '{ id: string; }' is not assignable to type 'Record<string, never>'
router.push({
  name: ROUTE_NAME.HOME, // HOME route has no params
  params: { id: '123' } // TypeScript error!
});
```

## Complete Example

### Project Structure

```
src/
├── pages/
│   ├── index.vue          # Home page
│   ├── users/
│   │   ├── [id].vue       # User detail page
│   │   └── index.vue      # User list page
│   └── posts/
│       └── $slug.vue      # Post detail page
└── router/
    └── route.gen.ts       # Auto-generated
```

### Generated Type Definitions

```typescript
// route.gen.ts (auto-generated)
export const ROUTE_NAME = {
  INDEX: "index",
  USERS_INDEX: "users-index",
  USERS_ID: "users-[id]",
  POSTS_SLUG: "posts-$slug",
} as const;

export interface RouteParams {
  index: Record<string, never>;
  'users-index': Record<string, never>;
  'users-[id]': {
    id: string;
  };
  'posts-$slug': {
    slug: string;
  };
}

export function useRoute<TName extends RouteName = RouteName>(
  name?: TName
): /* type-enhanced route object */;

export function useRouter(): /* type-enhanced router object */;
```

### Usage in Components

```vue
<script setup lang="ts">
import { useRoute, useRouter, ROUTE_NAME } from '@/router/route.gen';

const route = useRoute();
const router = useRouter();

// Access route parameters (fully type-safe)
if (route.name === ROUTE_NAME.USERS_ID) {
  const userId = route.params.id; // type is string
}

// Navigate to other routes (parameter type protected)
function navigateToUser(userId: string) {
  router.push({
    name: ROUTE_NAME.USERS_ID,
    params: { id: userId } // TypeScript will check parameter types
  });
}
</script>
```

## Advanced Usage

### Getting Parameter Types for Specific Routes

```typescript
import type { RouteParamsByName } from '@/router/route.gen';

type UserDetailParams = RouteParamsByName<'users-[id]'>;
// type is: { id: string }

function fetchUserData(params: UserDetailParams) {
  // params.id is typed as string
  return api.get(`/users/${params.id}`);
}
```

### Layout Nesting

```
src/pages/
├── layout.vue           # Root layout
├── index.vue            # / (uses root layout)
├── admin/
│   ├── layout.vue       # /admin layout
│   ├── index.vue        # /admin (uses admin layout)
│   └── users/
│       └── [id].vue     # /admin/users/:id (uses admin layout)
```

## Best Practices

1. **Always use generated constants**: Use `ROUTE_NAME` instead of hardcoded strings
2. **Leverage type inference**: Let TypeScript check your route parameters
3. **Combine hooks**: `useRoute` and `useRouter` provide complete type safety

## Publishing New Versions (Maintainers)

### Quick Publish

```bash
# Patch version (1.0.0 -> 1.0.1)
pnpm run release:patch

# Minor version (1.0.0 -> 1.1.0)
pnpm run release:minor

# Major version (1.0.0 -> 2.0.0)
pnpm run release:major
```

### Pre-release Versions

```bash
# Pre-release patch (1.0.0 -> 1.0.1-0)
pnpm run release:pre
```

### Manual Publishing Process

```bash
# 1. Update version
npm version patch|minor|major

# 2. Build
pnpm run build

# 3. Publish to npm
npm publish --access public --registry https://registry.npmjs.org/
```

### Publishing Scripts Explanation

- `release:patch` - Auto-update patch version and publish (bug fixes)
- `release:minor` - Auto-update minor version and publish (new features)
- `release:major` - Auto-update major version and publish (breaking changes)
- `release:pre` - Publish pre-release version (alpha/beta/rc)
- `release` - Publish only (without version update)
- `pre-release` - Publish pre-release version (without version update)

These scripts will automatically:
1. Update version in package.json
2. Create git tag
3. Build TypeScript code
4. Publish to npm registry

## License

MIT
