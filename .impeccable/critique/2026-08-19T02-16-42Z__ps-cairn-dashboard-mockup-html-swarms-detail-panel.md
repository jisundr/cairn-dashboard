---
target: Swarms detail panel
total_score: 6
max_score: 12
na_heuristics: 1,2,3,4,5,6,7,9
p0_count: 1
p1_count: 2
timestamp: 2026-08-19T02-16-42Z
slug: ps-cairn-dashboard-mockup-html-swarms-detail-panel
---
# Design Health Score (scoped: Swarms detail panel)

| Heuristic | Score | Key Issue |
|---|---|---|
| Visibility of System Status | 2 | Correct for Stalled; misleading for Handoff Needed |
| Recognition Rather Than Recall | 2 | 3 of 5 blocks unlabeled |
| Aesthetic and Minimalist Design | 2 | Stripped too much typographic contrast |

Total: 6/12 (50%) — Acceptable band (scoped subset, not full-page).

# Verdict
Panel displays required data but doesn't diagnose. HANDOFF NEEDED (most important state)
represented worst: no status pill in detail head, timeline falls back to wrong "current" step.

# Priority Issues
[P0] No status pill in detail head; timeline misrepresents HANDOFF NEEDED (shows last chain phase, not pause state).
[P1] Pane-tail not monospace despite being raw tmux output.
[P1] No section labels/dividers between timeline/meta/status blocks.
[P2] Branch/worktree/elapsed-time equal visual weight; only elapsed is a live signal.
[P2] History notes truncate with no way to see full text (nowrap+ellipsis, no title attr).
[P2] Soft hint uses undocumented --text-faint tier (~2.7:1 contrast) instead of confirmed --text-dim token.

# Minor Observations
Slugs not monospace despite design-system.md assignment; pane-tail has no max-height/scroll;
timeline flex-wrap could break raggedly on narrow viewports.
