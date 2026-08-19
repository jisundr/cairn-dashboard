# UX Specification: cairn-dashboard

## Metadata
- UX Specification Version: v0.4
- Last Updated: 2026-08-19
- Derived From: docs/requirements/prd.md, docs/requirements/user-flows.md
- Author:
  - AI Tool: Claude Code
  - LLM Model: claude-sonnet-5
- Reviewed By:

---

## User Personas
| Persona | Description | Primary Goal |
|---------|-------------|--------------|
| Cairn author | Single user, running cairn against their own projects | Quickly check usage/cost, task state, and running swarms without digging through raw files |

---

## User Journey
The cairn author launches the dashboard via `/cairn-dashboard`, lands on the Usage screen, and moves between three always-visible tabs — Usage, Tracker, Swarms — as their attention shifts between "what am I spending," "what's in progress," and "is my background swarm stuck." Each screen polls its own data every 4 seconds; the author never manually refreshes. The whole session is read-only observation — no screen lets the author edit, delete, or trigger anything; the dashboard is a window onto state that other cairn agents/commands change, not a control surface.

---

## Interaction Flows

```mermaid
flowchart TD
    Launch["Run /cairn-dashboard"] --> DistCheck{"dashboard/dist/\nexists?"}
    DistCheck -->|No| InitAttempt["Auto: git submodule\nupdate --init"]
    InitAttempt -->|Fails| LaunchError["Show error + fix instructions"]
    InitAttempt -->|Succeeds| Open["Browser opens, Usage tab active"]
    DistCheck -->|Yes| Open
    Open --> Usage["Usage screen"]
    Usage -->|Click Tracker tab| Tracker["Tracker screen"]
    Usage -->|Click Swarms tab| Swarms["Swarms screen"]
    Tracker -->|Click Swarms tab| Swarms
    Tracker -->|Click Usage tab| Usage
    Swarms -->|Click Usage tab| Usage
    Swarms -->|Click Tracker tab| Tracker
```

**Figure 1: Launch and top-level navigation**

```mermaid
flowchart TD
    UsageLoad["Usage tab active"] --> Fetch["GET /api/usage"]
    Fetch --> HasSessions{"Sessions in\nselected range?"}
    HasSessions -->|Yes| Render["Render stat grid, chart,\nrankings, sessions table"]
    HasSessions -->|No| EmptyRange["Show zeroed stats,\nempty chart/rankings/table"]
    Render --> RangeSwitch["Author switches date range"]
    RangeSwitch --> Recompute["Recompute client-side,\nno refetch"]
    Recompute --> Render
    Render --> Poll4s["4s poll tick"]
    Poll4s -->|Success| Render
    Poll4s -->|Fetch fails| Stale["Show stale-data indicator\non existing view"]
```

**Figure 2: Usage screen data flow**

```mermaid
flowchart TD
    SwarmsLoad["Swarms tab active"] --> FetchS["GET /api/swarms"]
    FetchS --> HasSwarms{"Any Mode:Unattended\ntasks?"}
    HasSwarms -->|No| EmptySwarms["Show empty state\n(list + detail panel)"]
    HasSwarms -->|Yes| List["Left list: each swarm's\nphase, tmux liveness, elapsed time"]
    List --> Selected{"Swarm\nselected?"}
    Selected -->|No| DetailEmpty["Right panel: 'Select a\nswarm to see details'"]
    Selected -->|Yes| Detail["Right panel: phase timeline,\nbranch, worktree, elapsed time,\nrecent-history log"]
    Detail --> CheckPhase{"Phase ==\nHANDOFF NEEDED?"}
    CheckPhase -->|Yes| PaneTail["Show pane-tail excerpt\ninline in detail panel"]
    CheckPhase -->|No| CheckStalled{"STATE.md Status\ncarries STALLED marker?"}
    CheckStalled -->|Yes| StalledBadge["Show authoritative\nstalled badge"]
    CheckStalled -->|No| SoftHint["Show soft 'no progress\nin Xm' hint if idle"]
```

**Figure 3: Swarms screen decision flow (list + detail)**

---

## Navigation Model
| From Screen | Action | Destination | Condition |
|-------------|--------|-------------|-----------|
| Any screen | Click "Usage" tab | Usage screen | Always available |
| Any screen | Click "Tracker" tab | Tracker screen | Always available |
| Any screen | Click "Swarms" tab | Swarms screen | Always available |
| Tracker screen | Click "Board" sub-tab | Tracker screen, Board view | Always available |
| Tracker screen | Click "Roadmap" sub-tab | Tracker screen, Roadmap view | Always available |
| Usage screen | Click a date-range button | Usage screen, recomputed | Always available |
| Swarms screen | Click a swarm in the left list | Swarms screen, detail panel opens/swaps on the right | Always available |
| Swarms screen | Click the detail panel's close control | Swarms screen, detail panel returns to empty state | Only when a swarm is selected |
| Swarms screen | Click a sort-order button | Swarms screen, list reorders | Always available |

Direct navigation via URL hash (`#usage`, `#tracker`, `#tracker/road`, `#swarms`) lands on the same screen/sub-view without going through the tab bar — supports refresh and shared links.

