import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Phaser is about 1.2 MB minified. It's split into its own chunk and only
    // loaded on the I, Nephi page, so the default 500 kB warning is noise.
    chunkSizeWarningLimit: 1600,
  },
})
