# @zphhpzzph/vue-route-gen

> [English](./README_en.md) | 简体中文

Vue 3 基于文件系统的路由生成器，为 Vue Router 提供完整的类型推断支持。

## 特性

- 从文件结构自动发现路由
- 支持布局文件 (`layout.vue` 或 `layout/index.vue`)
- 动态路由参数 (`$param` 或 `[param]`)
- 缓存机制，快速重建
- TypeScript 支持并生成完整类型
- **类型安全的路由 Hooks**（`useRoute` 和 `useRouter` 提供完整类型推断）
- **自动从动态路由提取参数类型**
- **`<route>` 自定义块支持** - 在 SFC 中定义路由元数据，零运行时开销
- **精确的字面量类型推断** - 为路由元数据提供编译时类型安全，详见 [字面量类型推断文档](./docs/LiteralTypes.md)

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

## 文件结构

```
src/pages/
├── layout.vue              # 根布局
├── index.vue               # 首页 (/)
├── about.vue               # 关于页面 (/about)
├── users/
│   ├── layout.vue          # 用户布局 (/users)
│   ├── index.vue           # 用户列表 (/users)
│   └── [id].vue            # 用户详情 (/users/:id)
└── $slug.vue               # 通配路由 (/:slug)
```

## 配置选项

### Vite 配置

如果使用 `<route>` 自定义块定义路由元数据，需要在 `vite.config.ts` 中添加插件：

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { routeBlockPlugin } from '@zphhpzzph/vue-route-gen/vite';

export default defineConfig({
  plugins: [
    routeBlockPlugin(),  // 处理 <route> 自定义块
    vue(),
  ],
});
```

**注意**：`routeBlockPlugin` 会移除 `<route>` 自定义块，因为这些块已经在构建时被 `vue-route-gen` 提取并合并到路由配置中，不需要在运行时处理。

### 生成器选项

- `pagesDir`: 页面目录路径（默认：`src/pages`）
- `outFile`: 输出文件路径（默认：`src/router/route.gen.ts`）

### 自动排除的目录

以下目录会被自动排除：
- `components`
- `hooks`
- `services`
- `types`
- `constants`
- `utils`

## 生成内容

生成器会创建：

1. `ROUTE_NAME` - 路由名称常量
2. `ROUTE_PATH` - 路由路径常量
3. `ROUTE_PATH_BY_NAME` - 按名称查找路径
4. `RouteParams` - 每个路由的参数类型接口
5. `RouteParamsByName<T>` - 根据路由名称获取参数类型的工具类型
6. `RouteMetaMap` - 每个路由的元数据类型接口（从 `<route>` 块提取）
7. `RouteMetaByName<T>` - 根据路由名称获取元数据类型的工具类型
8. `routes` - Vue Router 路由记录数组
9. `useRoute()` - 类型安全的路由访问 Hook，提供参数和元数据类型推断
10. `useRouter()` - 类型安全的路由导航 Hook，提供参数验证

## 使用 `<route>` 自定义块

`@zphhpzzph/vue-route-gen` 支持在 Vue SFC 文件中使用 `<route>` 自定义块来定义路由元数据。这些元数据会在**构建时**被提取并合并到生成的路由配置中，**零运行时开销**。

### 基础用法

在 Vue 组件中添加 `<route>` 自定义块：

```vue
<template>
  <div>
    <h1>用户列表</h1>
  </div>
</template>

<script setup lang="ts">
// 组件逻辑
</script>

<route>
{
  "title": "用户列表",
  "layout": "admin",
  "requiresAuth": true,
  "roles": ["admin", "moderator"]
}
</route>
```

### 支持的元数据属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `title` | `string` | 页面标题，用于 document.title 和面包屑 |
| `layout` | `string \| false` | 布局组件名称，或 `false` 禁用布局 |
| `keepAlive` | `boolean` | 是否缓存页面组件 |
| `requiresAuth` | `boolean` | 是否需要认证 |
| `roles` | `string[]` | 允许访问的用户角色 |
| `redirect` | `string \| { name: string }` | 重定向配置 |
| `icon` | `string` | 菜单图标（自定义属性） |
| `hidden` | `boolean` | 是否隐藏菜单（自定义属性） |
| `*` | `any` | 支持任何自定义属性 |

### JSON 和 JavaScript 对象语法

`<route>` 块支持两种语法：

#### 1. JSON 语法（推荐）

```vue
<route>
{
  "title": "用户详情",
  "layout": "admin",
  "requiresAuth": true,
  "roles": ["admin"]
}
</route>
```

#### 2. JavaScript 对象语法

```vue
<route>
{
  title: '用户详情',
  layout: 'admin',
  requiresAuth: true,
  roles: ['admin', 'moderator']
}
</route>
```

### 完整示例

#### 用户列表页面

```vue
<!-- src/pages/users/index.vue -->
<template>
  <div class="users-page">
    <h1>用户列表</h1>
    <UserList />
  </div>
