# User Stories: cairn-dashboard

## Metadata
- User Stories Version: v0.2
- Last Updated: 2026-08-19
- Derived From: docs/requirements/prd.md
- Author:
  - AI Tool: Claude Code
  - LLM Model: claude-sonnet-5
- Reviewed By:

---

## US-001 — View usage and cost

**Traces to:** FR-001, FR-004, FR-007

**User Story**
As a cairn author, I want to see my Claude Code token usage and cost at a glance, so that I can track spend without reading raw transcripts.

**Acceptance Criteria**
- [ ] Usage tab shows total cost, tokens, calls, sessions, and cache-hit rate for the selected date range.
- [ ] A cost-over-time chart renders for the selected range.
- [ ] By-model, by-version, by-subagent, and by-skill ranking lists each render, sorted descending by their respective metric.
- [ ] A sessions table lists individual sessions with their own cost/token/call figures.
- [ ] Author can switch the date range (Today / 7 days / 30 days / Month / All); stats, chart, and rankings recompute against the already-fetched session list — no refetch.
- [ ] The view updates within 4 seconds of new usage occurring (poll interval).
- [ ] A note is shown when one or more calls used a model with no pricing entry, distinct from the cost total.

**Edge Cases**
- No sessions in the selected range: stat grid shows zeroed values, chart/rankings/sessions table each show an empty state, not an error.
- A model absent from the pricing table: excluded from cost total, surfaced via the unpriced-calls note, not silently $0.

---

## US-002 — View task tracker state

**Traces to:** FR-002

**User Story**
As a cairn author, I want to see my task tracker's Board and Roadmap views, so that I know what's in progress without opening `TRACKER.md` directly.

**Acceptance Criteria**
- [ ] Board tab shows every `TRACKER.md` row grouped by its Status column.
- [ ] Roadmap tab groups rows by Milestone instead of Status.
- [ ] An empty state is shown when `TRACKER.md` doesn't exist or has no rows yet.

**Edge Cases**
- `TRACKER.md` missing entirely: empty state, not a server error.
- A row with no Milestone set: grouped under "Unsorted" on the Roadmap view.

---

## US-003 — Monitor running swarms

**Traces to:** FR-003

**User Story**
As a cairn author, I want to see my running Unattended coding-chain swarms, so that I know their status without manually checking `tmux` or `STATE.md`.

**Acceptance Criteria**
- [ ] Swarms tab lists only `Mode: Unattended` tasks — Attended tasks never appear here.
- [ ] Each swarm shows its phase, branch, and worktree path.
- [ ] Each swarm shows whether its `tmux` session is alive, dead, or unknown (tmux not installed).
- [ ] A bounded pane-tail excerpt is shown only when a swarm's phase is `HANDOFF NEEDED`.
- [ ] A "stalled" badge is shown only when `STATE.md`'s own `Status` field already carries the `STALLED (...)` marker — the dashboard never computes or declares this itself.
- [ ] A soft "no progress in Xm" hint is shown for a swarm with no recent `HISTORY.md` activity that isn't already `STALLED`, `HANDOFF NEEDED`, or `PUBLISH`.
- [ ] An empty state is shown when no Unattended swarms are currently tracked.

**Edge Cases**
- No `docs/.tasks/` folder at all: empty state, not an error.
- `tmux` not installed on the machine running the dashboard: liveness shows "unknown" rather than false/dead.
- A swarm mid-chain but not yet stalled: shows the soft "no progress in Xm" hint only, never the authoritative stalled badge.

---

## US-004 — CLI reports keep working

**Traces to:** FR-006

**User Story**
As `task-orchestrator` (consuming agent, not the human persona), I want the `--task-report`/`--window-report` CLI entry points to keep working unchanged, so that Publish Mode and Lightweight Finish can still generate PR/MR usage tables after the redesign.

**Acceptance Criteria**
- [ ] `python3 scripts/usage_dashboard.py --task-report <slug>` produces the same markdown table output as before the redesign.
- [ ] `python3 scripts/usage_dashboard.py --window-report <start> <end> [cwd]` produces the same markdown table output as before the redesign.
- [ ] Neither entry point depends on `dashboard/dist/` existing or the HTTP server running — both work standalone via direct script invocation, as today.

**Edge Cases**
- `dashboard/dist/` missing entirely: both CLI report modes still succeed, since they don't touch the frontend at all.

---
