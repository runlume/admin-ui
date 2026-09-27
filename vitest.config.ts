import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/** 组件库的测试入口：jsdom + `@` 别名，与发布产物无关。 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/test/{unit,components}/**/*.{test,spec}.{ts,tsx}'],
    restoreMocks: true,
    clearMocks: true,
  },
})
