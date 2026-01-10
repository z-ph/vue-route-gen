# 路由配置完整指南

使用 `<route>` 自定义块或 `defineRoute()` 宏定义完整的路由配置。

## 📖 概述

`vue-route-gen` 支持两种方式在组件中定义路由配置：

1. **`<route>` 自定义块** - 在模板中定义（推荐）
2. **`defineRoute()` 宏** - 在 script 中定义

这两种方式都支持完整的 Vue Router 配置，不仅仅是元数据。

## 方式一：`<route>` 自定义块（推荐）

### 基础用法

在组件中添加 `<route>` 自定义块：

```vue
<template>
  <div><h1>用户列表</h1></div>
</template>

<route>
{
  meta:{
    "title": "用户列表",
    "layout": "admin"
  }
}
</route>
```

### 完整路由配置示例

```vue
<route>
{
  "path": "/custom-path",
  "name": "custom-name",
  "alias": ["/alias1", "/alias2"],
  "redirect": "/login",
  "props": true,
  "meta": {
    "title": "自定义页面",
    "layout": "admin",
    "requiresAuth": true
  }
}
</route>
```

### 支持的配置项

所有 Vue Router 的 `RouteRecordRaw` 字段都支持：

| 配置项        | 类型                 | 说明           |
| ------------- | -------------------- | -------------- |
| `path`        | `string`             | 自定义路由路径 |
| `name`        | `string`             | 自定义路由名称 |
| `alias`       | `string \| string[]` | 路由别名       |
| `redirect`    | `string \| object`   | 重定向目标     |
| `props`       | `boolean \| object`  | 路由参数传递   |
| `meta`        | `object`             | 路由元数据     |
| `children`    | `array`              | 嵌套路由       |
| `beforeEnter` | `function`           | 路由守卫       |

## 方式二：`defineRoute()` 宏

### 基础用法

在 `<script setup>` 中使用 `defineRoute()`：

```vue
<template>
  <div><h1>用户列表</h1></div>
</template>

<script setup lang="ts">
defineRoute({
  meta: {
    title: '自定义页面',
    layout: 'admin',
    requiresAuth: true,
  }
});
</script>
```

### 完整配置示例

```vue
<script setup lang="ts">
defineRoute({
  path: '/custom-path',
  name: 'custom-name',
  alias: ['/alias1', '/alias2'],
  props: true,
  meta: {
    title: '自定义页面',
    layout: 'admin',
    requiresAuth: true,
  },
});
</script>
```

### 变量赋值方式

```vue
<script setup lang="ts">
const routeConfig = defineRoute({
  title: '用��列表',
  layout: 'admin',
});
</script>
```

## ⚠️ 重要限制

### 不能同时使用两种方式

```vue
<!-- ❌ 错误：不能同时使用 -->
<template>
  <div>Page</div>
</template>

<script setup lang="ts">
defineRoute({ title: 'Title' });
</script>

<route>
{
  "title": "Title"
}
</route>
```

**错误提示**：

```
Cannot use both <route> custom block and defineRoute() macro.
Please choose one method.
```

## 实用示例

### 1. 自定义路由路径

```vue
<route>
{
  "path": "/custom-users"
}
</route>
```

生成的路由：`/custom-users` 而不是默认的 `/users`

### 2. 添加路由别名

```vue
<route>
{
  "alias": ["/u", "/users-list"]
}
</route>
```

可以通过 `/users`、`/u` 或 `/users-list` 访问同一页面。

### 3. 路由参数传递（props）

```vue
<route>
{
  "props": true
}
</route>
```

路由参数会作为 props 传递给组件。

```vue
<!-- 组件中直接接收 props -->
<script setup lang="ts">
const props = defineProps<{
  id: string;
}>();
</script>
```

### 4. 重定向配置

```vue
<!-- 重定向到路径 -->
<route>
{
  "redirect": "/login"
}
</route>
```

```vue
<!-- 重定向到命名路由 -->
<route>
{
  "redirect": { "name": "login" }
}
</route>
```

### 5. 路由守卫

```vue
<script setup lang="ts">
defineRoute({
  beforeEnter: (to, from, next) => {
    // 验证权限
    if (!hasPermission()) {
      next({ name: 'forbidden' });
    } else {
      next();
    }
  },
});
</script>
```

### 6. 完整权限控制

```vue
<route>
{
  "path": "/admin/users",
  "name": "admin-users",
  "meta": {
    "title": "用户管理",
    "layout": "admin",
    "requiresAuth": true,
    "roles": ["admin"],
    "icon": "User",
    "hidden": false
  }
}
</route>
```

