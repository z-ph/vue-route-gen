<template>
  <div>
    <h1>{{ title }}</h1>
    <p>Viewing user: {{ id }}</p>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from '../../router/route.gen';
const route = useRoute();
const title = route.meta.title;
const id = route.params.id;
const roles = route.meta.roles
const requiresAuth = route.meta.requiresAuth
// 正常的脚本逻辑
const router = useRouter()
</script>
<route>
{
  "title": "User Detail",
  "layout": "admin",
  "requiresAuth": true,
  "roles": ["admin", "moderator"]
}
</route>
