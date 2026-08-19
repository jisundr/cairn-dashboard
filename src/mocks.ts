// Dev-only fixture data — lets `npm run dev` render a populated, mockup-like
// dashboard instead of hitting the real local backend at 127.0.0.1:4756,
// which is often near-empty (0 sessions/tracker rows/swarms) on a dev
// machine and makes visual QA against the approved mockup hard. Shaped after
// UsageData/TrackerRow/Swarm (see ../api.ts) and the fixture patterns already
// used in UsageTab.test.tsx (`session()`/`sampleData`) and the approved
// mockup's own `SESSIONS` array (docs/cairn-dashboard/design/.mockups/
// cairn-dashboard-mockup.html) — never imported by production code paths,
// only by api.ts's dev-gated branch (see `shouldUseMocks()`).
import type { UsageData, UsageSession, TrackerRow, Swarm } from './api'

export function shouldUseMocks(): boolean {
  // MODE (not DEV) is the gate: Vitest also runs with import.meta.env.DEV
  // true (it sets MODE='test', which still counts as non-production), and
  // every component test relies on its own vi.stubGlobal('fetch', ...) —
  // gating on DEV alone would silently swallow those stubs under this
  // fixture data instead. MODE is 'development' only for `vite`/`npm run
  // dev`, and is statically replaced with the literal 'production' by `vite
  // build` (`tsc -b && vite build`), so this branch can't fire there either.
  // Opt out during local dev with `VITE_USE_MOCKS=false npm run dev` to
  // exercise the real backend instead.
  return import.meta.env.MODE === 'development' && import.meta.env.VITE_USE_MOCKS !== 'false'
}

function session(
  id: string,
  timestamp: string,
  opts: {
    version?: string
    calls?: number
    input?: number
    output?: number
    cacheRead?: number
    cacheCreate?: number
    modelCosts: Record<string, number>
    subagents?: Record<string, number>
    skills?: Record<string, number>
  },
): UsageSession {
  const models = Object.keys(opts.modelCosts)
  const cost = Object.values(opts.modelCosts).reduce((a, b) => a + b, 0)
  return {
    session_id: id,
    timestamp,
    models,
    version: opts.version ?? '0.18.0',
    cost,
    unpriced_calls: 0,
    input_tokens: opts.input ?? 150000,
    output_tokens: opts.output ?? 40000,
    cache_creation_input_tokens: opts.cacheCreate ?? 25000,
    cache_read_input_tokens: opts.cacheRead ?? 1200000,
    calls: opts.calls ?? 60,
    model_costs: opts.modelCosts,
    subagents: opts.subagents ?? {},
    skills: opts.skills ?? {},
  }
}

