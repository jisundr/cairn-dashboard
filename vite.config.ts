import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:4756',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    globals: true,
    // Usage tab defaults to Local timezone, and its date math reads the
    // Node process's local getters (getHours(), getDate(), etc.) — pinning
    // TZ=UTC makes 'local' behave identically to 'utc' in every test
    // environment (dev machine or CI), so UTC-timestamped fixtures stay
    // deterministic regardless of who/where the suite runs.
    env: { TZ: 'UTC' },
  },
})
