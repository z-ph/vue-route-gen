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

### 选项

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
6. `routes` - Vue Router 路由记录数组
7. `useRoute()` - 类型安全的路由访问 Hook，提供参数类型推断
8. `useRouter()` - 类型安全的路由导航 Hook，提供参数验证

## 类型安全的路由

### 自动生成的参数类型

对于 `/users/[id].vue` 这样的路由，生成器会自动提取 `id` 参数：

```typescript
// 在 route.gen.ts 中生成
export interface RouteParams {
  'users-id': {
    id: string;
  };
  // ... 其他路由
}
```

### 使用 useRoute

生成的 `useRoute` Hook 为路由参数提供完整的类型推断：

```typescript
import { useRoute, ROUTE_NAME } from '@/router/route.gen';

const route = useRoute<'users-id'>();
// route.params.id 的类型为 `string`

if (route.name === ROUTE_NAME.USERS_ID) {
  console.log(route.params.id); // 完整类型支持！
}
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
