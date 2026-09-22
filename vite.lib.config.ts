import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const packageJson = require('./package.json') as {
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}
const externalPackages = new Set([
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.peerDependencies ?? {}),
])

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
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
      cssFileName: 'styles',
    },
    rollupOptions: {
      external: (id) =>
        [...externalPackages].some(
          (dependency) => id === dependency || id.startsWith(`${dependency}/`),
        ),
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
})
