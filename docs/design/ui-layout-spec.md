# UI Layout Specification: cairn-dashboard

## Metadata
- UI Layout Specification Version: v0.1
- Last Updated: 2026-08-19
- Derived From: docs/design/ux-spec.md
- Author:
  - AI Tool: Claude Code
  - LLM Model: claude-sonnet-5
- Reviewed By:

---

## Global Regions
| Region ID | Region Name | Scope | Description |
|-----------|-------------|-------|-------------|
| REG-1 | Top Nav | Global | Tab bar (Usage / Tracker / Swarms), always visible, present on every screen |
| REG-2 | Screen Toolbar | Per-screen | Secondary controls specific to the active screen — Usage's date-range buttons, Tracker's Board/Roadmap sub-tabs. Absent on Swarms (no secondary controls). |
| REG-3 | Main Content Area | Per-screen | The screen's primary content, fills remaining vertical space below REG-1/REG-2 |

---

## Screen Layouts

### Usage
**Layout Pattern:** Dashboard (stacked sections)

**Layout Structure:**
```
Top Nav (REG-1)
Screen Toolbar (REG-2): date-range buttons
Main Content Area (REG-3)
  └ Stat Grid (cost, tokens, calls, sessions, cache-hit)
  └ Cost-over-time chart
  └ Ranking lists (by-model, by-version, by-subagent, by-skill)
  └ Sessions table
```

**Component Hierarchy:**
```
Usage Screen
 ├── TopNav (shared)
 ├── DateRangeToolbar
 │    └── RangeButton × 5 (Today, 7d, 30d, Month, All)
 └── MainContent
      ├── StatGrid
      │    └── StatTile × 5
      ├── CostChart
      ├── RankingSection × 4 (by-model, by-version, by-subagent, by-skill)
      │    └── RankRow × N
      └── SessionsTable
           └── SessionRow × N
```

**Responsive Behavior:**
| Breakpoint | Transformation |
|------------|----------------|
| Mobile | Stat grid stacks to 1 column, ranking sections stack vertically (no longer side-by-side), sessions table scrolls horizontally within its own container |
| Tablet | Stat grid reflows to 2-3 columns, ranking sections in 2-column grid |
| Desktop | Stat grid at full column count, ranking sections in 2×2 grid, sessions table full-width |

---

### Tracker
**Layout Pattern:** Kanban board (Board sub-view) / Grouped list (Roadmap sub-view)

**Layout Structure:**
```
Top Nav (REG-1)
Screen Toolbar (REG-2): Board / Roadmap sub-tabs
Main Content Area (REG-3)
  Board sub-view:
    └ Status columns (Idea, Groomed, In Progress, In Review, Blocked, Done)
        └ Task cards
  Roadmap sub-view:
    └ Milestone groups (rail/station layout)
        └ Task cards
```

**Component Hierarchy:**
```
Tracker Screen
 ├── TopNav (shared)
 ├── SubViewToolbar
 │    └── SubTabButton × 2 (Board, Roadmap)
 └── MainContent
      ├── (Board) BoardView
      │    └── StatusColumn × 6
      │         └── TaskCard × N
      └── (Roadmap) RoadmapView
           └── MilestoneStation × M
                └── TaskCard × N
```

**Responsive Behavior:**
| Breakpoint | Transformation |
|------------|----------------|
| Mobile | Board columns stack vertically (single column, scroll down instead of across); Roadmap stations stack vertically |
| Tablet | Board columns scroll horizontally (2-3 visible at once); Roadmap stations scroll horizontally |
| Desktop | Board columns all visible side-by-side (horizontal scroll only if more than fit); Roadmap stations laid out horizontally |

---

### Swarms
**Layout Pattern:** Card list

**Layout Structure:**
```
Top Nav (REG-1)
Main Content Area (REG-3)
  └ Swarm card × N (one per Mode:Unattended task)
      └ phase, branch, worktree, tmux liveness, stalled/hint badge
      └ expandable pane-tail excerpt (HANDOFF NEEDED only)
```

**Component Hierarchy:**
```
Swarms Screen
 ├── TopNav (shared)
 └── MainContent
      └── SwarmList
           └── SwarmCard × N
                ├── SwarmHeader (slug, phase)
                ├── SwarmMeta (branch, worktree, tmux liveness)
                ├── StatusBadge (stalled | soft-hint | none)
                └── PaneTailExcerpt (conditional: HANDOFF NEEDED only)
```

**Responsive Behavior:**
| Breakpoint | Transformation |
|------------|----------------|
| Mobile | Cards remain single-column full-width (already the desktop layout for this screen — no structural change needed) |
| Tablet | Same as mobile |
| Desktop | Same, optionally wider max-width cap on card container |

---

## Component Composition Summary
| Screen | Region | Component | Notes |
|--------|--------|-----------|-------|
| Usage | REG-1 | TopNav | Shared across all screens |
| Usage | REG-2 | DateRangeToolbar | 5 range buttons |
| Usage | REG-3 | StatGrid, CostChart, RankingSection ×4, SessionsTable | |
| Tracker | REG-1 | TopNav | Shared |
| Tracker | REG-2 | SubViewToolbar | Board/Roadmap toggle |
| Tracker | REG-3 | BoardView or RoadmapView | Mutually exclusive, one active at a time |
| Swarms | REG-1 | TopNav | Shared |
| Swarms | REG-3 | SwarmList | No REG-2 toolbar on this screen |

---

## Assumptions & Open Questions
**Assumptions:**
- Desktop-first: this is a local dev tool typically viewed in a wide browser window, but mobile/tablet breakpoints are still defined for robustness, not treated as the primary target.
- No component library or visual styling decided here — that's Design System's scope (not yet produced, tracked as an open item).

**Open Questions:**
- None structural — all 5 discovery dimensions covered. Visual styling (colors, typography, spacing) intentionally deferred to a future `design-system.md` pass.
