# 路由元数据字面量类型推断

@zphhpzzph/vue-route-gen v1.1.0+ 引入了**精确的字面量类型推断**功能，为路由元数据提供前所未有的类型安全性。

## 概述

传统路由生成器通常将元数据类型定义为宽泛的基础类型（如 `string`、`boolean`、`string[]`），这导致类型检查不够精确。本包通过字面量类型推断，自动从 `<route>` 块中提取精确的值类型。

### 对比：传统类型 vs 字面量类型

**传统类型（宽泛）**：
```typescript
interface RouteMeta {
  title: string;        // 可以是任意字符串
  layout: string;       // 可以是任意字符串
  requiresAuth: boolean; // 可以是 true 或 false
  roles: string[];      // 可以是任意字符串数组
}
```

**字面量类型（精确）**：
```typescript
interface RouteMetaMap {
  'users-[id]': {
    title: "User Detail";              // 只能是 "User Detail"
    layout: "admin";                   // 只能是 "admin"
    requiresAuth: true;                // 只能是 true
    roles: ["admin" | "moderator"];    // 只能是 "admin" 或 "moderator"
  };
  'about': {
    title: "About Us";
    layout: "default";
    requiresAuth: false;
    roles: undefined;                  // 此路由没有 roles 字段
  };
}
```

## 工作原理

### 1. 构建时类型提取

在运行 `vue-route-gen` 时，构建器会：

1. **扫描所有路由文件** - 读取每个 `.vue` 文件的 `<route>` 块
2. **收集元数据字段** - 识别所有路由中使用的元数据键（如 `title`、`layout`、`roles`）
3. **推断字面量类型** - 将每个值转换为对应的 TypeScript 字面量类型
4. **生成统一形状** - 为每个路由生成包含所有字段的类型，缺失的字段设为 `undefined`

### 2. 类型推断规则

| JavaScript 值 | TypeScript 字面量类型 |
|---------------|----------------------|
| `"User Detail"` | `"User Detail"` |
| `true` | `true` |
| `false` | `false` |
| `123` | `123` |
| `["admin", "moderator"]` | `["admin" | "moderator"]` |
| `{ key: "value" }` | `{ key: "value" }` |

### 3. 联合类型兼容

通过为所有路由生成相同的字段结构（缺失字段为 `undefined`），确保类型联合的兼容性：

```typescript
// 所有路由都有相同的字段形状
type RouteMetaUnion =
  | { title: "Home"; layout: "default"; roles: undefined; }
  | { title: "Users"; layout: "admin"; roles: ["admin"]; }
  | { title: "User Detail"; layout: "admin"; roles: ["admin" | "moderator"]; };

// 可以安全访问 roles 属性（虽然可能是 undefined）
function getRoles(meta: RouteMetaUnion) {
  return meta.roles; // 类型：undefined | ["admin"] | ["admin" | "moderator"]
}
```

## 实际应用

### 基础用法

**定义路由元数据**：
```vue
<!-- src/pages/users/[id].vue -->
<template>
  <div>
    <h1>{{ route.meta.title }}</h1>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from '@/router';

const route = useRoute();
// route.meta.title 的类型是 "User Detail"
// route.meta.roles 的类型是 ["admin" | "moderator"]
</script>

<route>
{
  "title": "User Detail",
  "layout": "admin",
  "requiresAuth": true,
  "roles": ["admin", "moderator"]
}
</route>
```

### 类型安全的好处

#### 1. 防止拼写错误

```typescript
const route = useRoute('users-[id]');

// ✅ 正确
const title = route.meta.title; // "User Detail"

// ❌ TypeScript 报错：属性 "tile" 不存在
// const typo = route.meta.tile;
```

#### 2. 精确的值类型检查

```typescript
function setPageTitle(meta: RouteMetaByName<'users-[id]'>) {
  // meta.title 的类型是 "User Detail"，不是任意字符串

  // ✅ 正确：类型匹配
  if (meta.title === "User Detail") {
    document.title = meta.title;
  }

  // ❌ TypeScript 警告：这个条件永远不会为 true
  if (meta.title === "Wrong Title") {
    // 类型错误："User Detail" 类型不能等于 "Wrong Title"
  }
}
```

#### 3. 枚举式类型约束

```typescript
// roles 字段的类型是 ["admin" | "moderator"]
function checkPermission(meta: RouteMetaByName<'users-[id]'>, role: string) {
  if (meta.roles) {
    // TypeScript 知道 meta.roles 只能包含 "admin" 或 "moderator"
    return meta.roles.includes(role as "admin" | "moderator");
  }
  return false;
}
```

### 与路由守卫集成

```typescript
// router/guards.ts
import { router } from './router';
import type { RouteMetaMap } from './route.gen';

router.beforeEach((to, from, next) => {
  const meta = to.meta as RouteMetaMap[keyof RouteMetaMap];

  // meta.requiresAuth 的类型是字面量类型（true 或 false）
  if (meta.requiresAuth === true && !isAuthenticated()) {
    return next({ name: 'login' });
  }

  // meta.roles 的类型是具体的数组类型或 undefined
  if (meta.roles && meta.roles.length > 0) {
    const hasPermission = meta.roles.some(role => currentUser.roles.includes(role));
    if (!hasPermission) {
      return next({ name: 'forbidden' });
    }
  }

  next();
});
```

## 高级用法

### 获取特定路由的元数据类型

