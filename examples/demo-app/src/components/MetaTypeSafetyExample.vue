<script setup lang="ts">
import { useRoute, ROUTE_NAME, type RouteMetaByName } from '@/router/route.gen';

/**
 * route.meta 类型安全示例
 */

// 示例 1: 使用 useRoute 获取类型化的 meta
const route = useRoute();

// 示例 2: 根据路由名称获取特定 meta 类型
type UsersIdMeta = RouteMetaByName<typeof ROUTE_NAME.USERS_ID>;
// 类型为：
// {
//   title: string;
//   layout: string;
//   requiresAuth: true;
//   roles: string[];
// } & RouteMeta

// 示例 3: 访问 meta 属性（完全类型安全）
if (route.name === ROUTE_NAME.USERS_ID) {
  // ✅ TypeScript 知道这些属性存在且有正确的类型
  console.log(route.meta.title);        // string
  console.log(route.meta.layout);      // string
  console.log(route.meta.requiresAuth); // boolean
  console.log(route.meta.roles);       // string[]

  // ❌ TypeScript 会报错：属性不存在
  // console.log(route.meta.wrongProp);
}

// 示例 4: 不同路由有不同的 meta 类型
if (route.name === ROUTE_NAME.INDEX) {
  console.log(route.meta.title);        // string
  console.log(route.meta.keepAlive);    // boolean
  // 注意：INDEX 路由没有 roles 属性
  // console.log(route.meta.roles);     // ❌ TypeScript 报错
}

// 示例 5: 使用泛型参数指定路由
const usersRoute = useRoute<typeof ROUTE_NAME.USERS_ID>();
// usersRoute.meta.roles 的类型是 string[]

// 示例 6: 函数中使用 meta 类型
function checkPermission(meta: RouteMetaByName<typeof ROUTE_NAME.USERS_ID>): boolean {
  // ✅ 完全类型安全
  if (meta.requiresAuth && meta.roles) {
    return meta.roles.includes('admin');
  }
  return false;
}
</script>

<template>
  <div class="meta-type-safety">
    <h2>route.meta 类型安全示例</h2>

    <section class="example">
      <h3>1. 当前路由的 meta 属性</h3>
      <div v-if="route.name === ROUTE_NAME.USERS_ID">
        <p><strong>标题:</strong> {{ route.meta.title }}</p>
        <p><strong>布局:</strong> {{ route.meta.layout }}</p>
        <p><strong>需要认证:</strong> {{ route.meta.requiresAuth }}</p>
        <p><strong>角色:</strong> {{ route.meta.roles?.join(', ') }}</p>
      </div>

      <div v-else-if="route.name === ROUTE_NAME.INDEX">
        <p><strong>标题:</strong> {{ route.meta.title }}</p>
        <p><strong>布局:</strong> {{ route.meta.layout }}</p>
        <p><strong>缓存:</strong> {{ route.meta.keepAlive }}</p>
      </div>
    </section>

    <section class="type-safety-info">
      <h3>类型安全特性</h3>
      <ul>
        <li>✅ <code>route.meta</code> 根据路由名称自动推导类型</li>
        <li>✅ 访问不存在的 meta 属性时 TypeScript 报错</li>
        <li>✅ meta 属性值的类型完全正确（string、boolean、string[] 等）</li>
        <li>✅ 支持使用 <code>RouteMetaByName&lt;T&gt;</code> 获取特定路由的 meta 类型</li>
      </ul>
    </section>

    <section class="code-example">
      <h3>代码示例</h3>
      <pre><code>// 访问 meta 属性（完全类型安全）
const route = useRoute();

if (route.name === ROUTE_NAME.USERS_ID) {
  // ✅ TypeScript 知道这些属性存在
  console.log(route.meta.title);        // string
  console.log(route.meta.roles);       // string[]

  // ❌ TypeScript 报错：属性不存在
  // console.log(route.meta.wrongProp);
}

// 获取特定路由的 meta 类型
type UsersMeta = RouteMetaByName&lt;typeof ROUTE_NAME.USERS_ID&gt;;
// 类型为: { title: string; layout: string; ... } & RouteMeta</code></pre>
    </section>
  </div>
</template>

<style scoped>
.meta-type-safety {
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.example {
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f9f9f9;
}

.example h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
}

.example p {
  margin: 0.5rem 0;
}

.type-safety-info {
  padding: 1.5rem;
  background: #e8f5e9;
  border-radius: 8px;
  border: 1px solid #4caf50;
  margin-bottom: 2rem;
}

.type-safety-info h3 {
  margin-top: 0;
  color: #2e7d32;
}

.type-safety-info ul {
  list-style: none;
  padding: 0;
}

.type-safety-info li {
  padding: 0.5rem 0;
  font-size: 0.95rem;
}

.type-safety-info code {
  background: #f5f5f5;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.code-example {
  padding: 1.5rem;
  background: #263238;
  border-radius: 8px;
  overflow-x: auto;
}

.code-example h3 {
  margin-top: 0;
  color: #fff;
  margin-bottom: 1rem;
}

.code-example pre {
  margin: 0;
}

.code-example code {
  color: #aed581;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
}
</style>
