import path from 'node:path';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@order-ping/shared/styles': path.resolve(__dirname, '../../packages/shared/src/styles'),
    },
  },
});
