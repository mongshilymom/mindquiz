import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/app/', 
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/payment': 'http://localhost:3000',
      '/r': 'http://localhost:3000'
    }
  },
  build: {
    outDir: 'dist',
  },
})