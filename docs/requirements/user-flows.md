# User Flows: cairn-dashboard

## Metadata
- User Flows Version: v0.1
- Last Updated: 2026-08-19
- Derived From: docs/requirements/prd.md
- Author:
  - AI Tool: Claude Code
  - LLM Model: claude-sonnet-5
- Reviewed By:

---

## Check usage and cost

**Actor:** Cairn author
**Trigger:** Opens the dashboard (via `/cairn-dashboard`) to check spend
**Goal:** See current token usage and cost for their project

**Happy Path**
1. Dashboard loads with the Usage tab active by default.
2. Stat grid, chart, and rankings render from the initial `/api/usage` fetch.
3. View auto-refreshes every 4 seconds as new usage occurs.
4. **End state:** Author sees up-to-date cost/token/session figures without leaving the browser tab.

**Alternate Paths**
- Author switches the date range (Today / 7 days / 30 days / Month / All): stats, chart, and rankings recompute client-side against the already-fetched session list.

**Error States**
- `/api/usage` fetch fails (server not running, network blip): UI shows a stale-data indicator on the existing view rather than freezing silently or clearing to blank.

---

## Check task tracker state

**Actor:** Cairn author
**Trigger:** Switches to the Tracker tab to see what's in progress
**Goal:** See current task states without opening `TRACKER.md`

**Happy Path**
1. Author clicks the Tracker tab.
2. Board sub-view renders `TRACKER.md` rows grouped by Status.
3. **End state:** Author sees every tracked task's current stage at a glance.

**Alternate Paths**
- Author switches to the Roadmap sub-view: same row data regrouped by Milestone instead of Status.

**Error States**
- `TRACKER.md` doesn't exist or has no rows: empty state shown ("No tasks tracked yet"), not an error page.

---

## Monitor running swarms

**Actor:** Cairn author
**Trigger:** Switches to the Swarms tab to check on a background Unattended run
**Goal:** See whether a swarm is progressing, paused, or stalled without checking `tmux`/`STATE.md` by hand

**Happy Path**
1. Author clicks the Swarms tab.
2. List of `Mode: Unattended` tasks renders with phase, branch, worktree, and tmux liveness per swarm.
3. **End state:** Author knows each swarm's current phase and whether it's alive.

**Alternate Paths**
- A swarm is at `HANDOFF NEEDED`: author expands its pane-tail excerpt for extra context on what it's paused on.

**Error States**
- No `docs/.tasks/` folder, or no Unattended tasks: empty state shown ("No unattended swarms running"), not an error.
- `dashboard/dist/` missing (submodule not initialized): `/cairn-dashboard` shows a clear error explaining the fix (`git submodule update --init`), never a blank page.

---
