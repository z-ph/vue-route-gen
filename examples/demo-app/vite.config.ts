import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { routeBlockPlugin } from '@zphhpzzph/vue-route-gen/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [routeBlockPlugin(), vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
