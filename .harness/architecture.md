> Refines coding-chain behavior. Cannot skip chain agents or verification.

# Architecture Rules

## Stack
- Two-component system: Python stdlib backend (`scripts/usage_dashboard.py`, parent repo) + Vite + React 18 + TypeScript SPA (this repo) — *from-architecture-spec*
- Frontend ships as a pre-built static bundle; `dist/` is committed directly, no build step at launch time — *from-architecture-spec*
- Zero new runtime dependencies for end users — Node/npm needed only at dashboard dev/build time, never to run it (NFR-001) — *from-architecture-spec*

## Layering
- Three top-level tab components under `src/components/` (`UsageTab.tsx`, `TrackerTab.tsx`, `SwarmsTab.tsx`), switched by `App.tsx` on `location.hash` — *user-specified*
- `src/api.ts` centralizes all `fetch` calls and shared TS interfaces (`UsageData`, `TrackerRow`, `Swarm`) — *user-specified*

## Boundaries
- Frontend only talks to the backend via `/api/usage`, `/api/tracker`, `/api/swarms` (JSON over HTTP, proxied in dev) — no direct file/DB access from the SPA — *from-architecture-spec*

## Data
- No data store owned by this repo — presentation-only over backend JSON; backend re-parses local files fresh on every request, no caching layer — *from-architecture-spec*
