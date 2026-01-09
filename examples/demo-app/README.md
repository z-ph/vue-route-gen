# @zphhpzzph/vue-route-gen

> [English](./README.md) | 简体中文

Vue 3 基于文件系统的路由生成器，支持从 `<route>` 自定义块提取路由元数据，为 Vue Router 提供完整的类型推断支持。

## 特性

- 从文件结构自动发现路由
- 支持布局文件 (`layout.vue` 或 `layout/index.vue`)
- 动态路由参数 (`$param` 或 `[param]`)
- **从 `<route>` 自定义块提取路由元数据** ✨
  - 在编译时解析，零运行时开销
  - 使用 Vue SFC 自定义块语法
  - 自动将 meta 合并到生成的路由配置中
- 缓存机制，快速重建
- TypeScript 支持并生成完整类型
- **类型安全的路由 Hooks**（`useRoute` 和 `useRouter` 提供完整类型推断）
- **自动从动态路由提取参数类型**

## 路由元数据功能

### 使用 `<route>` 自定义块

在 Vue 单文件组件（SFC）中使用 `<route>` 自定义块定义路由元数据：

```vue
<template>
  <div>
    <h1>用户列表</h1>
  </div>
</template>

<script setup lang="ts">
// 正常的脚本逻辑
</script>

<!-- 独立的 route 块，用于定义路由元数据 -->
<route>
{
  "title": "用户列表",
  "layout": "admin",
  "requiresAuth": true,
  "roles": ["admin", "moderator"],
  "keepAlive": true
}
</route>
```

### 使用 JavaScript 对象语法

您也可以使用 JavaScript 对象字面量（不需要引号）：

```vue
<route>
{
  title: "用户详情",
  layout: "admin",
  requiresAuth: true,
  roles: ["admin"]
}
</route>
```

### 支持的 Meta 属性

以下属性可以被提取并合并到路由配置中：

| 属性 | 类型 | 描述 |
|------|------|------|
| `title` | `string` | 页面标题 |
| `layout` | `string \| false` | 布局组件名称，`false` 表示禁用布局 |
| `keepAlive` | `boolean` | 是否缓存页面组件 |
| `requiresAuth` | `boolean` | 是否需要认证 |
| `roles` | `string[]` | 允许访问的角色列表 |
| `redirect` | `string \| { name: string }` | 重定向配置 |
| `*` | `any` | 支持任意自定义属性 |

## 安装

```bash
npm install @zphhpzzph/vue-route-gen
# 或
pnpm install @zphhpzzph/vue-route-gen
# 或
yarn add @zphhpzzph/vue-route-gen
```

## 使用方法

### CLI

```bash
vue-route-gen
```

### 编程方式

```typescript
import { generateRoutes } from '@zphhpzzph/vue-route-gen';

// 使用默认选项生成路由
generateRoutes();

// 或指定自定义目录
generateRoutes({
  pagesDir: './src/pages',
  outFile: './src/router/route.gen.ts'
});
```

### 在 Vite 项目中自动生成

在 `vite.config.ts` 中配置：

```typescript
import { defineConfig } from 'vite';
import vueRouteGen from '@zphhpzzph/vue-route-gen/vite';

export default defineConfig({
  plugins: [
    vueRouteGen()
  ]
});
```

## 完整示例

### 项目结构

```
src/
├── pages/
│   ├── index.vue              # 首页 (/)
│   ├── about.vue              # 关于页面 (/about)
│   ├── users/
│   │   ├── index.vue          # 用户列表 (/users)
│   │   └── [id].vue           # 用户详情 (/users/:id)
│   └── admin/
│       ├── layout.vue         # 管理后台布局
│       └── dashboard.vue      # 仪表盘 (/admin)
└── router/
    └── route.gen.ts           # 自动生成
```

### 页面组件示例

#### 首页 (index.vue)

```vue
<template>
  <div>
    <h1>欢迎来到首页</h1>
  </div>
</template>

<script setup lang="ts">
// 正常的脚本逻辑
const count = ref(0);
</script>

<route>
{
  "title": "首页",
  "layout": "default",
  "keepAlive": true
}
</route>
```

