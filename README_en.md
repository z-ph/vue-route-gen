# @zphhpzzph/vue-route-gen

> English | [简体中文](./README.md)

Vue 3 file-based route generator for Vue Router with complete type inference support. A lightweight alternative to Nuxt's routing system.

## ✨ Features

- 📁 **Automatic Route Generation** - Auto-generate routes based on `pages/` directory structure
- 🔒 **Type Safety** - Full TypeScript type checking for route navigation and parameter access
- 🎨 **Complete Route Configuration** - Support all Vue Router config (`<route>` block or `defineRoute()` macro)
- 📦 **Ready to Use** - Get configured in 5 minutes

## 📦 Quick Start

### 1. Install

```bash
pnpm install @zphhpzzph/vue-route-gen
```

### 2. Configure Vite

Add plugins in `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { routeBlockPlugin, routeGenPlugin } from '@zphhpzzph/vue-route-gen/vite';

export default defineConfig({
  plugins: [
    routeBlockPlugin(),  // Handle <route> custom blocks
    routeGenPlugin(),    // Auto-generate routes
    vue(),
  ],
});
```

### 3. Create Page Files

Create `.vue` files in `src/pages/` directory:

```
src/pages/
├── index.vue          # Home → /
├── about.vue          # About → /about
└── users/
    ├── index.vue      # User list → /users
    └── [id].vue       # User detail → /users/:id
```

### 4. Configure Router

Use generated routes in `src/router/index.ts`:

```typescript
import { createRouter } from 'vue-router';
import { routes } from './route.gen';

export const router = createRouter({
  routes,
  // ... other config
});
```

**That's it!** Routes are automatically generated and kept up-to-date.

## 🚀 Common Usage

### Route Navigation (Type-Safe)

```vue
<script setup lang="ts">
import { useRouter, ROUTE_NAME } from '@/router/route.gen';

const router = useRouter();

// Navigate to user detail page
function goToUser(userId: string) {
  router.push({
    name: ROUTE_NAME.USERS_ID,
    params: { id: userId } // ✅ TypeScript checks parameters
  });
}
</script>
```

### Access Route Parameters (Type-Safe)

```vue
<script setup lang="ts">
import { useRoute } from '@/router/route.gen';

const route = useRoute();

// When on user detail page
if (route.name === ROUTE_NAME.USERS_ID) {
  console.log(route.params.id); // ✅ type is string
}
</script>
```

### Define Route Configuration

Add `<route>` custom block in your component, supports complete route configuration:

```vue
<template>
  <div><h1>User List</h1></div>
</template>

<route>
{
  "meta": {
    "title": "User List",
    "layout": "admin",
    "requiresAuth": true,
    "roles": ["admin"]
  }
}
</route>
```

Or use `defineRoute()` macro:

```vue
<script setup lang="ts">
defineRoute({
  meta: {
    title: 'User List',
    layout: 'admin',
    requiresAuth: true,
    roles: ['admin']
  }
});
</script>
```

**Note**: You can customize path, alias, and all Vue Router config options. See [Route Configuration Guide](./docs/RouteConfig.md) for details.

### Use Metadata in Route Guards

```typescript
// router/guards.ts
router.beforeEach((to, from, next) => {
  // Set page title
  if (to.meta.title) {
    document.title = to.meta.title;
  }

  // Check authentication
  if (to.meta.requiresAuth && !isAuthenticated()) {
    return next({ name: 'login' });
  }

  next();
});
```

## 📁 Directory Structure Convention

```
src/pages/
├── layout.vue              # Root layout
├── index.vue               # Home page (/)
├── about.vue               # About page (/about)
├── users/
│   ├── layout.vue          # User layout (nested)
│   ├── index.vue           # User list (/users)
│   └── [id].vue            # User detail (/users/:id)
└── $slug.vue               # Catch-all route (/:slug)
```

**Auto-excluded directories**: `components/`, `hooks/`, `services/`, `types/`, `constants/`, `utils/`

## ⚙️ Configuration

### Vite Plugin Configuration

