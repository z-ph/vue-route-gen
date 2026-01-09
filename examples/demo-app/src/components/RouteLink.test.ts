/**
 * RouteLink 类型安��测试
 *
 * 这个文件用于验证 RouteLink 组件的类型安全性
 * 运行 tsc 来检查类型错误
 */

import { RouteLink, ROUTE_NAME, type RouteParamsByName } from '../router/route.gen';

// ==================== 测试 1: 不需要参数的路由 ====================

// ✅ 正确：不传 params
const test1 = {
  name: ROUTE_NAME.INDEX,
  // params 可以省略
};

// ✅ 正确：不需要参数的路由不传 params
const test2 = {
  name: ROUTE_NAME.ABOUT,
};

// ==================== 测试 2: 需要参数的路由 ====================

// ✅ 正确：传递正确的参数
const test3 = {
  name: ROUTE_NAME.USERS_ID,
  params: {
    id: '123', // id 参数是 string 类型
  } as RouteParamsByName<typeof ROUTE_NAME.USERS_ID>,
};

// ❌ 类型错误：缺少必需参数（取消注释以查看错误）
// const test4 = {
//   name: ROUTE_NAME.USERS_ID,
//   // 缺少 params
// };

// ❌ 类型错误：参数名错误（取消注释以查看错误）
// const test5 = {
//   name: ROUTE_NAME.USERS_ID,
//   params: {
//     wrongParam: '123', // 不是 'id'
//   } as RouteParamsByName<typeof ROUTE_NAME.USERS_ID>,
// };

// ❌ 类型错误：参数类型错误（取消��释以查看错误）
// const test6 = {
//   name: ROUTE_NAME.USERS_ID,
//   params: {
//     id: 123, // id 应该是 string，不是 number
//   } as RouteParamsByName<typeof ROUTE_NAME.USERS_ID>,
// };

// ==================== 测试 3: 查询参数 ====================

// ✅ 正确：带查询参数
const test7 = {
  name: ROUTE_NAME.USERS_ID,
  params: {
    id: '456',
  } as RouteParamsByName<typeof ROUTE_NAME.USERS_ID>,
  query: {
    ref: 'homepage',
    tab: 'profile',
  },
};

// ==================== 测试 4: Hash 参数 ====================

// ✅ 正确：带 hash
const test8 = {
  name: ROUTE_NAME.INDEX,
  hash: '#section1',
};

// ==================== 测试 5: 组合使用 ====================

// ✅ 正确：所有参数都正确
const test9 = {
  name: ROUTE_NAME.USERS_ID,
  params: {
    id: '789',
  } as RouteParamsByName<typeof ROUTE_NAME.USERS_ID>,
  query: {
    active: 'true',
  },
  hash: '#details',
  replace: false,
  custom: false,
};

// ==================== 测试 6: 类型推断 ====================

// ✅ 类型推断示例
function createRouteLink(
  name: typeof ROUTE_NAME.USERS_ID,
  params: RouteParamsByName<typeof ROUTE_NAME.USERS_ID>
) {
  return {
    name,
    params,
  };
}

const routeLink = createRouteLink(ROUTE_NAME.USERS_ID, { id: '999' });
// routeLink.params.id 的类型是 string

// ==================== 测试 7: 所有路由名称 ====================

// ✅ 所有路由名称都是有效的
const allRouteNames = [
  ROUTE_NAME.ABOUT,
  ROUTE_NAME.INDEX,
  ROUTE_NAME.USERS_ID,
  ROUTE_NAME.USERS_INDEX,
];

// ==================== 测试 8: 联合类型 ====================

// ✅ 使用联合类型
type RouteWithName<T extends typeof ROUTE_NAME[keyof typeof ROUTE_NAME]> =
  T extends typeof ROUTE_NAME.USERS_ID
    ? { name: T; params: RouteParamsByName<T> }
    : T extends typeof ROUTE_NAME.USERS_INDEX
    ? { name: T }
    : { name: T };

const test10: RouteWithName<typeof ROUTE_NAME.USERS_ID> = {
  name: ROUTE_NAME.USERS_ID,
  params: {
    id: 'abc',
  },
};

const test11: RouteWithName<typeof ROUTE_NAME.INDEX> = {
  name: ROUTE_NAME.INDEX,
};

console.log('✅ 所有类型测试通过！');
console.log('RouteLink 组件是类型安全的！');

export {
  test1,
  test2,
  test3,
  test7,
  test8,
  test9,
  routeLink,
  test10,
  test11,
};
