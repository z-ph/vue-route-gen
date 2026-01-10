# Vite 插件配置

使用 Vite 插件自动生成路由，无需手动运行命令。

## 基础配置

### 完整配置示例

在 `vite.config.ts` 中添加插件：

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { routeBlockPlugin, routeGenPlugin } from '@zphhpzzph/vue-route-gen/vite';

export default defineConfig({
  plugins: [
    routeBlockPlugin(),  // 1. 处理 <route> 自定义块
    routeGenPlugin(),    // 2. 自动生成路由
    vue(),               // 3. Vue 插件
  ],
});
```

**插件顺序很重要**：`routeBlockPlugin()` → `routeGenPlugin()` → `vue()`

## 自定义配置

### 修改页面目录

```typescript
export default defineConfig({
  plugins: [
    routeGenPlugin({
      pagesDir: './src/views',           // 使用 views 而不是 pages
      outFile: './src/router/routes.gen.ts',  // 自定义输出文件
    }),
  ],
});
```

### 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `pagesDir` | `string` | `'src/pages'` | 页面文件目录 |
| `outFile` | `string` | `'src/router/route.gen.ts'` | 生成的路由文件 |

## 工作原理

### 自动监听变化

插件会自动监听 `pages` 目录的变化：

- ✅ **添加新页面** - 自动生成新路由
- ✅ **删除页面** - 自动移除对应路由
- ✅ **修改路由配置** - 智能判断是否需要更新

### 开发体验

```bash
# 1. 启动开发服务器
pnpm run dev

# 2. 修改页面文件
# 插件自动检测变化

# 3. 路由自动更新
# 浏览器自动刷新
```

## 常见问题

### Q: 插件会影响生产构建吗？

A: 不会。插件只在开发模式下自动生成路由，生产构建时使用已生成的路由文件。

### Q: 如何手动触发路由生成？

A: 运行 CLI 命令：
```bash
pnpm exec vue-route-gen
```

### Q: 为什么修改路由后需要刷新页面？

A: Vue Router 的路由配置在初始化时注册，修改后需要重新加载。插件会自动触发浏览器刷新。

### Q: 可以在多个应用中使用吗？

A: 可以。为每个应用配置不同的 `pagesDir` 和 `outFile`：

```typescript
export default defineConfig({
  plugins: [
    routeGenPlugin({
      pagesDir: './src/app1/pages',
      outFile: './src/app1/router/routes.gen.ts',
    }),
  ],
});
```

## 迁移指南

### 从手动生成迁移

**之前（手动运行）：**
```json
{
  "scripts": {
    "gen-routes": "vue-route-gen"
  }
}
```
```bash
pnpm run gen-routes  # 每次修改都要运行
```

**现在（自动生成）：**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [routeGenPlugin()],
});
```

不再需要手动运行生成命令！

## 高级用法

### 与其他插件配合

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { routeBlockPlugin, routeGenPlugin } from '@zphhpzzph/vue-route-gen/vite';
import Components from 'unplugin-vue-components/vite';
import AutoImport from 'unplugin-auto-import/vite';

export default defineConfig({
  plugins: [
    routeBlockPlugin(),
    routeGenPlugin(),
    vue(),
    Components({ /* ... */ }),
    AutoImport({ /* ... */ }),
  ],
});
```

### 调试技巧

查看生成日志：
```
[vue-route-gen] Routes generated: 5 routes
[vue-route-gen] File changed: src/pages/test.vue
[vue-route-gen] Regenerating routes...
```

清除缓存（如果遇到问题）：
```bash
rm -rf node_modules/.cache/route-gen.json
```

## 总结

使用 `routeGenPlugin()` 后：

- ✅ 无需手动运行生成命令
- ✅ 文件变化自动更新路由
- ✅ 浏览器自动刷新
- ✅ 类型安全自动同步

让路由管理完全自动化！