const MOCK_SESSIONS: UsageSession[] = [
  session('3fae21b0', '2026-08-20T07:12:00Z', {
    calls: 88, input: 210000, output: 62000, cacheRead: 1900000, cacheCreate: 40000,
    modelCosts: { 'claude-sonnet-5': 2.6, 'claude-haiku-4-5': 0.34 },
    subagents: { 'requirements-engineer': 5, 'qa-engineer': 3 }, skills: { 'writer-shared': 4 },
  }),
  session('9c02e77a', '2026-08-20T06:03:00Z', {
    calls: 54, input: 140000, output: 38000, cacheRead: 1100000, cacheCreate: 22000,
    modelCosts: { 'claude-sonnet-5': 1.61 },
    subagents: { 'qa-engineer': 4 }, skills: { 'writer-shared': 2 },
  }),
  session('1b88d4f1', '2026-08-19T16:47:00Z', {
    calls: 142, input: 380000, output: 95000, cacheRead: 3100000, cacheCreate: 70000,
    modelCosts: { 'claude-sonnet-5': 3.8, 'claude-opus-5': 0.4 },
    subagents: { 'software-engineer': 8, 'qa-auditor': 3 }, skills: { 'mermaid-diagrams': 5 },
  }),
  session('77af90cd', '2026-08-19T11:20:00Z', {
    version: '0.17.2', calls: 63, input: 165000, output: 44000, cacheRead: 1300000, cacheCreate: 26000,
    modelCosts: { 'claude-sonnet-5': 1.85 },
    subagents: { 'requirements-engineer': 2 },
  }),
  session('e41a90bb', '2026-08-15T09:00:00Z', {
    calls: 97, input: 260000, output: 71000, cacheRead: 2000000, cacheCreate: 48000,
    modelCosts: { 'claude-sonnet-5': 2.1, 'claude-opus-5': 1.2 },
    subagents: { 'solution-architect': 6 }, skills: { 'mermaid-diagrams': 3 },
  }),
  session('a205f61e', '2026-08-09T14:30:00Z', {
    version: '0.17.2', calls: 45, input: 118000, output: 30000, cacheRead: 900000, cacheCreate: 18000,
    modelCosts: { 'claude-sonnet-5': 1.4 },
    subagents: { 'software-engineer': 5 }, skills: { 'writer-shared': 3 },
  }),
  session('6d3c2b91', '2026-08-03T10:15:00Z', {
    version: '0.17.2', calls: 30, input: 78000, output: 19000, cacheRead: 560000, cacheCreate: 11000,
    modelCosts: { 'claude-sonnet-5': 0.95, 'claude-haiku-4-5': 0.15 },
    subagents: { 'qa-engineer': 3 },
  }),
  session('5f0e8a17', '2026-07-26T08:00:00Z', {
    version: '0.16.0', calls: 51, input: 140000, output: 52000, cacheRead: 800000, cacheCreate: 15000,
    modelCosts: { 'claude-opus-5': 2.85 },
    subagents: { 'documentation-auditor': 4 },
  }),
  session('c3d9f402', '2026-07-06T12:00:00Z', {
    version: '0.16.0', calls: 40, input: 105000, output: 27000, cacheRead: 620000, cacheCreate: 12000,
    modelCosts: { 'claude-sonnet-5': 1.1 },
    subagents: { 'codebase-auditor': 2 },
  }),
  session('82b1e0c5', '2026-06-21T09:30:00Z', {
    version: '0.15.0', calls: 18, input: 48000, output: 12000, cacheRead: 260000, cacheCreate: 5000,
    modelCosts: { 'claude-sonnet-5': 0.6 },
  }),
]

export const MOCK_USAGE_DATA: UsageData = {
  project: '~/projects/cairn',
  generated: '2026-08-20T08:00:00Z',
  totals: {},
  sessions: MOCK_SESSIONS,
  by_model: [],
  by_version: [],
  by_subagent: [],
  by_skill: [],
}

export const MOCK_TRACKER_ROWS: TrackerRow[] = [
  { slug: 'cli-export', scope: 'Export usage as CSV via a new CLI flag', status: 'Idea', milestone: '—', ticket: '' },
  { slug: 'notes-local-file', scope: 'Per-user gitignored .harness/notes.local.md', status: 'Groomed', milestone: 'v0.19 milestone', ticket: '' },
  { slug: 'dashboard-react-redesign', scope: 'Vite+React frontend, Swarms tab', status: 'In Progress', milestone: 'v0.19 milestone', ticket: '' },
  { slug: 'landing-page', scope: 'Marketing page for cairn plugin', status: 'In Progress', milestone: '—', ticket: '' },
  { slug: 'impeccable-vendor', scope: 'Waiting on marketplace approval', status: 'Blocked', milestone: '—', ticket: '' },
  { slug: 'swarms-tab-backend', scope: 'parse_state_md, discover_swarms, /api/swarms', status: 'Done', milestone: 'Foundation', ticket: '' },
  { slug: 'cairn-feedback', scope: 'Sanitized bug feedback flow', status: 'Done', milestone: 'Foundation', ticket: '' },
]

