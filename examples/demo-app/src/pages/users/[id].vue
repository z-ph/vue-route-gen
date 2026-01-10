<template>
  <div>
    <h1>{{ route.meta.title }}</h1>
    <p>Viewing user: {{ route.params.id }}</p>
    <p>roles:{{ route.meta.roles }}</p>
    <p>requiresAuth:{{ route.meta.requiresAuth }}</p>
    <button @click="router.push({ name: 'index' })">去首页</button>
    <p>id:{{ props.id }}</p>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from '@/router';
const route = useRoute();
const router = useRouter()
const props = defineProps<{id:string}>()

</script>
<route>
{
  "props": true,
  meta:{
    "title": "User Detail",
    "layout": "admin",
    "requiresAuth": true,
    "roles": ["admin", "moderator"]
  }
}
</route>
