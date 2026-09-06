import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Custom domain (odokienko.ru) → served from root.
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
})