```typescript
import type { RouteMetaByName } from '@/router/route.gen';

// 获取用户详情页的元数据类型
type UserDetailMeta = RouteMetaByName<'users-[id]'>;
// 等价于：
// {
//   keepAlive: undefined;
//   layout: "admin";
//   requiresAuth: true;
//   roles: ["admin" | "moderator"];
//   title: "User Detail";
// }

function useUserDetailMeta(): UserDetailMeta {
  const { meta } = useRoute('users-[id]');
  return meta;
}

// ✅ 类型安全：只能访问 UserDetailMeta 中定义的属性
const meta = useUserDetailMeta();
console.log(meta.title); // "User Detail"
console.log(meta.layout); // "admin"
```

### 类型守卫

```typescript
import type { RouteMetaMap } from '@/router/route.gen';

function isAdminRoute(
  meta: RouteMetaMap[keyof RouteMetaMap]
): meta is RouteMetaMap['users-[id]'] | RouteMetaMap['users-index'] {
  return meta.layout === "admin";
}

function handleRoute(meta: RouteMetaMap[keyof RouteMetaMap]) {
  if (isAdminRoute(meta)) {
    // TypeScript 知道 meta.layout 的类型是 "admin"
    console.log('Admin layout:', meta.layout);

    // TypeScript 知道 meta.roles 可能存在
    if (meta.roles) {
      console.log('Allowed roles:', meta.roles);
    }
  }
}
```

### 条件类型

```typescript
import type { RouteMetaMap, RouteName } from '@/router/route.gen';

type ExtractRoutesWithRoles<T extends RouteName = RouteName> = {
  [K in T]: RouteMetaMap[K]['roles'] extends undefined ? never : K
}[T];

// 结果：'users-[id]' | 'users-index'
type RoutesWithRoles = ExtractRoutesWithRoles;
```

## 类型安全最佳实践

### 1. 使用 `useRoute` 的泛型参数

```typescript
// ❌ 避免：不传入路由名称
const route = useRoute();
// route.meta 的类型是所有路由的联合类型

// ✅ 推荐：传入路由名称获取精确类型
const route = useRoute('users-[id]');
// route.meta 的类型是精确的 RouteMetaByName<'users-[id]'>
```

### 2. 使用 `RouteMetaByName` 工具类型

```typescript
import type { RouteMetaByName } from '@/router/route.gen';

function processRouteMeta<T extends RouteName>(routeName: T, meta: RouteMetaByName<T>) {
  // meta 的类型根据 routeName 精确推断
  console.log(meta.title);

  if (meta.roles) {
    console.log('Roles:', meta.roles);
  }
}
```

### 3. 避免类型断言

```typescript
// ❌ 避免：使用类型断言
const meta = route.meta as { title: "User Detail"; roles: ["admin" | "moderator"] };

// ✅ 推荐：使用类型系统
const route = useRoute('users-[id]');
const meta = route.meta; // 自动推断为正确的类型
```

## 迁移指南

### 从宽泛类型迁移

如果你的项目之前使用了宽泛的类型（如 `string`、`boolean`），迁移到字面量类型推断是**无缝的**，因为字面量类型是基础类型的子类型。

**兼容性示例**：

```typescript
// 之前的代码（仍然有效）
function setTitle(title: string) {
  document.title = title;
}

// 现在：title 的类型是 "User Detail"
// "User Detail" 是 string 的子类型，所以可以直接传递
const meta = route.meta;
setTitle(meta.title); // ✅ 有效
```

### 需要注意的变化

1. **更严格的类型检查** - 之前可以接受任意字符串的代码现在可能需要类型断言
2. **`undefined` 处理** - 某些字段可能为 `undefined`，需要适当处理

```typescript
// 之前
if (route.meta.roles) { /* ... */ }

// 现在（roles 类型是 undefined | ["admin" | "moderator"]）
if (route.meta.roles && route.meta.roles.length > 0) {
  // TypeScript 知道 roles 不是 undefined
}
```

## 限制和注意事项

### 1. 运行时 vs 编译时

字面量类型只在**编译时**有效，运行时对象仍然是普通的 JavaScript 值：

```typescript
const meta = route.meta;
console.log(typeof meta.title); // "string"（运行时）
// 但编译时类型是 "User Detail"
```

### 2. 只读类型

生成的字面量类型是**只读的**（通过 `as const` 实现）：

```typescript
// ❌ TypeScript 错误：无法赋值
route.meta.title = "New Title";

// ✅ 正确：类型断言为可变类型
(route.meta as any).title = "New Title";
```

### 3. 数组类型的特殊性

数组类型会被推断为**元组类型**，包含所有可能的值：

```typescript
// <route> 块中定义
{ "roles": ["admin", "moderator"] }

// 生成的类型
roles: ["admin" | "moderator"]

// 不是
roles: ("admin" | "moderator")[]
```

## 总结

字面量类型推断为路由元数据提供了：

- ✅ **更精确的类型检查** - 防止拼写错误和错误的值
- ✅ **更好的智能提示** - IDE 可以提示确切的值
- ✅ **编译时验证** - 在编译时捕获错误，而不是运行时
- ✅ **类型安全的联合** - 通过 `undefined` 确保类型兼容
- ✅ **零运行时开销** - 完全的编译时特性

这使得 `@zphhpzzph/vue-route-gen` 成为目前类型安全的 Vue 路由生成器之一。

## 相关资源

- [主 README](../README.md) - 项目概览
- [<route> 自定义块指南](./RouteBlocks.md) - 如何定义路由元数据
- [TypeScript 字面量类型](https://www.typescriptlang.org/docs/handbook/2/literal-types.html)