export const MOCK_SWARMS: Swarm[] = [
  {
    slug: 'dashboard-react-redesign',
    phase: 'HANDOFF NEEDED',
    status: 'Waiting on review',
    handoff_to: 'software-engineer',
    worktree: '/Users/dev/cairn/.worktrees/2026-08-19-cairn-dashboard-react-redesign',
    branch: 'feature/cairn-dashboard-react-redesign',
    key_info: 'Visual QA found the build does not match the approved mockup — styling pass in progress.',
    last_history: { timestamp: '2026-08-19T19:40:00Z', phase: 'QA-AUDIT', note: 'Flagged missing header/dark-mode/card styling vs mockup' },
    recent_history: [
      { timestamp: '2026-08-19T19:40:00Z', phase: 'QA-AUDIT', note: 'Flagged missing header/dark-mode/card styling vs mockup' },
      { timestamp: '2026-08-19T22:10:00Z', phase: 'IMPLEMENT', note: 'React SPA functional rebuild complete, tests green' },
      { timestamp: '2026-08-19T14:05:00Z', phase: 'QA-RED', note: 'Failing tests written for Usage/Tracker/Swarms tabs' },
    ],
    history_count: 9,
    tmux_alive: true,
    pane_tail: [
      '> software-engineer: applying design-system tokens to index.css',
      '> software-engineer: wiring dev-mode mock data layer',
      '> waiting for npm test / npm run build...',
    ],
  },
  {
    slug: 'notes-local-file',
    phase: 'IMPLEMENT',
    status: 'Running',
    handoff_to: 'qa-auditor',
    worktree: '/Users/dev/cairn/.worktrees/2026-08-18-notes-local-file',
    branch: 'feature/notes-local-file',
    key_info: 'Per-user gitignored .harness/notes.local.md',
    last_history: { timestamp: '2026-08-19T18:55:00Z', phase: 'IMPLEMENT', note: 'Adding .gitignore entry and loader' },
    recent_history: [
      { timestamp: '2026-08-19T18:55:00Z', phase: 'IMPLEMENT', note: 'Adding .gitignore entry and loader' },
      { timestamp: '2026-08-19T20:30:00Z', phase: 'QA-RED', note: 'Failing test written for notes loader' },
    ],
    history_count: 4,
    tmux_alive: true,
    pane_tail: null,
  },
  {
    slug: 'landing-page',
    phase: 'QA-RED',
    status: 'STALLED (no activity 3h)',
    handoff_to: 'software-engineer',
    worktree: '/Users/dev/cairn/.worktrees/2026-08-17-landing-page',
    branch: 'feature/landing-page',
    key_info: 'Marketing page for cairn plugin',
    last_history: { timestamp: '2026-08-19T16:10:00Z', phase: 'QA-RED', note: 'Failing tests written for hero + pricing sections' },
    recent_history: [
      { timestamp: '2026-08-19T16:10:00Z', phase: 'QA-RED', note: 'Failing tests written for hero + pricing sections' },
    ],
    history_count: 2,
    tmux_alive: false,
    pane_tail: null,
  },
  {
    slug: 'swarms-tab-backend',
    phase: 'PUBLISH',
    status: 'Done',
    handoff_to: '',
    worktree: '/Users/dev/cairn/.worktrees/2026-08-10-swarms-tab-backend',
    branch: 'feature/swarms-tab-backend',
    key_info: 'parse_state_md, discover_swarms, /api/swarms',
    last_history: { timestamp: '2026-08-12T18:00:00Z', phase: 'PUBLISH', note: 'PR merged, ticket closed' },
    recent_history: [
      { timestamp: '2026-08-12T18:00:00Z', phase: 'PUBLISH', note: 'PR merged, ticket closed' },
      { timestamp: '2026-08-12T15:20:00Z', phase: 'DOC-POST-IMPL', note: 'Doc audit clean' },
    ],
    history_count: 8,
    tmux_alive: null,
    pane_tail: null,
  },
]
