<template>
  <div>
    <h1>Home Page</h1>
    <p>Welcome to the home page!</p>
    <button @click="router.push({path:'/t'})">test</button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from '@/router';

// 正常的脚本逻辑
const router = useRouter()
</script>

<!-- 独立的 route 块，用于定义路由元数据 -->
<route>
{
  meta:{
    "title": "Home",
    "layout": "default",
    "keepAlive": true,
    "requiresAuth": false
  }
}
</route>
