import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const SPA_BYPASS = (req) => {
  if (req.headers.accept?.includes('text/html')) {
    return '/index.html'
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        bypass: SPA_BYPASS
      }
    }
  }
})
