> Refines coding-chain behavior. Gates are additive only.

# Workflow Rules

## Branching
- Branch names: feature/<slug> — *user-specified*

## Commits / MR
- Conventional prefixes (`feat:`, `fix:`, `chore:`, `docs:`) — observed across this repo's commit history
- After building, commit `dist/` in `dashboard/` first, then in the parent repo `git add dashboard && git commit -m "chore: bump dashboard submodule pointer — <slug>"` — *user-specified*

## Gates (additive)
<!-- no convention observed -->
