import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    chunkSizeWarningLimit: 1000, // Game data is large, expected
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        // Hearthlight: the round-based sibling game, served at /hearthlight/
        hearthlight: resolve(import.meta.dirname, 'hearthlight/index.html'),
      },
    },
  },
})
