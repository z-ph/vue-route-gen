<template>
  <div>
    <h1>{{ route.meta.title }}</h1>
    <p>This page tests route configuration override with block</p>
  </div>
</template>
<script setup lang="ts">
import { useRoute } from '@/router';

const route = useRoute('test')

</script>
<route>
{
  "path": "/custom-test-path",
  "name": "test",
  "alias": ["/test-alias", "/t"],
  "props": true,
  "meta": {
    "title": "Test Override",
    "layout": "admin",
    "requiresAuth": true,
    "roles": ["admin"]
  }
}
</route>
