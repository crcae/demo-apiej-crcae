import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: { exclude: ['maplibre-gl'] },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
