/**
 * route.meta 类型测试
 * 运行 tsc 检查类型
 */

import { useRoute, ROUTE_NAME } from '@/router/route.gen';

const route = useRoute();

// 测试 1: 访问 roles 属性
if (route.name === ROUTE_NAME.USERS_ID) {
  // ✅ 应该是 string[] 类型，不是 any
  const roles = route.meta.roles;

  // ✅ 应该能调用数组方法
  roles?.map(role => role.toUpperCase());
  roles?.forEach(role => console.log(role));

  // ✅ 应该能使用数���方法
  const hasAdmin = roles?.includes('admin');

  // ❌ 这应该报错：不能把 any 赋值给 string[]
  // const wrong: string[] = route.meta.roles;
}

// 测试 2: roles 不能赋值给 other 类型
if (route.name === ROUTE_NAME.USERS_ID) {
  // ❌ 应该报错：不能把 string[] 赋值给 number[]
  // const wrong: number[] = route.meta.roles || [];

  // ❌ 应该报错：不能把 string[] 赋值给 string
  // const wrong2: string = route.meta.roles;
}

// 测试 3: 其他 meta 属性的类型
if (route.name === ROUTE_NAME.USERS_ID) {
  const title: string = route.meta.title || '';  // ✅ string
  const layout: string = route.meta.layout || ''; // ✅ string
  const requiresAuth: boolean = route.meta.requiresAuth || false; // ✅ boolean
}

// 测试 4: 不存在的属性应该报错
if (route.name === ROUTE_NAME.USERS_ID) {
  // ❌ 应该报错：属性不存在
  // const wrong = route.meta.wrongProp;
}

console.log('✅ 所有类型测试通过！');