---

## Screen Specifications

### Usage
**Purpose:** Let the author see Claude Code token usage and cost at a glance (US-001).
**Accessible Roles:** Cairn author (sole persona) — always accessible, no gating.

**Primary Actions:**
| Action | Available To | System Response |
|--------|-------------|-----------------|
| Select a date range (Today / 7d / 30d / Month / All) | Cairn author | Stats, chart, and rankings recompute client-side against the already-fetched session list — no refetch (FR-007) |
| (passive) Wait for the 4s poll | Cairn author | View updates in place with new usage data, no visible reload |

**Permission Rules:**
| Element / Action | Role | Visibility |
|-----------------|------|------------|
| Entire screen | Cairn author | Always visible |

**States:**
- **Loading:** "Loading…" text shown only on the very first fetch, before any data has ever rendered.
- **Empty:** No sessions in the selected range — stat grid shows zeroed values, chart/rankings/sessions table each show their own empty-state message, never an error.
- **Error:** A poll fails after data has already rendered once — a stale-data indicator appears on the existing (last-good) view; the screen never clears to blank or crashes.
- **Success:** The rendered stat grid/chart/rankings/table *is* the success state — no separate confirmation affordance needed.

---

### Tracker
**Purpose:** Let the author see task-tracker state (Board and Roadmap) without opening `TRACKER.md` directly (US-002).
**Accessible Roles:** Cairn author (sole persona) — always accessible, no gating.

**Primary Actions:**
| Action | Available To | System Response |
|--------|-------------|-----------------|
| Switch between Board and Roadmap sub-tabs | Cairn author | Same already-fetched row data re-rendered grouped by Status (Board) or Milestone (Roadmap) |
| (passive) Wait for the 4s poll | Cairn author | Rows update in place if `TRACKER.md` changed |

**Permission Rules:**
| Element / Action | Role | Visibility |
|-----------------|------|------------|
| Entire screen | Cairn author | Always visible |

**States:**
- **Loading:** "Loading…" text shown only on the very first fetch.
- **Empty:** `TRACKER.md` doesn't exist or has no rows — a single empty-state message replaces both sub-views (Board/Roadmap sub-tabs hide until rows exist).
- **Error:** A poll fails after data has already rendered once — stale-data indicator, same as Usage.
- **Success:** The rendered Board/Roadmap itself is the success state.

---

### Swarms
**Purpose:** Let the author monitor running Unattended coding-chain swarms — full status without manually checking `tmux`/`STATE.md`, and without leaving the screen (US-003).
**Accessible Roles:** Cairn author (sole persona) — always accessible, no gating.
**Layout note:** Screen toolbar (sort order) + list + detail split (left: swarm list, right: detail panel) — see UI Layout Specification for structure.

**Primary Actions:**
| Action | Available To | System Response |
|--------|-------------|-----------------|
| Click a swarm in the left list | Cairn author | Selects it; right panel opens (or swaps) to show its phase timeline, branch, worktree, elapsed time, and recent-history log |
| Click the close control on the detail panel | Cairn author | Deselects the current swarm; right panel returns to the empty-state prompt |
| Select a sort order (Priority / Recent activity / Name) | Cairn author | List reorders client-side, no refetch — selection persists across polls |
| (passive) Wait for the 4s poll | Cairn author | List and (if selected) detail panel update in place — phase, liveness, badges, history recompute from fresh `STATE.md`/`HISTORY.md` reads; current sort order re-applied |

**Permission Rules:**
| Element / Action | Role | Visibility |
|-----------------|------|------------|
| Entire screen | Cairn author | Always visible |
| Detail panel content | Cairn author | Only rendered once a swarm is selected; empty-state prompt otherwise |
| Pane-tail excerpt (in detail panel) | Cairn author | Only for the selected swarm when its `phase == HANDOFF NEEDED` |
| Authoritative stalled badge | Cairn author | Only for swarms whose `STATE.md` `Status` already carries the `STALLED (...)` marker |
| Soft "no progress" hint | Cairn author | Only for swarms that are idle but not `STALLED`, `HANDOFF NEEDED`, or `PUBLISH` |

**States:**
- **Loading:** "Loading…" text shown only on the very first fetch.
- **Empty (no swarms):** No `Mode: Unattended` tasks exist — "No unattended swarms running." message spans the list; detail panel shows nothing to select.
- **Empty (no selection):** Swarms exist but none is selected — right panel shows "Select a swarm to see details."
- **Error:** A poll fails after data has already rendered once — stale-data indicator, same as Usage/Tracker.
- **Success:** The rendered list (and, once selected, detail panel) is the success state.

---

## Assumptions & Open Questions
**Assumptions:**
- Single persona, no auth, no role gating — every action and screen is visible to whoever opens the dashboard, consistent with Project Definition's local-only scope.
- The dashboard is read-only observation throughout — no screen provides an edit/delete/trigger action on any underlying data (transcripts, `TRACKER.md`, `STATE.md` are never written to by this application).

**Open Questions:**
- None — all 7 discovery dimensions were covered directly from already-approved requirements docs, with no new behavior introduced beyond what `prd.md`/`user-stories.md`/`user-flows.md` already specify.
