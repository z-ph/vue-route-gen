# @zphhpzzph/vue-route-gen

> [English](./README_en.md) | 简体中文

Vue 3 基于文件系统的路由生成器，为 Vue Router 提供完整的类型推断支持。类似 Nuxt 的路由系统，但更轻量。

## ✨ 特性

- 📁 **自动路由生成** - 基于 `pages/` 目录结构自动生成路由
- 🔒 **类型安全** - 路由跳转和参数���取都有完整的 TypeScript 类型检查
- 🎨 **`<route>` 自定义块** - 在组件中直接定义路由元数据（零运行时开销）
- 📦 **开箱即用** - 5 分钟即可完成配置

## 📦 快速开始

### 1. 安装

```bash
pnpm install @zphhpzzph/vue-route-gen
```

### 2. 配置 Vite

在 `vite.config.ts` 中添加插件：

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { routeBlockPlugin, routeGenPlugin } from '@zphhpzzph/vue-route-gen/vite';

export default defineConfig({
  plugins: [
    routeBlockPlugin(),  // 处理 <route> 自定义块
    routeGenPlugin(),    // 自动生成路由
    vue(),
  ],
});
```

### 3. 创建页面文件

在 `src/pages/` 目录下创建 `.vue` 文件：

```
src/pages/
├── index.vue          # 首页 → /
├── about.vue          # 关于页 → /about
└── users/
    ├── index.vue      # 用户列表 → /users
    └── [id].vue       # 用户详情 → /users/:id
```

### 4. 配置路由

在 `src/router/index.ts` 中使用生成的路由：

```typescript
import { createRouter } from 'vue-router';
import { routes } from './route.gen';

export const router = createRouter({
  routes,
  // ... 其他配置
});
```

**就这么简单！** 路由会自动生成并保持更新。

## 🚀 常见用法

### 路由跳转（类型安全）

```vue
<script setup lang="ts">
import { useRouter, ROUTE_NAME } from '@/router/route.gen';

const router = useRouter();

// 跳转到用户详情页
function goToUser(userId: string) {
  router.push({
    name: ROUTE_NAME.USERS_ID,
    params: { id: userId } // ✅ TypeScript 会检查参数
  });
}
</script>
```

### 获取路由参数（类型安全）

```vue
<script setup lang="ts">
import { useRoute } from '@/router/route.gen';

const route = useRoute();

// 当在用户详情页时
if (route.name === ROUTE_NAME.USERS_ID) {
  console.log(route.params.id); // ✅ 类型为 string
}
</script>
```

### 定义路由元数据

在组件中添加 `<route>` 自定义块：

```vue
<template>
  <div><h1>用户列表</h1></div>
</template>

<route>
{
  "title": "用户列表",
  "layout": "admin",
  "requiresAuth": true,
  "roles": ["admin"]
}
</route>
```

### 在路由守卫中使用元数据

```typescript
// router/guards.ts
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title;
  }

  // 检查认证
  if (to.meta.requiresAuth && !isAuthenticated()) {
    return next({ name: 'login' });
  }

  next();
});
```

## 📁 目录结构约定

```
src/pages/
├── layout.vue              # 根布局
├── index.vue               # 首页 (/)
├── about.vue               # 关于页面 (/about)
├── users/
│   ├── layout.vue          # 用户布局（嵌套）
│   ├── index.vue           # 用户列表 (/users)
│   └── [id].vue            # 用户详情 (/users/:id)
└── $slug.vue               # 通配路由 (/:slug)
```

**自动排除的目录**：`components/`、`hooks/`、`services/`、`types/`、`constants/`、`utils/`

## ⚙️ 配置

### Vite 插件配置

如需自定义页面目录或输出文件路径：

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    routeBlockPlugin(),
    routeGenPlugin({
      pagesDir: './src/pages',           // 可选，默认 'src/pages'
      outFile: './src/router/route.gen.ts',  // 可选，默认 'src/router/route.gen.ts'
    }),
    vue(),
  ],
});
```

### 自定义路由元数据类型

在项目中扩展路由元数据类型：

```typescript
// src/types/router.d.ts
declare module '@zphhpzzph/vue-route-gen/runtime' {
  interface RouteMeta {
    icon?: string;        // 菜单图标
    hidden?: boolean;     // 是否隐藏
    order?: number;       // 排序
  }
}
```

然后在 `<route>` 块中使用：

```vue
<route>
{
  "title": "仪表盘",
  "icon": "Dashboard",
  "hidden": false,
  "order": 1
}
</route>
```

### 支持的元数据属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `title` | `string` | 页面标题 |
| `layout` | `string \| false` | 布局组件或 `false` 禁用 |
| `keepAlive` | `boolean` | 是否缓存页面 |
| `requiresAuth` | `boolean` | 是否需要认证 |
| `roles` | `string[]` | 允许的角色 |
| `redirect` | `string \| object` | 重定向配置 |
| `icon` | `string` | 菜单图标 |
| `hidden` | `boolean` | 是否隐藏菜单 |
| `*` | `any` | 支持任何自定义属性 |

## 📖 实用示例

### 示例 1：创建嵌套路由

```
src/pages/
├── layout.vue              # 根布局
├── index.vue               # → /
├── admin/
│   ├── layout.vue          # 管理后台布局
│   ├── index.vue           # → /admin
│   └── users/
│       ├── index.vue       # → /admin/users
│       └── [id].vue        # → /admin/users/:id
```

### 示例 2：动态路由参数

两种语法都支持：

```
# 方式 1：Vue Router 风格
users/[id].vue          # → /users/:id

# 方式 2：Nuxt 风格
posts/$slug.vue         # → /posts/:slug
```

### 示例 3：完整页面示例

```vue
<!-- src/pages/users/[id].vue -->
<template>
  <div>
    <h1>用户详情</h1>
    <p>用户 ID: {{ userId }}</p>
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
  "title": "用户详情",
  "layout": "admin",
  "requiresAuth": true,
  "roles": ["admin", "moderator"]
}
</route>
```

## 🔍 生成的内容说明

`vue-route-gen` 会生成 `route.gen.ts` 文件，包含：

- **`routes`** - Vue Router 路由配置数组
- **`ROUTE_NAME`** - 路由名称常量（避免硬编码）
- **`useRoute()`** - 类型增强的路由 hook
- **`useRouter()`** - 类型增强的路由导航 hook

**通常你只需要使用这几个导出即可，无需关心底层实现细节。**

## ❓ 常见问题

### Q: 如何手动触发路由生成？

A: 运行 CLI 命令：
```bash
pnpm exec vue-route-gen
```

### Q: 如何禁用某个目录的路由生成？

A: 以下目录自动排除：`components/`、`hooks/`、`services/`、`types/`、`constants/`、`utils/`

### Q: 开发时路由会自动更新吗？

A: 使用 `routeGenPlugin()` 后，路由会在文件变化时自动重新生成。

## 📚 深入阅读

- **[文档索引](./docs/README.md)** - 完整文档导航
- **[更新日志](./CHANGELOG.md)** - 版本更新记录
- **[字面量类型推断](./docs/LiteralTypes.md)** - 精确的类型推断系统
- **[Vite 插件详解](./docs/VitePlugin.md)** - 插件工作原理

## 📄 License

MIT
