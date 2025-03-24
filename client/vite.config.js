import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0', // accessible from outside the container
  },
  resolve: {
    alias: {
      // path aliases
      '@': path.resolve(__dirname, 'src'),
    },
  },
  define: {
    'process.env.API_URL': JSON.stringify(process.env.API_URL || 'http://localhost:3001'),
  },
});
