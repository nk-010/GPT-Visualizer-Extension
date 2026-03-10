import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin';
import hotReloadExtension from 'hot-reload-extension-vite';
import manifest from './manifest.json';

// https://vite.dev/config/
console.log('Building with NODE_ENV:', process.env.NODE_ENV);

export default defineConfig({
  plugins: [
    hotReloadExtension({
      log: true,
      backgroundPath: "background.js",
      sidePanel: {
        path: "src/",
        htmlPath: "index.html"
      }
    }),
    react(),
    crx({ manifest }),
  ],
  server: {
    cors: {
      origin: '*', // allows all origins
    },
    hmr: {
      origin: 'ws://localhost:5173',
    },
  },
})