### 7. 动态路由参数

```vue
<route>
{
  "path": "/users/:id",
  "props": true,
  "meta": {
    "title": "用户详情"
  }
}
</route>
```

## 常见配置模式

### 模式 1：仅元数据

最简单的用法，只定义 `meta` 字段：

```vue
<route>
{
  "meta": {
    "title": "页面标题",
    "layout": "default"
  }
}
</route>
```

### 模式 2：自定义路径 + 元数据

```vue
<route>
{
  "path": "/custom-path",
  "meta": {
    "title": "自定义页面"
  }
}
</route>
```

### 模式 3：完整配置

```vue
<route>
{
  "path": "/users/:id",
  "name": "user-detail",
  "alias": ["/u/:id"],
  "props": (route) => ({ id: Number(route.params.id) }),
  "meta": {
    "title": "用户详情",
    "requiresAuth": true
  }
}
</route>
```

## 选择哪种方式？

### `<route>` 块（推荐）

**优势**：

- ✅ 配置和模板分离，结构清晰
- ✅ 支持 JSON 语法，不易出错
- ✅ 不需要引入类型定义

**适用场景**：

- 大多数场景
- 需要频繁修改路由配置
- 团队协作项目

### `defineRoute()` 宏

**优势**：

- ✅ 可以使用变量和常量
- ✅ 完整的 TypeScript 类型支持
- ✅ 可以编写逻辑代码

**适用场景**：

- 需要动态生成配置
- 需要复用配置常量
- 需要函数式配置（如 `props` 函数）

## 与路由守卫集成

### 在全局守卫中使用配置

```typescript
// router/guards.ts
router.beforeEach((to, from, next) => {
  const { meta, path } = to;

  // 设置页面标题
  if (meta.title) {
    document.title = `${meta.title} - My App`;
  }

  // 检查认证
  if (meta.requiresAuth && !isAuthenticated()) {
    return next({ name: 'login' });
  }

  // 检查角色权限
  if (meta.roles && !hasRole(meta.roles)) {
    return next({ name: 'forbidden' });
  }

  next();
});
```

### 组件级守卫

```vue
<script setup lang="ts">
defineRoute({
  beforeEnter: (to, from, next) => {
    console.log('Entering component route');
    next();
  },
});
</script>
```

## 高级用法

### 嵌套路由配置

虽然不推荐在页面组件中定义嵌套路由，但支持：

```vue
<route>
{
  "children": [
    {
      "path": "tab1",
      "component": () => import('./Tab1.vue')
    },
    {
      "path": "tab2",
      "component": () => import('./Tab2.vue')
    }
  ]
}
</route>
```

### 动态 props

```vue
<route>
{
  "props": (route) => ({
    id: Number(route.params.id),
    queryParams: route.query
  })
}
</route>
```

### 自定义元数据类型

```typescript
// types/router.d.ts
declare module '@zphhpzzph/vue-route-gen/runtime' {
  interface RouteMeta {
    icon?: string;
    hidden?: boolean;
    order?: number;
    permissions?: string[];
  }
}
```

## 最佳实践

1. **优先使用 `<route>` 块** - 更清晰，不易出错
2. **只在 `meta` 中定义业务数据** - 其他配置应谨慎使用
3. **使用 TypeScript** - 获得完整的类型提示
4. **不要过度使用自定义路径** - 保持路由结构的一致性
5. **合理使用别名** - 仅为向后兼容或简化 URL 添加别名

## 常见问题

### Q: 配置会覆盖自动生成的路由吗？

A: 部分覆盖。`path`、`name`、`alias`、`redirect`、`props`、`meta`、`children`、`beforeEnter` 等字段会覆盖，`component` 由系统自动指定。

### Q: 可以使用变量吗？

A: `<route>` 块只支持静态值。如需使用变量，使用 `defineRoute()`。

### Q: 配置的优先级？

A: 组件内配置 > 自动生成的默认配置。

### Q: 如何调试配置？

A: 查看生成的 `route.gen.ts` 文件，确认配置是否正确应用。

## 总结

两种路由配置方式：

- ✅ **`<route>` 块** - 简单清晰，推荐使用
- ✅ **`defineRoute()` 宏** - 灵活强大，适合复杂场景
- ✅ **完整配置支持** - 所有 Vue Router 字段
- ✅ **类型安全** - 完整的 TypeScript 支持

选择最适合你的方式，让路由配置更灵活！
