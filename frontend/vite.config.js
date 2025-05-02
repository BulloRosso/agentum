import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on all interfaces to make the server accessible
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    
    // Disable HMR WebSocket to prevent console errors
    hmr: false,
    
    watch: {
      // Reduce file system polling to decrease CPU usage
      usePolling: false,
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});