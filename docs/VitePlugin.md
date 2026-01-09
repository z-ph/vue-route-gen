# Vite 插件使用指南

`@zphhpzzph/vue-route-gen` 提���了两个 Vite 插件，用于自动生成路由并处理路由配置块。

## 插件列表

### 1. `routeBlockPlugin()`

处理 Vue SFC 文件中的自定义块和宏：

- 移除 `<route>` 自定义块（已在构建时提取）
- 移除 `defineRoute()` 宏调用（已在构建时提取）

**使用方法：**

```typescript
// vite.config.ts
import { routeBlockPlugin } from '@zphhpzzph/vue-route-gen/vite';

export default defineConfig({
  plugins: [routeBlockPlugin()],
});
```

### 2. `routeGenPlugin(options?)`

自动生成路由并监听文件变化：

- 在开发服务器启动时生成路由
- 监听 `pages` 目录的文件变化
- 智能判断是否需要完全重新生成
- 自动触发 HMR 更新

**使用方法：**

```typescript
// vite.config.ts
import { routeGenPlugin } from '@zphhpzzph/vue-route-gen/vite';

export default defineConfig({
  plugins: [
    routeGenPlugin({
      pagesDir: './src/pages',      // 可选，默认 'src/pages'
      outFile: './src/router/route.gen.ts',  // 可选，默认 'src/router/route.gen.ts'
    }),
  ],
});
```

## 完整配置示例

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { routeGenPlugin, routeBlockPlugin } from '@zphhpzzph/vue-route-gen/vite';

export default defineConfig({
  plugins: [
    // 必须在 vue() 之前
    routeBlockPlugin(),

    // 自动生成路由
    routeGenPlugin(),

    // Vue 插件
    vue(),
  ],
});
```

## 插件顺序

**重要**：插件顺序非常重要，必须按照以下顺序配置：

1. `routeBlockPlugin()` - 最先执行，处理 Vue SFC 自定义块
2. `routeGenPlugin()` - 监听变化并生成路由
3. `vue()` - Vue 插件

## 智能更新机制

`routeGenPlugin()` 实现了智能的增量更新机制：

### 变化类型检测

1. **文件添加/删除** (`add`/`unlink`)
   - 总是触发完全重新生成
   - 因为路由结构发生了变化

2. **文件修改** (`change`)
   - 检查是否只是路由配置变化
   - 比较文件哈希和路由配置
   - 只在必要时重新生成

### 缓存机制

插件使用内存缓存来追踪：

```typescript
interface FileCacheEntry {
  meta: RouteMeta;          // 提取的路由元数据
  config: RouteConfigOverride; // 提取的路由配置
  hash: string;             // 文件哈希
}
```

### HMR 集成

当路由文件变化时：

1. 使 `route.gen.ts` 模块失效
2. 触发浏览器完全重载（确保路由变化生效）

```typescript
// 插件内部实现
server.ws.send({ type: 'full-reload', path: '*' });
```

## 性能优化

### 局部更新（未来实现）

当前版本会重新生成整个路由文件，但插件已经为局部更新做好了准备：

```typescript
// 占位代码，未来实现
if (!needsFull) {
  // 仅更新变化的文件配置
  await incrementalUpdate(file, newConfig);
}
```

### 优化建议

1. **避免频繁修改路由配置**
   - 将配置集中在 `<route>` 块中
   - 避免在组件代码中频繁修改路由元数据

2. **使用常量引用**
   - 导入的路由常量会被缓存
   - 减少重复解析开销

3. **排除不必要的目录**
   - 确保只监听 `pages` 目录
   - 避免监听 `components`、`hooks` 等目录

## 开发体验

### 自动重载

修改页面文件后：

1. 插件检测到变化
2. 重新生成 `route.gen.ts`
3. 浏览器自动刷新
4. 新的路由配置生效

### 类型安全

由于路由文件是重新生成的，TypeScript 类型会自动更新：

```typescript
// 修改 test-override.vue 中的路由配置
// <route> { "name": "test" } </route>

// route.gen.ts 自动更新
export const ROUTE_NAME = {
  TEST_OVERRIDE: "test", // ✅ 类型安全
}

// 使用时立即获得类型提示
const route = useRoute('test'); // ✅ 正确
const route = useRoute('test-override'); // ❌ 类型错误
```

## 调试

### 查看生成日志

插件使用 Vite 的日志系统，可以在控制台查看：

```
[vue-route-gen] Routes generated: 5 routes
[vue-route-gen] File changed: src/pages/test.vue
[vue-route-gen] Regenerating routes...
```

### 禁用缓存（开发时）

如果遇到缓存问题，可以删除缓存文件：

```bash
rm -rf node_modules/.cache/route-gen.json
```

## 常见问题

### Q: 为什么路由修改后需要完全重载？

A: Vue Router 的路由配置在初始化时注册，修改路由配置后需要重新初始化。完全重载是最可靠的方式。

### Q: 可以实现热更新而不是完全重载吗？

A: 理论上可以，但需要：
1. 动态更新路由实例
2. 处理导航守卫
3. 同步当前路由状态

完全重载更简单且更可靠。

### Q: 插件会影响生产构建吗？

A: 不会。插件只在开发模式下工作，生产构建时路由已经生成。

### Q: 如何自定义 pages 目录？

A: 使用 `options` 参数：

```typescript
routeGenPlugin({
  pagesDir: './src/views',
  outFile: './src/router/routes.gen.ts',
})
```

## 迁移指南

### 从手动生成迁移到插件

**之前：**

```typescript
// package.json
{
  "scripts": {
    "gen-routes": "vue-route-gen"
  }
}

// 手动运行
pnpm run gen-routes
```

**之后：**

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
import { routeGenPlugin, routeBlockPlugin } from '@zphhpzzph/vue-route-gen/vite';
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

### 多应用配置

如果使用 Vite 的多应用模式：

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

## 总结

`routeGenPlugin()` 提供了：

✅ 自动路由生成
✅ 智能变化检测
✅ HMR 集成
✅ 类型安全
✅ 零配置开箱即用

让路由管理变得自动化和类型安全！
