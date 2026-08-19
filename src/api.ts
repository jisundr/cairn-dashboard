export interface UsageSession {
  session_id: string
  timestamp: string | null
  models: string[]
  version: string
  cost: number
  unpriced_calls: number
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens: number
  cache_read_input_tokens: number
  calls: number
  // Per-session model-cost split and subagent/skill invocation counts —
  // added by this task's Step 0 (scripts/usage_dashboard.py), which stops
  // discarding this data before serialization instead of computing anything
  // new. Lets Task 8's ranking panels compute a Window-scoped (not just
  // All-time) breakdown client-side, ranked by real cost for by-model/
  // by-version and by real invocation count for by-subagent/by-skill.
  model_costs: Record<string, number>
  subagents: Record<string, number>
  skills: Record<string, number>
}

export interface RankedRow {
  cost?: number
  calls: number
  [key: string]: unknown
}

export interface UsageData {
  project: string
  generated: string
  totals: Record<string, number>
  sessions: UsageSession[]
  by_model: RankedRow[]
  by_version: RankedRow[]
  by_subagent: RankedRow[]
  by_skill: RankedRow[]
}

export interface TrackerRow {
  slug: string
  scope: string
  status: string
  milestone: string
  ticket: string
  [key: string]: string
}

export interface HistoryEntry {
  timestamp: string
  phase: string
  note: string
}

export interface Swarm {
  slug: string
  phase: string
  status: string
  handoff_to: string
  worktree: string
  branch: string
  key_info: string
  last_history: HistoryEntry | null
  recent_history: HistoryEntry[]
  history_count: number
  tmux_alive: boolean | null
  pane_tail: string[] | null
}

export const CHAIN_PHASES = ['PLAN', 'DOC-GATE', 'QA-RED', 'IMPLEMENT', 'QA-AUDIT', 'DOC-POST-IMPL', 'PUBLISH']

export async function fetchUsage(): Promise<UsageData> {
  const res = await fetch('/api/usage')
  return res.json()
}

export async function fetchTracker(): Promise<TrackerRow[]> {
  const res = await fetch('/api/tracker')
  return res.json()
}

export async function fetchSwarms(): Promise<Swarm[]> {
  const res = await fetch('/api/swarms')
  return res.json()
}
