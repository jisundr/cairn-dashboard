# User Stories: cairn-dashboard

## Metadata
- User Stories Version: v0.1
- Last Updated: 2026-08-19
- Derived From: docs/requirements/prd.md
- Author:
  - AI Tool: Claude Code
  - LLM Model: claude-sonnet-5
- Reviewed By:

---

## View usage and cost

**User Story**
As a cairn author, I want to see my Claude Code token usage and cost at a glance, so that I can track spend without reading raw transcripts.

**Acceptance Criteria**
- [ ] Usage tab shows total cost, tokens, calls, sessions, and cache-hit rate for the selected date range.
- [ ] The view updates within 4 seconds of new usage occurring (poll interval).
- [ ] A note is shown when one or more calls used a model with no pricing entry, distinct from the cost total.

**Edge Cases**
- No sessions in the selected range: stat grid shows zeroed values, chart/rankings show an empty state, not an error.
- A model absent from the pricing table: excluded from cost total, surfaced via the unpriced-calls note, not silently $0.

---

## View task tracker state

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

## Monitor running swarms

**User Story**
As a cairn author, I want to see my running Unattended coding-chain swarms, so that I know their status without manually checking `tmux` or `STATE.md`.

**Acceptance Criteria**
- [ ] Swarms tab lists only `Mode: Unattended` tasks — Attended tasks never appear here.
- [ ] Each swarm shows whether its `tmux` session is alive, dead, or unknown (tmux not installed).
- [ ] A bounded pane-tail excerpt is shown only when a swarm's phase is `HANDOFF NEEDED`.
- [ ] A "stalled" badge is shown only when `STATE.md`'s own `Status` field already carries the `STALLED (...)` marker — the dashboard never computes or declares this itself.
- [ ] An empty state is shown when no Unattended swarms are currently tracked.

**Edge Cases**
- No `docs/.tasks/` folder at all: empty state, not an error.
- `tmux` not installed on the machine running the dashboard: liveness shows "unknown" rather than false/dead.
- A swarm mid-chain but not yet stalled: shows the soft "no progress in Xm" hint only, never the authoritative stalled badge.

---