</template>

<script setup lang="ts">
import UserList from './components/UserList.vue';
</script>

<route>
{
  "title": "用户列表",
  "layout": "admin",
  "requiresAuth": true,
  "roles": ["admin"],
  "icon": "User",
  "keepAlive": true
}
</route>
```

#### 用户详情页面

```vue
<!-- src/pages/users/[id].vue -->
<template>
  <div class="user-detail">
    <h1>用户详情</h1>
    <UserInfo :user-id="userId" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from '@/router/route.gen';
import UserInfo from './components/UserInfo.vue';

const route = useRoute<'users-[id]>();
const userId = computed(() => route.params.id);
</script>

<route>
{
  "title": "用户详情",
  "layout": "admin",
  "requiresAuth": true,
  "roles": ["admin", "moderator"],
  "icon": "UserProfile"
}
</route>
```

#### 公开页面（无需认证）

```vue
<!-- src/pages/about.vue -->
<template>
  <div class="about-page">
    <h1>关于我们</h1>
    <p>这是关于页面</p>
  </div>
</template>

<script setup lang="ts">
// 组件逻辑
</script>

<route>
{
  "title": "关于我们",
  "layout": "default",
  "requiresAuth": false,
  "keepAlive": false
}
</route>
```

### 自定义元数据属性

你可以在 `<route>` 块中添加任何自定义属性，并通过 TypeScript 模块扩展来获得类型支持：

```typescript
// types/route-meta.d.ts
declare module '@zphhpzzph/vue-route-gen/runtime' {
  interface RouteMeta {
    icon?: string;
    hidden?: boolean;
    order?: number;
    badge?: string | number;
  }
}
```

然后在组件中使用：

```vue
<route>
{
  "title": "仪表盘",
  "icon": "Dashboard",
  "hidden": false,
  "order": 1,
  "badge": "New"
}
</route>
```

### 构建时提取

路由元数据在构建时被提取，零运行时开销：

```typescript
// 生成的 route.gen.ts
export const routes = [
  {
    path: "/users/:id",
    name: "users-[id]",
    component: () => import("../pages/users/[id].vue"),
    meta: {
      title: "用户详情",
      layout: "admin",
      requiresAuth: true,
      roles: ["admin", "moderator"],
      icon: "UserProfile"
    },
    children: [],
  }
] satisfies RouteRecordRaw[];
```

### 在路由守卫中使用元数据

```typescript
// router/guards.ts
import { router } from './router';

router.beforeEach((to, from, next) => {
  const meta = to.meta;

  // 检查认证
  if (meta.requiresAuth && !isAuthenticated()) {
    return next({ name: 'login' });
  }

  // 检查角色权限
  if (meta.roles && !hasRole(meta.roles)) {
    return next({ name: 'forbidden' });
  }

  // 设置页面标题
  if (meta.title) {
    document.title = `${meta.title} - My App`;
  }

  next();
});
```

### 与导航菜单结合

```vue
<!-- components/Sidebar.vue -->
<script setup lang="ts">
import { routes } from '@/router/route.gen';

const menuItems = routes
  .filter(route => route.meta && !route.meta.hidden)
  .map(route => ({
    title: route.meta?.title,
    icon: route.meta?.icon,
    path: route.path,
    order: route.meta?.order ?? 999,
  }))
  .sort((a, b) => a.order - b.order);
</script>

<template>
  <nav>
    <router-link
      v-for="item in menuItems"
      :key="item.path"
      :to="item.path"
    >
      <Icon :name="item.icon" />
      {{ item.title }}
    </router-link>
  </nav>
