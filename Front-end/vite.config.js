import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Cabeceras de seguridad para el servidor de dev/preview de Vite: el
// SecureHeadersMiddleware de Laravel solo cubre localhost:8000, y ZAP
// escanea también localhost:5173 (donde vive el HTML real que el usuario
// visita), así que necesitan aplicarse aquí por separado.
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    headers: securityHeaders,
  },
  preview: {
    headers: securityHeaders,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})