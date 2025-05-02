import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      // Allow connections from Replit domain
      clientPort: 443,
      host: '0.0.0.0',
    },
    cors: true,
    // Add specific Replit host to allowed hosts
    strictPort: true,
    // Allow all hosts - this is needed when proxying through multiple services
    allowedHosts: 'all',
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
