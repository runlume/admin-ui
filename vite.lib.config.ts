import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  publicDir: false,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist-package',
    lib: {
      entry: fileURLToPath(new URL('./src/admin-ui.ts', import.meta.url)),
      formats: ['es'],
      fileName: 'index',
      cssFileName: 'styles',
    },
    rollupOptions: {
      external: (id) =>
        id === 'i18next' ||
        id === 'react' ||
        id === 'react-dom' ||
        id === 'react-i18next' ||
        id.startsWith('react/'),
    },
  },
})
