# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **@zphhpzzph/vue-route-gen**, a TypeScript-based npm package that provides file-based routing for Vue 3 with compile-time route metadata extraction. It's designed to be a lightweight alternative to Nuxt's routing system.

## Development Commands

**Package Management**
- Use `pnpm` for all package operations
- Install dependencies: `pnpm i`
- Add dependency: `pnpm add [package]` (use `--save-dev` for dev dependencies)

**Build & Type Check**
- Build: `pnpm run build` (TypeScript compilation to `dist/`)
- Watch mode: `pnpm run dev` (rebuild on file changes)
- Type check: `pnpm run type-check`

**Release**
- Patch version: `pnpm run release:patch` (1.0.0 → 1.0.1)
- Minor version: `pnpm run release:minor` (1.0.0 → 1.1.0)
- Major version: `pnpm run release:major` (1.0.0 → 2.0.0)
- Pre-release: `pnpm run release:pre` (1.0.0 → 1.0.1-0)

**Testing**
- Run CLI on demo app: `cd examples/demo-app && node ../../dist/cli.js`
- Manual route generation test: Create/modify files in `examples/demo-app/src/pages/` and regenerate

## Architecture Overview

**Core Components**

1. **`src/index.ts`** - Main route generation logic
   - Scans file system for `.vue` files
   - Builds route tree structure
   - Handles layout detection and nesting
   - Generates TypeScript code for routes
   - **Literal type inference**: Converts route metadata values to precise TypeScript literal types (e.g., `"admin"` instead of `string`, `true` instead of `boolean`)

2. **`src/extract-meta.ts`** - Route metadata extraction
   - Parses Vue SFC files using `@vue/compiler-sfc`
   - Extracts `<route>` custom blocks at build time
   - Supports JSON and JavaScript object literal syntax
   - Zero runtime overhead - pure build-time extraction

3. **`src/vite.ts`** - Vite plugin for handling `<route>` blocks
   - Removes `<route>` custom blocks from Vue files during dev/build
   - Required in vite.config.ts to avoid parse errors
   - Must be loaded before the vue plugin (`enforce: 'pre'`)

4. **`src/hooks.ts`** - Type utility exports (for advanced use cases)
   - Exports `TypedRoute`, `TypedRouter`, `TypedRouteLocation` types
   - Exports `createTypedUseRoute` and `createTypedUseRouter` factory functions
   - Note: Most users should use the generated `useRoute()`/`useRouter()` from `route.gen.ts` instead

5. **`src/cli.ts`** - CLI entry point
   - Simple wrapper that calls `generateRoutes()`
   - Can be invoked directly or as part of build process

**Key Design Decisions**

- **Build-time parsing**: Route metadata is extracted during route generation, not at runtime
- **SFC Custom Blocks**: Uses Vue's standard custom block feature (`<route>`) instead of components or macros
- **File hash caching**: Caches generated routes based on file hashes to avoid unnecessary rebuilds
- **Type safety**: Generates complete TypeScript definitions with literal type inference for all routes and parameters
- **Framework-agnostic**: Works with any Vue 3 project using Vue Router 4
- **Literal type metadata**: Route meta values are typed as exact literals (e.g., `title: "User Detail"` instead of `title: string`)

**Route Generation Flow**

1. Scan `pagesDir` for `.vue` files (excludes: components, hooks, services, types, constants, utils)
2. Parse each file to extract `<route>` custom block metadata
3. Build route tree structure:
   - Detect layouts (`layout.vue` or `layout/index.vue`)
   - Group pages by their layout hierarchy
   - Generate route names from file paths (kebab-case converted to dashed format)
4. Generate TypeScript output:
   - Route constants (ROUTE_NAME, ROUTE_PATH, ROUTE_PATH_BY_NAME)
   - Route parameter types (RouteParams interface with quoted keys for hyphenated names)
   - Route metadata types (RouteMetaMap interface with literal types extracted from `<route>` blocks)
   - Type-safe useRoute and useRouter hooks
   - Route records array with merged meta (rendered as `as const` for literal type inference)

**Excluded Directories**

The following directories are automatically excluded from route scanning:
- `components/` - UI components
- `hooks/` - Composable functions
- `services/` - API service layers
- `types/` - TypeScript type definitions
- `constants/` - Constants
- `utils/` - Utility functions

**Route Metadata Format**

```vue
<template>
  <div>
    <h1>Page Title</h1>
  </div>
</template>

<script setup lang="ts">
// Normal component logic
</script>

<route>
{
  "title": "页面标题",
  "layout": "admin",
  "requiresAuth": true,
  "roles": ["admin", "moderator"],
  "keepAlive": false
}
</route>
```

**Literal Type Inference**

Route metadata values are automatically converted to literal types:

