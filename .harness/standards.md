> Refines coding-chain behavior. Cannot skip chain agents or verification.

# Coding Standards

## Naming
- Tab components: PascalCase, one file per tab under `src/components/` — *user-specified*

## Error handling
- Graceful degradation over hard failure — missing/empty backend data renders a clear empty state, never a crash (NFR-003) — *from-architecture-spec*

## Testing
- Vitest + React Testing Library, run via `npm run test`; tests colocated as `<Name>.test.tsx` beside the component — *user-specified*
- Test environment pins `TZ=UTC` (in `vite.config.ts`) so date/time-bucketing assertions are deterministic — *user-specified*

## Logging
<!-- no convention observed -->
