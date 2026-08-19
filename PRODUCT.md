# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React + TypeScript (static build, no server-side rendering). Committed build output (`dist/`), no build step required at runtime — decided in `docs/architecture/architecture-spec.md`.

## Users

Single persona: the cairn author, running cairn against their own projects. Local, single-user tool — no other audience.

## Product Purpose

A local web dashboard giving real-time visibility into Claude Code token usage/cost, cairn task-tracker state, and running Unattended coding-chain swarms — replacing manual inspection of session transcripts, `TRACKER.md`, and `tmux`/`STATE.md`.

## Positioning

Purpose-built for cairn's own file-based state: reads Claude Code session transcripts, `TRACKER.md`, and `STATE.md`/`HISTORY.md` directly, entirely local and read-only, zero dependencies. No generic analytics tool understands cairn's coding-chain phase model (`PLAN`/`QA-RED`/`IMPLEMENT`/etc.) or swarm liveness — this dashboard is the only surface that does.

## Operating Context

Launched via `/cairn-dashboard` (a cairn plugin command), runs as a single background process bound to `127.0.0.1`, backgrounded via a PID lockfile. The author opens it in a browser tab and leaves it running alongside their normal Claude Code work — checking in periodically rather than treating it as a primary workspace. Served by a stdlib-only Python backend (`scripts/usage_dashboard.py`) in the parent `cairn` repo; this repo (`cairn-dashboard`) is the frontend only.

## Capabilities and Constraints

- Three screens: Usage (token/cost visibility), Tracker (task state), Swarms (background coding-chain monitoring).
- Read-only throughout — no screen edits, deletes, or triggers anything; the dashboard observes state other cairn agents/commands change.
- Zero new runtime dependencies for end users (NFR-001) — this repo's build output is pre-built and committed; only whoever develops the dashboard needs Node/npm.
- Local-only, no auth (NFR-002) — single user, single machine, no login.
- Graceful degradation everywhere (NFR-003): missing `tmux` → "unknown" liveness, not a crash; missing `dashboard/dist/` → clear error; empty data → empty state.
- Polls its backend JSON APIs every 4 seconds for near-real-time updates — no push/websocket infrastructure.

## Brand Commitments

None binding. The existing inline-HTML dashboard (being replaced) had its own visual identity (parchment/cream light theme, green accent, dark mode) — explicitly **not** carried forward as a constraint; this redesign is a fresh visual direction, not a refinement of the old look.

## Evidence on Hand

- `docs/requirements/prd.md`, `user-stories.md`, `user-flows.md` (this repo) — confirmed functional requirements and user stories.
- `docs/architecture/architecture-spec.md` (this repo) — confirmed system architecture, no database, two-component split with the parent repo's Python backend.
- `docs/design/ux-spec.md` (this repo) — confirmed interaction behavior, screens, states, navigation model.
- The old inline dashboard's implementation (parent repo's `scripts/usage_dashboard.py`, pre-redesign) — functional precedent only (what data is shown), explicitly not visual precedent (see Brand Commitments above).

## Product Principles

1. Read-only observation — the dashboard never mutates cairn's state, only displays it.
2. Zero new dependencies for end users — the whole point of a "dashboard for a zero-dependency tool" is that it doesn't itself become a dependency.
3. Graceful degradation over hard failure — every missing/absent resource (tmux, dist/, task data) renders a clear state, never a crash.
4. Function over ornamentation — this is an internal dev tool checked periodically, not a marketing surface; clarity and speed of comprehension outrank visual flourish.

## Accessibility & Inclusion

No project-specific requirement established beyond standard web accessibility practice (semantic HTML, sufficient contrast, keyboard-operable tab navigation) — not treated as a hard constraint given the single-user, developer-tool context.