</template>
```

### 类型安全扩展

通过 TypeScript 模块扩展，让你的自定义元数据属性类型安全：

```typescript
// types/route-meta.d.ts
import '@zphhpzzph/vue-route-gen/runtime';

declare module '@zphhpzzph/vue-route-gen/runtime' {
  interface RouteMeta {
    // 页面权限
    permissions?: string[];
    // 页面描述
    description?: string;
    // SEO 关键词
    keywords?: string[];
    // 是否在标签页中打开
    openInTab?: boolean;
    // 自定义中间件
    middleware?: string[];
  }
}
```

## 类型安全的路由

### 自动生成的参数类型

对于 `/users/[id].vue` 这样的路由，生成器会自动提取 `id` 参数：

```typescript
// 在 route.gen.ts 中生成
export interface RouteParams {
  'users-[id]': {
    id: string;
  };
  // ... 其他路由
}
```

### 使用 useRoute

生成的 `useRoute` Hook 为路由参数和元数据提供完整的类型推断：

```typescript
import { useRoute, ROUTE_NAME } from '@/router/route.gen';

const route = useRoute();

// 类型安全的参数访问
if (route.name === ROUTE_NAME.USERS_ID) {
  console.log(route.params.id); // 类型为 string ✅

  // 类型安全的元数据访问
  console.log(route.meta.title);        // 类型为 string ✅
  console.log(route.meta.layout);      // 类型为 string ✅
  console.log(route.meta.requiresAuth); // 类型为 boolean ✅
  console.log(route.meta.roles);       // 类型为 string[] ✅

  // ❌ TypeScript 报错：属性不存在
  // console.log(route.meta.wrongProp);
}
```

**Meta 类型自动推导**：
- 从 `<route>` 块中提取的元数据会自动生成对应的 TypeScript 类型
- 不同路由有不同的 meta 类型
- 访问不存在的 meta 属性时 TypeScript 会报错

**获取特定路由的 Meta 类型**：

```typescript
import type { RouteMetaByName } from '@/router/route.gen';

// 获取特定路由的 meta 类型
type UsersIdMeta = RouteMetaByName<typeof ROUTE_NAME.USERS_ID>;
// 类型为：
// {
//   title: string;
//   layout: string;
//   requiresAuth: true;
//   roles: string[];
// } & RouteMeta
```

### 使用 useRouter

生成的 `useRouter` Hook 提供类型安全的导航：

```typescript
import { useRouter, ROUTE_NAME } from '@/router/route.gen';

const router = useRouter();

// 类型安全的导航 - TypeScript 会验证参数
router.push({
  name: ROUTE_NAME.USERS_ID,
  params: { id: '123' } // 必需的参数会被检查
});

// 错误：类型 '{ id: string; }' 不能赋值给类型 'Record<string, never>'
router.push({
  name: ROUTE_NAME.HOME, // HOME 路由没有参数
  params: { id: '123' } // TypeScript 报错！
});
```

## 完整示例

### 项目结构

```
src/
├── pages/
│   ├── index.vue          # 首页
│   ├── users/
│   │   ├── [id].vue       # 用户详情页
│   │   └── index.vue      # 用户列表页
│   └── posts/
│       └── $slug.vue      # 文章详情页
└── router/
    └── route.gen.ts       # 自动生成
```

### 生成的类型定义

```typescript
// route.gen.ts (自动生成)
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
): /* 类型增强的路由对象 */;

export function useRouter(): /* 类型增强的路由对象 */;
```

### 在组件中使用

```vue
<script setup lang="ts">
import { useRoute, useRouter, ROUTE_NAME } from '@/router/route.gen';

const route = useRoute();
const router = useRouter();

// 访问路由参数（完全类型安全）
if (route.name === ROUTE_NAME.USERS_ID) {
  const userId = route.params.id; // 类型为 string
}

