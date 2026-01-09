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

2. **`src/extract-meta.ts`** - Route metadata extraction
   - Parses Vue SFC files using `@vue/compiler-sfc`
   - Extracts `<route>` custom blocks at build time
   - Supports JSON and JavaScript object literal syntax
   - Zero runtime overhead - pure build-time extraction

3. **`src/runtime/`** - Runtime type definitions
   - Provides TypeScript types for route metadata
   - Allows users to extend `RouteMeta` interface via module augmentation
   - No runtime components or macros needed

4. **`src/cli.ts`** - CLI entry point
   - Simple wrapper that calls `generateRoutes()`
   - Can be invoked directly or as part of build process

**Key Design Decisions**

- **Build-time parsing**: Route metadata is extracted during route generation, not at runtime
- **SFC Custom Blocks**: Uses Vue's standard custom block feature (`<route>`) instead of components or macros
- **File hash caching**: Caches generated routes based on file hashes to avoid unnecessary rebuilds
- **Type safety**: Generates complete TypeScript definitions for all routes and parameters
- **Framework-agnostic**: Works with any Vue 3 project using Vue Router 4

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
   - Type-safe useRoute and useRouter hooks
   - Route records array with merged meta

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

**Supported Meta Properties**

- `title` (string) - Page title for document title and breadcrumbs
- `layout` (string | false) - Layout component name or false to disable layout
- `keepAlive` (boolean) - Whether to cache the page component
- `requiresAuth` (boolean) - Whether authentication is required
- `roles` (string[]) - Allowed user roles
- `redirect` (string | { name: string }) - Redirect configuration
- Any custom properties (via TypeScript module augmentation)

**Type Safety Patterns**

1. **Route Parameter Types**: Use quoted keys for hyphenated route names
   ```typescript
   export interface RouteParams {
     'users-[id]': {
       id: string;
     };
   }
   ```

2. **Module Augmentation**: Extend RouteMeta for custom properties
   ```typescript
   declare module '@zphhpzzph/vue-route-gen/runtime' {
     interface RouteMeta {
       icon?: string;
       hidden?: boolean;
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
│   ├── hooks.ts         # Type-safe router hooks (not currently used)
│   └── runtime/
│       ├── index.ts     # Runtime type definitions
│       └── types.ts     # RouteMeta interface
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

- **Add new meta property**: Update `RouteMeta` interface in `src/runtime/types.ts`
- **Change route generation logic**: Modify `src/index.ts`
- **Fix parsing issues**: Update `src/extract-meta.ts`
- **Update CLI**: Modify `src/cli.ts`
- **Test metadata extraction**: Create test files in `examples/demo-app/src/pages/` with `<route>` blocks

**Important Notes**

- Always quote keys in `RouteParams` interface for hyphenated route names (e.g., `'users-[id]'`)
- Route names use kebab-case converted from file paths (e.g., `users/[id].vue` → `users-[id]`)
- The `<route>` custom block is parsed at build-time only, not at runtime
- Generated routes use hash-based caching to avoid unnecessary rebuilds
- Cache file location: `node_modules/.cache/route-gen.json`
