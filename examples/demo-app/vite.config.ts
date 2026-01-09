import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { routeBlockPlugin } from '@zphhpzzph/vue-route-gen/vite';

export default defineConfig({
  plugins: [
    routeBlockPlugin(),
    vue(),
  ],
});
