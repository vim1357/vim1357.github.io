import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Custom domain (odokienko.ru) → served from root.
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  // Extra pages: the gradient generator at /gradient/, the club teaser at /untitled/.
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        gradient: 'gradient/index.html',
        untitled: 'untitled/index.html',
      },
    },
  },
})