```typescript
// Generated RouteMetaMap type (literal types)
interface RouteMetaMap {
  'users-[id]': {
    title: "User Detail";      // Literal type, not just string
    layout: "admin";           // Literal type, not just string
    requiresAuth: true;        // Literal type true, not boolean
    roles: ["admin" | "moderator"];  // Union of exact values
    keepAlive: undefined;      // Missing fields are undefined
  };
}
```

This provides compile-time type safety - TypeScript will catch typos or incorrect values.

**Supported Meta Properties**

- `title` (string) - Page title for document title and breadcrumbs
- `layout` (string | false) - Layout component name or false to disable layout
- `keepAlive` (boolean) - Whether to cache the page component
- `requiresAuth` (boolean) - Whether authentication is required
- `roles` (string[]) - Allowed user roles
- `redirect` (string | { name: string }) - Redirect configuration
- `path` (string) - Override the auto-generated route path
- `alias` (string | string[]) - Add route aliases
- `props` (boolean | object) - Enable route props
- `beforeEnter` (function) - Route-specific navigation guard
- Any custom properties (users can extend via module augmentation in their projects)

**Complete Route Configuration Override**

The `<route>` block supports all `RouteRecordRaw` fields, allowing complete customization:

```vue
<route>
{
  "path": "/custom-path",
  "alias": ["/alias1", "/alias2"],
  "redirect": { "name": "home" },
  "props": true,
  "meta": {
    "title": "Custom Page",
    "layout": "admin"
  }
}
</route>
```

User-provided configuration takes precedence over auto-generated defaults.

**Vite Integration Required**

If using `<route>` custom blocks, the Vite plugin is **required** in `vite.config.ts`:

```typescript
import { routeBlockPlugin } from '@zphhpzzph/vue-route-gen/vite';

export default defineConfig({
  plugins: [
    routeBlockPlugin(),  // Must come before vue()
    vue(),
  ],
});
```

The plugin removes `<route>` blocks at build time since they're already extracted by vue-route-gen.

**Type Safety Patterns**

1. **Route Parameter Types**: Use quoted keys for hyphenated route names
   ```typescript
   export interface RouteParams {
     'users-[id]': {
       id: string;
     };
   }
   ```

2. **Custom Meta Properties**: Extend route meta types in user projects
   ```typescript
   // In user project's global types file (e.g., src/types/vue-router.d.ts)
   declare module 'vue-router' {
     interface RouteMeta {
       icon?: string;
       hidden?: boolean;
       order?: number;
     }
   }
   ```

**Package Structure**

```
packages/vue-route-gen/
├── src/
│   ├── index.ts          # Main route generation logic
│   ├── cli.ts           # CLI entry point
│   ├── extract-meta.ts  # Route metadata extraction
│   ├── hooks.ts         # Type utilities (advanced use)
│   └── vite.ts          # Vite plugin for <route> blocks
├── dist/                # Built output (generated by tsc)
├── examples/
│   └── demo-app/        # Example application for testing
└── package.json         # Package configuration
```

**Dependencies**

- `@vue/compiler-sfc` - Parse Vue SFC files and extract custom blocks
- `vue-router` (peer dependency) ^4.0.0
- TypeScript ^5.3.3
- Node.js >=18.0.0

**Package Exports**

- `.` - Main entry point (`generateRoutes` function, type utilities)
- `./vite` - Vite plugin (`routeBlockPlugin`)

**Development Workflow**

1. Make changes to `src/*.ts`
2. Run `pnpm run build` to compile
3. Test with demo app:
   ```bash
   cd examples/demo-app
   # Create/modify pages with <route> blocks
   node ../../dist/cli.js
   # Check generated src/router/route.gen.ts
   ```
4. If making breaking changes, update version in `package.json`
5. Run appropriate release script

**Common Tasks**

- **Add new meta property handling**: No changes needed - all properties are automatically extracted and typed as literals
- **Change route generation logic**: Modify `src/index.ts`
- **Fix parsing issues**: Update `src/extract-meta.ts`
- **Update CLI**: Modify `src/cli.ts`
- **Test metadata extraction**: Create test files in `examples/demo-app/src/pages/` with `<route>` blocks
- **Test literal type inference**: Check `RouteMetaMap` type in generated `route.gen.ts`

**Important Notes**

- Always quote keys in `RouteParams` interface for hyphenated route names (e.g., `'users-[id]'`)
- Route names use kebab-case converted from file paths (e.g., `users/[id].vue` → `users-[id]`)
- The `<route>` custom block is parsed at build-time only, not at runtime
- Generated routes use hash-based caching to avoid unnecessary rebuilds
- Cache file location: `node_modules/.cache/route-gen.json`
- Vite plugin is **required** when using `<route>` blocks to avoid parse errors
- Literal type inference means metadata values are exact types (e.g., `"admin"` not `string`)
