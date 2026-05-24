import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/usuarios': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/productos': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/categorias': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/pedidos': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/direcciones': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
