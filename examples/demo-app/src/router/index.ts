import { createRouter, createWebHistory } from "vue-router";
import routes from "./route.gen";
export const router = createRouter({
  history: createWebHistory('/'),
  routes,
});