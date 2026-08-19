---
target: cairn-dashboard mockup
total_score: 20
max_score: 36
na_heuristics: 10
p0_count: 2
p1_count: 2
timestamp: 2026-08-19T01-11-00Z
slug: docs-design-mockups-cairn-dashboard-mockup-html
---
# Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No freshness/polling indicator |
| 2 | Match System / Real World | 3 | Vocabulary tracks cairn's own state closely |
| 3 | User Control and Freedom | 3 | Tab/sub-tab switching, pane-tail toggle consistent |
| 4 | Consistency and Standards | 1 | Multiple design-system tokens not honored |
| 5 | Error Prevention | 3 | No destructive actions by design |
| 6 | Recognition Rather Than Recall | 3 | Swarm cards carry all context inline |
| 7 | Flexibility and Efficiency | 1 | Required URL-hash deep-linking unimplemented |
| 8 | Aesthetic and Minimalist Design | 3 | Clean but typography flattening hurts hierarchy |
| 9 | Error Recovery | 1 | No error/stale state rendered anywhere |
| 10 | Help and Documentation | n/a | Single-user local tool, no help system called for |

Total: 20/36 (56%) — Acceptable band.

# Design Specificity Verdict
Generic admin-dashboard skeleton; cairn-specificity lives in copy only, not visual language.
Pane-tail excerpt (live tmux output) renders in proportional font instead of .mono.
Roadmap has no connecting rail between station nodes.
Deterministic scan: 1 advisory (em-dash-overuse, 10 instances) — confirmed false positive,
matches existing scripts/usage_dashboard.py's own slug — scope separator convention.
Browser evidence unavailable (Chrome extension not connected).

# Priority Issues
[P0] Fabricated unapproved semantic color: .col-review uses #8757b0, not in design-system.md palette.
[P0] No focus-visible styling anywhere — design system requires it, keyboard nav unusable.
[P1] Typography hierarchy flattened: H1 16px vs spec 20px/700; section heads at Caption scale not H2.
[P1] Stat tile values off-token: 21.6px/600 vs spec's 16px/400.
[P2] No URL-hash routing despite ux-spec requiring it for refresh/deep-link support.

# Persona Red Flags
Alex: no hash-routing, no freshness indicator, no elapsed-time on stalled swarm, only HANDOFF NEEDED pill filled.
Sam: no focus-visible, tab targets ~30px vs 44px min, pane-toggle has no focus ring, bar-track has no ARIA.

# Minor Observations
task-card radius/padding off-token; roadmap has no rail; empty column bare "—" not spec copy;
#project path unlabeled; no Loading/Error/stale states represented.

# Questions to Consider
What if pane-tail used .mono? What if only Cost stayed large and others dropped to spec size?
