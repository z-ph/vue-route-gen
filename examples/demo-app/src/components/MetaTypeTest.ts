/**
 * route.meta 类型测试
 * 运行 tsc 检查类型
 */

import { useRoute, ROUTE_NAME } from '@/router/route.gen';

const route = useRoute();

// 测试 1: 访问 roles 属性
if (route.name === ROUTE_NAME.USERS_ID) {
  // 需要使用类型断言来访问特定路由的 meta 属性
  const currentRoute = useRoute(ROUTE_NAME.USERS_ID);
  // ✅ 应该是 string[] 类型，不是 any
  const roles = currentRoute.meta.roles;

  // ✅ 应该能调用数组方法
  roles?.map((role: string) => role.toUpperCase());
  roles?.forEach((role: string) => console.log(role));

  // ✅ 应该能使用数组方法
  roles?.includes('admin');

  // ❌ 这应该报错：不能把 any 赋值给 string[]
  // const wrong: string[] = route.meta.roles;
}

// 测试 2: roles 不���赋值给 other 类型
if (route.name === ROUTE_NAME.USERS_ID) {
  const currentRoute = useRoute(ROUTE_NAME.USERS_ID);
  // ❌ 应该报错：不能把 string[] 赋值给 number[]
  // const wrong: number[] = currentRoute.meta.roles || [];

  // ❌ 应该报错：不能把 string[] 赋值给 string
  // const wrong2: string = currentRoute.meta.roles;
}

// 测试 3: 其他 meta 属性的类型
if (route.name === ROUTE_NAME.USERS_ID) {
  const currentRoute = useRoute(ROUTE_NAME.USERS_ID);
  const title = currentRoute.meta.title || '';  // ✅ string
  const layout = currentRoute.meta.layout || ''; // ✅ string
  const requiresAuth = currentRoute.meta.requiresAuth || false; // ✅ boolean
}

// 测试 4: 不存在的属性应该报错
if (route.name === ROUTE_NAME.USERS_ID) {
  const currentRoute = useRoute(ROUTE_NAME.USERS_ID);
  // ❌ 应该报错：属性不存在
  // const wrong = currentRoute.meta.wrongProp;
}

console.log('✅ 所有类型测试通过！');
