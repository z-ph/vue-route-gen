<script setup lang="ts">
import { useRoute, ROUTE_NAME } from '@/router/route.gen';

/**
 * 测试 roles 属性的类型
 */

const route = useRoute();

// 测试：users-[id] 路由的 roles 属性
if (route.name === ROUTE_NAME.USERS_ID) {
  // ✅ 应该是 string[]，不是 string[] | undefined
  const roles: string[] = route.meta.roles;

  // ✅ 可以使用数组方法
  roles.forEach(role => console.log(role));

  // ✅ 类型保护，检查是否有值
  if (route.meta.roles) {
    const hasAdmin = route.meta.roles.includes('admin');
  }

  // ❌ 这行应该报错，因为 roles 已经是必需的 string[]
  // const rolesMaybe = route.meta.roles ?? [];  // 不需要 ??
}

// 测试：index 路由没有 roles 属性
if (route.name === ROUTE_NAME.INDEX) {
  // ❌ TypeScript 应该报错：index 路由没有 roles 属性
  // console.log(route.meta.roles);
}

// 测试：获取类型
type UsersIdMeta = typeof import('@/router/route.gen').RouteMetaMap['users-[id']>;
// 验证类型
const testRoles: UsersIdMeta['roles'] = ['admin', 'moderator'];
// testRoles 的类型应该是 string[]，不是 string[] | undefined
</script>

<template>
  <div>
    <h1>Roles 类型测试</h1>
    <p>查看控制台或 TypeScript 类型检查</p>
  </div>
</template>
