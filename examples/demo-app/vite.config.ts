import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { routeBlockPlugin,routeGenPlugin } from '@zphhpzzph/vue-route-gen/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [routeBlockPlugin(),routeGenPlugin(), vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
