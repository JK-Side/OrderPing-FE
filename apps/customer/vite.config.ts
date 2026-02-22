import path from 'node:path';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@order-ping/shared/styles': path.resolve(__dirname, '../../packages/shared/src/styles'),
    },
  },
});
