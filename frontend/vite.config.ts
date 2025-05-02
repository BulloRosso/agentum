import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Completely disable HMR for now - this will prevent the WebSocket error
    // but will require manual refresh for development changes
    hmr: false,
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