Customize pages directory or output file path:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    routeBlockPlugin(),
    routeGenPlugin({
      pagesDir: './src/pages',           // Optional, default 'src/pages'
      outFile: './src/router/route.gen.ts',  // Optional, default 'src/router/route.gen.ts'
    }),
    vue(),
  ],
});
```

### Custom Route Metadata Types

Extend route metadata types in your project:

```typescript
// src/types/router.d.ts
declare module '@zphhpzzph/vue-route-gen/runtime' {
  interface RouteMeta {
    icon?: string;        // Menu icon
    hidden?: boolean;     // Whether to hide
    order?: number;       // Sort order
  }
}
```

Then use in `<route>` block:

```vue
<route>
{
  "title": "Dashboard",
  "icon": "Dashboard",
  "hidden": false,
  "order": 1
}
</route>
```

### Supported Route Configuration

Supports all Vue Router config options and custom metadata:

| Option | Type | Description |
|--------|------|-------------|
| `path` | `string` | Custom route path |
| `name` | `string` | Custom route name |
| `alias` | `string \| string[]` | Route aliases |
| `redirect` | `string \| object` | Redirect configuration |
| `props` | `boolean \| object` | Route parameter passing |
| `meta` | `object` | Route metadata (see below) |

**Common meta properties**:

| Property | Type | Description |
|----------|------|-------------|
| `title` | `string` | Page title |
| `layout` | `string \| false` | Layout component or `false` to disable |
| `keepAlive` | `boolean` | Whether to cache the page |
| `requiresAuth` | `boolean` | Whether authentication is required |
| `roles` | `string[]` | Allowed roles |
| `icon` | `string` | Menu icon |
| `hidden` | `boolean` | Whether to hide menu |
| `*` | `any` | Supports any custom property |

For complete configuration examples, see [Route Configuration Guide](./docs/RouteConfig.md).

## 📖 Practical Examples

### Example 1: Create Nested Routes

```
src/pages/
├── layout.vue              # Root layout
├── index.vue               # → /
├── admin/
│   ├── layout.vue          # Admin layout
│   ├── index.vue           # → /admin
│   └── users/
│       ├── index.vue       # → /admin/users
│       └── [id].vue        # → /admin/users/:id
```

### Example 2: Dynamic Route Parameters

Both syntaxes are supported:

```
# Method 1: Vue Router style
users/[id].vue          # → /users/:id

# Method 2: Nuxt style
posts/$slug.vue         # → /posts/:slug
```

### Example 3: Complete Page Example

```vue
<!-- src/pages/users/[id].vue -->
<template>
  <div>
    <h1>User Detail</h1>
    <p>User ID: {{ userId }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from '@/router/route.gen';

const route = useRoute('users-[id]');
const userId = computed(() => route.params.id);
</script>

<route>
{
  "path": "/users/:id",
  "props": true,
  "meta": {
    "title": "User Detail",
    "layout": "admin",
    "requiresAuth": true,
    "roles": ["admin", "moderator"]
  }
}
</route>
```

## 🔍 What Gets Generated

`vue-route-gen` generates a `route.gen.ts` file containing:

- **`routes`** - Vue Router route configuration array
- **`ROUTE_NAME`** - Route name constants (avoid hardcoded strings)
- **`useRoute()`** - Type-enhanced route hook
- **`useRouter()`** - Type-enhanced router navigation hook

**Usually, you only need these exports. No need to worry about implementation details.**

## ❓ FAQ

### Q: How to manually trigger route generation?

A: Run the CLI command:
```bash
pnpm exec vue-route-gen
```

### Q: How to exclude certain directories from route generation?

A: These directories are automatically excluded: `components/`, `hooks/`, `services/`, `types/`, `constants/`, `utils/`

### Q: Do routes update automatically during development?

A: With `routeGenPlugin()`, routes are automatically regenerated when files change.

## 📚 Further Reading

- **[Documentation Index](./docs/README.md)** - Complete documentation navigation
- **[Changelog](./CHANGELOG.md)** - Version updates and migration guide
- **[Route Configuration Guide](./docs/RouteConfig.md)** - Complete usage of `<route>` block and `defineRoute()`
- **[Vite Plugin Details](./docs/VitePlugin.md)** - How the plugin works

## 📄 License

MIT
