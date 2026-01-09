<script setup lang="ts">
import { RouteLink, ROUTE_NAME } from '../router/route.gen';

/**
 * RouteLink 使用示例
 *
 * 这个组件演示了如何使用类型安全的 RouteLink 组件
 */

// 示例 1: 不需要参数的路由
const routeNameWithoutParams = ROUTE_NAME.INDEX;
// const wrongParam = ROUTE_NAME.USERS_ID;

// 示例 2: 需要参数的路由
const userId = '123';

// 示例 3: 查询参数
const queryParams = { ref: 'homepage', tab: 'profile' };
</script>

<template>
  <div class="route-link-examples">
    <h2>RouteLink 使用示例</h2>

    <section class="example">
      <h3>1. 基础路由链接（无参数）</h3>
      <p>链接到首页（不需要参数）：</p>
      <RouteLink :name="ROUTE_NAME.INDEX" class="nav-link">
        首页
      </RouteLink>

      <p>链接到关于页面（不需要参数）：</p>
      <RouteLink :name="ROUTE_NAME.ABOUT" class="nav-link">
        关于我们
      </RouteLink>

      <p>链接到用户列表（不需要参数）：</p>
      <RouteLink :name="ROUTE_NAME.USERS_INDEX" class="nav-link">
        用户列表
      </RouteLink>
    </section>

    <section class="example">
      <h3>2. 带参数的路由链接</h3>
      <p>链接到用户详情页（需要 id 参数）：</p>
      <RouteLink :name="ROUTE_NAME.USERS_ID" :params="{ id: userId }" class="nav-link">
        查看用户 {{ userId }}
      </RouteLink>

      <!-- 类型错误示例（已注释）：
      <RouteLink :name="ROUTE_NAME.USERS_ID" class="nav-link">
        缺少必需参数 - 这会在 TypeScript 中报错
      </RouteLink>

      <RouteLink :name="ROUTE_NAME.USERS_ID" :params="{ wrong: 'param' }" class="nav-link">
        错误的参数名 - 这会在 TypeScript 中报错
      </RouteLink>
      -->
    </section>

    <section class="example">
      <h3>3. 带查询参数的路由链接</h3>
      <p>链接到用户详情页并带查询参数：</p>
      <RouteLink
        :name="ROUTE_NAME.USERS_ID"
        :params="{ id: userId }"
        :query="queryParams"
        class="nav-link"
      >
        查看用户 {{ userId }}（带查询参数）
      </RouteLink>

      <p>链接到首页并带 hash：</p>
      <RouteLink
        :name="ROUTE_NAME.INDEX"
        hash="#section1"
        class="nav-link"
      >
        首页（Section 1）
      </RouteLink>
    </section>

    <section class="example">
      <h3>4. 使用 RouterLink 的其他属性</h3>
      <p>使用 replace 模式：</p>
      <RouteLink
        :name="ROUTE_NAME.ABOUT"
        replace
        class="nav-link"
      >
        关于我们（replace）
      </RouteLink>

      <p>自定义 active class：</p>
      <RouteLink
        :name="ROUTE_NAME.INDEX"
        active-class="active-custom"
        exact-active-class="exact-active-custom"
        class="nav-link"
      >
        首页（自定义样式）
      </RouteLink>

      <p>使用 custom 模式（自定义渲染）：</p>
      <RouteLink
        :name="ROUTE_NAME.USERS_INDEX"
        custom
        v-slot="{ navigate, href, isExactActive }"
      >
        <a
          :href="href"
          @click="navigate"
          :class="['custom-link', { active: isExactActive }]"
        >
          用户列表（自定义渲染）
        </a>
      </RouteLink>
    </section>

    <section class="type-safety-info">
      <h3>类型安全特性</h3>
      <ul>
        <li>✅ <code>name</code> 属性会自动补全所有可用的路由名称</li>
        <li>✅ <code>params</code> 属性根据路由名称自动推导参数类型</li>
        <li>✅ 缺少必需参数时 TypeScript 会报错</li>
        <li>✅ 传递错误的参数名时 TypeScript 会报错</li>
        <li>✅ 参数类型会自动检查（string、number 等）</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.route-link-examples {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.example {
  margin-bottom: 2rem;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f9f9f9;
}

.example h3 {
  margin-top: 0;
  color: #333;
}

.nav-link {
  display: inline-block;
  padding: 0.5rem 1rem;
  margin: 0.25rem;
  background: #2196f3;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background 0.2s;
}

.nav-link:hover {
  background: #1976d2;
}

.custom-link {
  display: inline-block;
  padding: 0.5rem 1rem;
  margin: 0.25rem;
  background: #4caf50;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background 0.2s;
}

.custom-link:hover {
  background: #45a049;
}

.custom-link.active {
  background: #388e3c;
  font-weight: bold;
}

.type-safety-info {
  padding: 1.5rem;
  background: #e8f5e9;
  border-radius: 8px;
  border: 1px solid #4caf50;
}

.type-safety-info ul {
  list-style: none;
  padding: 0;
}

.type-safety-info li {
  padding: 0.5rem 0;
}

.type-safety-info code {
  background: #f5f5f5;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}
</style>
