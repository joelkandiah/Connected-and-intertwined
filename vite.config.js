import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Connected-and-intertwined/',
  build: {
    outDir: 'dist',
  }
})
