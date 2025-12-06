import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 5173, // Fixed port is required for Azure Redirect URI
    strictPort: true
  },
  plugins: [
    react(),
    electron({
      main: {
        // Shortcut of `build.lib.entry`
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['@google/genai'] // Externalize backend-only deps if used in main
            }
          }
        }
      },
      preload: {
        // Shortcut of `build.rollupOptions.input`
        input: 'electron/preload.ts',
      },
      // Optional: Use Node.js API in the Renderer-process
      renderer: {},
    }),
  ],
  define: {
    'process.env': process.env
  },
  // Ensure base path is correct for Electron file protocol loading
  base: './' 
});