---
target: Tracker tab
total_score: 6
max_score: 12
na_heuristics: 1,2,4,5,6,7,9,10
p0_count: 2
p1_count: 2
timestamp: 2026-08-19T03-05-38Z
slug: gn-mockups-cairn-dashboard-mockup-html-tracker-tab
---
# Design Health Score (scoped: Tracker tab)

| Heuristic | Score | Key Issue |
|---|---|---|
| Visibility of System Status | 2 | Status only in column header, not on card |
| Recognition Rather Than Recall | 3 | Roadmap numbered nodes invite misreading as sequence |
| Consistency and Standards | 1 | Far less status encoding than Swarms for the same card pattern |

Total: 6/12 (50%) — Acceptable band (scoped subset).

# Verdict
Tracker reads behind the redesigned Swarms tab. Status lives only in a small
column-header dot; Roadmap has no connecting rail (row of cards, not a progression).

# Priority Issues
[P0] Idea and In Review columns share identical gray dot (no .col-idea/.col-review rules; design-system.md only defines 4 of 6 semantic colors).
[P0] No status signal on the card itself, only in distant column header.
[P1] Roadmap has no connecting rail despite ui-layout-spec.md calling it a "rail/station layout."
[P1] "Done" encoded two different ways: Board = full strength, Roadmap = strikethrough+fade, same underlying task.
[P2] Card radius drifts 3 ways (task-card 8px, icard 6px, swarm-list-item 10px) vs design-system.md's single radius-lg spec.
[P3] Milestone label (10.24px) below design-system.md's documented Caption floor (11px).

# Minor Observations
Empty In Review column bypasses .empty's padding + copy convention (inline style override);
Roadmap node numbers unexplained; count badge/slug land between type-scale steps.
