import path from 'node:path';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@order-ping/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@styles': path.resolve(__dirname, '../../packages/shared/src/styles'),
    },
  },
});
