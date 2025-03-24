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
    host: '0.0.0.0', // to make it accessible from outside the container
  },
  resolve: {
    alias: {
      // Add any path aliases if needed
      '@': path.resolve(__dirname, 'src'),
    },
  },
  define: {
    // Define any environment variables
    'process.env.API_URL': JSON.stringify(process.env.API_URL || 'http://localhost:3001'),
  },
});
