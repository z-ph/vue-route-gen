<template>
  <div>
    <h1>Users List</h1>
    <p>List of all users</p>
  </div>
</template>

<script setup lang="ts">
// 正常的脚本逻辑
</script>

<route>
{
  "title": "Users List",
  "layout": "admin",
  "requiresAuth": true,
  "roles": ["admin"]
}
</route>
