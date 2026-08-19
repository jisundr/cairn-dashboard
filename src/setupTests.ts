import '@testing-library/jest-dom'
import { vi } from 'vitest'

// @testing-library/dom's waitFor only auto-advances fake timers when it
// detects a global `jest` object (it checks `setTimeout._isMockFunction` /
// `setTimeout.clock` off of it) — Vitest doesn't expose one by default.
// Aliasing it here lets waitFor progress under vi.useFakeTimers() (used by
// UsageTab.test.tsx to pin the clock for deterministic period/anchor
// windows) instead of hanging until Vitest's own per-test timeout.
;(globalThis as unknown as { jest: typeof vi }).jest = vi
