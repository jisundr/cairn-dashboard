// Imported from 'vitest/config' (not 'vite') so defineConfig's type includes
// the `test` field below — 'vite''s own defineConfig type doesn't know about
// Vitest's config extension, which would otherwise only surface as a `tsc -b`
// type error (Vite/Vitest itself don't type-check this file at runtime).
import { defineConfig } from 'vitest/config'
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
