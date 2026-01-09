<template>
  <div>
    <h1>User Detail</h1>
    <p>Viewing user: {{ $route.params.id }}</p>
  </div>
</template>

<script setup lang="ts">
// 正常的脚本逻辑
</script>

<route>
{
  "title": "User Detail",
  "layout": "admin",
  "requiresAuth": true,
  "roles": ["admin", "moderator"]
}
</route>