// 导航到其他路由（参数类型受保护）
function navigateToUser(userId: string) {
  router.push({
    name: ROUTE_NAME.USERS_ID,
    params: { id: userId } // TypeScript 会检查参数类型
  });
}
</script>
```

## 高级用法

### 类型工具（从 `@zphhpzzph/vue-route-gen` 导入）

包中提供了一些高级类型工具用于自定义类型安全的路由 hooks：

```typescript
import {
  createTypedUseRoute,
  createTypedUseRouter,
  type TypedRoute,
  type TypedRouter,
  type TypedRouteLocation,
} from '@zphhpzzph/vue-route-gen';
```

#### 创建自定义类型安全的 useRoute Hook

如果需要为特定路由创建类型更精确的 hook：

```typescript
import { createTypedUseRoute } from '@zphhpzzph/vue-route-gen';

// 创建针对特定路由的 hook
const useUserDetailRoute = createTypedUseRoute<'users-[id]', { id: string }>();

// 在组件中使用
const route = useUserDetailRoute();
console.log(route.params.id); // 类型为 string
```

#### 创建类型安全的 Router

```typescript
import { createTypedUseRouter } from '@zphhpzzph/vue-route-gen';

const useRouter = createTypedUseRouter();
const router = useRouter();

// 导航时提供类型检查
router.push({
  name: 'users-[id]',
  params: { id: '123' },
});
```

**注意**：大多数情况下，你应该使用生成的 `useRoute()` 和 `useRouter()` hooks（从 `route.gen.ts` 导入），它们已经提供了完整的类型安全。这些底层类型工具主要用于高级自定义场景。

> 💡 **深入阅读**：关于 `<route>` 自定义块的完整使用指南，请参阅 [`<route> 自定义块完整指南`](./docs/RouteBlocks.md)

### 获取特定路由的参数类型

```typescript
import type { RouteParamsByName } from '@/router/route.gen';

type UserDetailParams = RouteParamsByName<'users-[id]'>;
// 类型为：{ id: string }

function fetchUserData(params: UserDetailParams) {
  // params.id 的类型为 string
  return api.get(`/users/${params.id}`);
}
```

### 布局嵌套

```
src/pages/
├── layout.vue           # 根布局
├── index.vue            # / (使用根布局)
├── admin/
│   ├── layout.vue       # /admin 布局
│   ├── index.vue        # /admin (使用 admin 布局)
│   └── users/
│       └── [id].vue     # /admin/users/:id (使用 admin 布局)
```

## 最佳实践

1. **始终使用生成的常量**：使用 `ROUTE_NAME` 而不是硬编码字符串
2. **利用类型推断**：让 TypeScript 为你检查路由参数
3. **组合使用 Hooks**：`useRoute` 和 `useRouter` 提供完整的类型安全
4. **使用 `<route>` 块定义元数据**：在组件中直接定义路由元数据，便于维护

## 📚 文档

查看完整文档：
- **[文档索引](./docs/README.md)** - 所有文档���导航目录
- **[更新日志](./CHANGELOG.md)** - 版本更新记录和迁移指南
- **[路由元数据字面量类型推断](./docs/LiteralTypes.md)** - 精确的类型推断系统详解
- **[<route> 自定义块指南](./docs/RouteBlocks.md)** - 在 SFC 中定义路由元数据

## 发布新版本（维护者）

### 快速发布

```bash
# 补丁版本 (1.0.0 -> 1.0.1)
pnpm run release:patch

# 次要版本 (1.0.0 -> 1.1.0)
pnpm run release:minor

# 主要版本 (1.0.0 -> 2.0.0)
pnpm run release:major
```

### 预发布版本

```bash
# 预发布补丁 (1.0.0 -> 1.0.1-0)
pnpm run release:pre
```

### 手动发布流程

```bash
# 1. 更新版本号
npm version patch|minor|major

# 2. 构建
pnpm run build

# 3. 发布到 npm
npm publish --access public --registry https://registry.npmjs.org/
```

### 发布脚本说明

- `release:patch` - 自动更新补丁版本并发布（bug 修复）
- `release:minor` - 自动更新次要版本并发布（新功能）
- `release:major` - 自动更新主要版本并发布（破坏性变更）
- `release:pre` - 发布预发布版本（alpha/beta/rc）
- `release` - 仅发布（不更新版本号）
- `pre-release` - 发布预发布版本（不更新版本号）

这些脚本会自动：
1. 更新 package.json 中的版本号
2. 创建 git tag
3. 构建 TypeScript 代码
4. 发布到 npm registry

## License

MIT
