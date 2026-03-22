import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
    coverage: {
      thresholds: {
        statements: 35,    // мин. % покрытия строк кода
        branches: 35,      // мин. % проверки веток if/else/switch 
        functions: 35,     // мин. % вызывания ф-ий
        lines: 35
      }
    }
  }
})