#### 用户详情页 (users/[id].vue)

```vue
<template>
  <div>
    <h1>用户详情</h1>
    <p>用户 ID: {{ $route.params.id }}</p>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
const userId = computed(() => route.params.id);
</script>

<route>
{
  "title": "用户详情",
  "layout": "admin",
  "requiresAuth": true,
  "roles": ["admin", "moderator"]
}
</route>
```

### 生成的路由配置

运行 `vue-route-gen` 后，会生成 `src/router/route.gen.ts`：

```typescript
export const routes = [
  {
    path: "/",
    name: "index",
    component: () => import("../pages/index.vue"),
    meta: {
      title: "首页",
      layout: "default",
      keepAlive: true
    },
    children: []
  },
  {
    path: "/users/:id",
    name: "users-[id]",
    component: () => import("../pages/users/[id].vue"),
    meta: {
      title: "用户详情",
      layout: "admin",
      requiresAuth: true,
      roles: ["admin", "moderator"]
    },
    children: []
  }
] satisfies RouteRecordRaw[];
```

### 在路由守卫中使用 Meta

```typescript
import { createRouter } from 'vue-router';
import routes from './router/route.gen';

const router = createRouter({
  routes,
});

// 认证守卫
router.beforeEach((to, from, next) => {
  const meta = to.meta;

  // 检查是否需要认证
  if (meta.requiresAuth) {
    if (!isAuthenticated()) {
      return next({ name: 'login' });
    }
  }

  // 检查角色权限
  if (meta.roles && meta.roles.length > 0) {
    const userRole = getCurrentUserRole();
    if (!meta.roles.includes(userRole)) {
      return next({ name: 'forbidden' });
    }
  }

  // 设置页面标题
  if (meta.title) {
    document.title = meta.title;
  }

  next();
});
```

### 类型安全的路由访问

生成的 `useRoute` 和 `useRouter` hooks 提供完整的类型推断：

```typescript
import { useRoute, useRouter, ROUTE_NAME } from '@/router/route.gen';

const route = useRoute<'users-[id]'>();
const router = useRouter();

// route.params.id 的类型为 string
if (route.name === ROUTE_NAME.USERS_ID) {
  const userId = route.params.id; // 完整类型支持！
}

// 类型安全的导航
router.push({
  name: ROUTE_NAME.USERS_ID,
  params: { id: '123' } // TypeScript 会验证参数类型
});
```

## 最佳实践

1. **使用 JSON 格式**
   - 在 `<route>` 块中使用标准 JSON 格式更安全
   - 工具可以提供更好的格式化和验证

2. **利用类型推断**
   - 通过模块扩展自定义 meta 属性类型
   - 让 TypeScript 为您检查路由元数据

3. **始终使用生成的常量**
   - 使用 `ROUTE_NAME` 而不是硬编码字符串
   - 让 TypeScript 为你检查路由参数

## 扩展 Meta 类型

要添加自定义的 meta 属性类型，可以在项目中创建类型声明文件：

```typescript
// types/router.d.ts
import type { RouteMeta } from '@zphhpzzph/vue-route-gen/runtime';

declare module '@zphhpzzph/vue-route-gen/runtime' {
  interface RouteMeta {
    pageType?: 'landing' | 'dashboard' | 'settings';
    icon?: string;
    hidden?: boolean;
  }
}
```

然后就可以在 `<route>` 块中使用这些自定义属性：

```vue
<route>
{
  "pageType": "dashboard",
  "icon": "dashboard",
  "hidden": false
}
</route>
```

## 与 Nuxt 的对比

| 特性 | Nuxt 3 | @zphhpzzph/vue-route-gen |
|------|--------|-------------------------|
| 元数据定义 | `<route>` 自定义块 + `definePageMeta` 宏 | `<route>` 自定义块 |
| 解析时机 | 编译时 | 编译时 |
| 运行时开销 | 无 | 无 |
| 类型支持 | 完整 | 完整 |
| 文件路由 | ✅ | ✅ |
| 动态路由 | ✅ | ✅ |
| 嵌套布局 | ✅ | ✅ |

## License

MIT
