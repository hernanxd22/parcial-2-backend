import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const SPA_BYPASS = (req) => {
  // Si el browser navega (F5/refresh), serví index.html
  // Si es una llamada API (axios), dejá que el proxy pase al backend
  if (req.headers.accept?.includes('text/html')) {
    return '/index.html'
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        bypass: SPA_BYPASS
      },
      '/usuarios': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        bypass: SPA_BYPASS
      },
      '/productos': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        bypass: SPA_BYPASS
      },
      '/categorias': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        bypass: SPA_BYPASS
      },
      '/ingredientes': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        bypass: SPA_BYPASS
      },
      '/pedidos': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        bypass: SPA_BYPASS
      },
      '/direcciones': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        bypass: SPA_BYPASS
      }
    }
  }
})