import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      // Configuration for working with Replit's reverse proxy
      path: '/@vite/hmr',
      clientPort: 80,
      host: 'localhost'
    },
    cors: true,
    // Add specific Replit host to allowed hosts
    strictPort: true,
    // Allow all hosts - this is needed when proxying through multiple services
    allowedHosts: true,
  },
  // Allow all hosts including Replit domain
  preview: {
    host: '0.0.0.0',
    port: 5000
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
