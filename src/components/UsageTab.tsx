import { useEffect, useMemo, useState } from 'react'
import { fetchUsage, type UsageData, type UsageSession, type RankedRow } from '../api'

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'ytd'
type Timezone = 'utc' | 'local'
type Granularity = 'hour' | 'day' | 'month'
interface Window { start: Date; end: Date; granularity: Granularity }

const PERIOD_LABELS: Record<Period, string> = {
  daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly', ytd: 'YTD',
}

function usd(n: number) { return '$' + n.toFixed(2) }
function fmt(n: number) { return Math.round(n).toLocaleString() }

function ymd(d: Date, tz: Timezone): [number, number, number] {
  return tz === 'utc'
    ? [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()]
    : [d.getFullYear(), d.getMonth(), d.getDate()]
}
function make(y: number, m: number, d: number, tz: Timezone): Date {
  return tz === 'utc' ? new Date(Date.UTC(y, m, d)) : new Date(y, m, d)
}
function startOfDay(d: Date, tz: Timezone): Date {
  const [y, m, day] = ymd(d, tz)
  return make(y, m, day, tz)
}
function addDays(d: Date, n: number, tz: Timezone): Date {
  return startOfDay(new Date(d.getTime() + n * 86400000), tz)
}
function dow(d: Date, tz: Timezone): number {
  return tz === 'utc' ? d.getUTCDay() : d.getDay()
}

function periodWindow(period: Period, anchor: Date, tz: Timezone, now: Date): Window {
  const day = startOfDay(anchor, tz)
  if (period === 'daily') return { start: day, end: day, granularity: 'hour' }
  if (period === 'weekly') {
    const mondayOffset = (dow(day, tz) + 6) % 7
    const start = addDays(day, -mondayOffset, tz)
    return { start, end: addDays(start, 6, tz), granularity: 'day' }
  }
  if (period === 'monthly') {
    const [y, m] = ymd(day, tz)
    return { start: make(y, m, 1, tz), end: make(y, m + 1, 0, tz), granularity: 'day' }
  }
  if (period === 'yearly') {
    const [y] = ymd(day, tz)
    return { start: make(y, 0, 1, tz), end: make(y, 11, 31, tz), granularity: 'month' }
  }
  const nowDay = startOfDay(now, tz)
  const [y] = ymd(nowDay, tz)
  return { start: make(y, 0, 1, tz), end: nowDay, granularity: 'day' }
}

function shiftAnchor(period: Period, anchor: Date, dir: 1 | -1, tz: Timezone): Date {
  const day = startOfDay(anchor, tz)
  if (period === 'daily') return addDays(day, dir, tz)
  if (period === 'weekly') return addDays(day, dir * 7, tz)
  if (period === 'monthly') { const [y, m] = ymd(day, tz); return make(y, m + dir, 1, tz) }
  if (period === 'yearly') { const [y] = ymd(day, tz); return make(y + dir, 0, 1, tz) }
  return day
}

function bucketKey(ts: string, granularity: Granularity, tz: Timezone): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  const [y, m, day] = ymd(d, tz)
  const hour = tz === 'utc' ? d.getUTCHours() : d.getHours()
  if (granularity === 'hour') return `${y}-${pad(m + 1)}-${pad(day)}T${pad(hour)}`
  if (granularity === 'month') return `${y}-${pad(m + 1)}`
  return `${y}-${pad(m + 1)}-${pad(day)}`
}

function bucketAxisLabel(key: string, granularity: Granularity): string {
  if (granularity === 'hour') return key.slice(-2) + ':00'
  if (granularity === 'month') return new Date(key + '-01').toLocaleDateString(undefined, { month: 'short' })
  return key.slice(5) // MM-DD
}

function zeroFillBuckets(win: Window, tz: Timezone): string[] {
  const keys: string[] = []
  if (win.granularity === 'hour') {
    for (let h = 0; h < 24; h++) keys.push(bucketKey(new Date(win.start.getTime() + h * 3600000).toISOString(), 'hour', tz))
    return keys
  }
  if (win.granularity === 'month') {
    let [y, m] = ymd(win.start, tz)
    while (make(y, m, 1, tz) <= win.end) { keys.push(`${y}-${String(m + 1).padStart(2, '0')}`); m += 1 }
    return keys
  }
  let d = win.start
  while (d <= win.end) { keys.push(bucketKey(d.toISOString(), 'day', tz)); d = addDays(d, 1, tz) }
  return keys
}

function sessionsInWindow(sessions: UsageSession[], win: Window): UsageSession[] {
  const endExclusive = win.end.getTime() + 86400000
  return sessions.filter((s) => {
    if (!s.timestamp) return false
    const t = new Date(s.timestamp).getTime()
    return t >= win.start.getTime() && t < endExclusive
  })
}

function anchorLabel(period: Period, win: Window): string {
  const opts: Intl.DateTimeFormatOptions = period === 'yearly' ? { year: 'numeric' }
    : period === 'monthly' ? { year: 'numeric', month: 'long' }
    : { year: 'numeric', month: 'short', day: 'numeric' }
  if (period === 'weekly') return `${win.start.toLocaleDateString(undefined, opts)} - ${win.end.toLocaleDateString(undefined, opts)}`
  if (period === 'ytd') return `${new Date().getFullYear()} to date`
  return win.start.toLocaleDateString(undefined, opts)
}

// Usage heatmap: GitHub-style calendar layout, but cells are colored by
// usage volume (tokens), not "contributions" — deliberately independent of
// period/anchor (always full history, like a profile page), re-bucketed only
// on the tz toggle. Adapted from maestro's renderHeatmap().
function totalSessionTokens(s: UsageSession): number {
  return s.input_tokens + s.output_tokens + s.cache_creation_input_tokens + s.cache_read_input_tokens
}

function levelFor(tokens: number, maxTokens: number): number {
  if (!tokens) return 0
  if (!maxTokens) return 1
  const ratio = tokens / maxTokens
  if (ratio > 0.75) return 4
  if (ratio > 0.5) return 3
  if (ratio > 0.25) return 2
  return 1
}

interface HeatmapCell { date: Date | null; tokens: number; cost: number }

function buildHeatmapWeeks(sessions: UsageSession[], tz: Timezone): HeatmapCell[][] {
  if (!sessions.length) return []
  const byDay: Record<string, { tokens: number; cost: number }> = {}
  sessions.forEach((s) => {
    if (!s.timestamp) return
    const key = bucketKey(s.timestamp, 'day', tz)
    const entry = byDay[key] || { tokens: 0, cost: 0 }
    entry.tokens += totalSessionTokens(s)
    entry.cost += s.cost
    byDay[key] = entry
  })
  const days = Object.keys(byDay).sort()
  if (!days.length) return []
  const firstYear = Number(days[0].slice(0, 4))
  const start = make(firstYear, 0, 1, tz)
  const end = startOfDay(new Date(days[days.length - 1]), tz)
  const startSunday = addDays(start, -dow(start, tz), tz)

  const weeks: HeatmapCell[][] = []
  let week: HeatmapCell[] = []
  for (let cursor = startSunday; cursor <= end; cursor = addDays(cursor, 1, tz)) {
    if (cursor < start) {
      week.push({ date: null, tokens: 0, cost: 0 })
    } else {
      const key = bucketKey(cursor.toISOString(), 'day', tz)
      const entry = byDay[key] || { tokens: 0, cost: 0 }
      week.push({ date: cursor, tokens: entry.tokens, cost: entry.cost })
    }
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length) { while (week.length < 7) week.push({ date: null, tokens: 0, cost: 0 }); weeks.push(week) }
  return weeks
}

// tz-aware day label — NOT cell.date.toISOString(), which always renders in
// UTC regardless of how the Date was constructed and would show the wrong
// calendar day for 'local' whenever the local UTC offset crosses midnight.
function dayLabel(d: Date, tz: Timezone): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const [y, m, day] = ymd(d, tz)
  return `${y}-${pad(m + 1)}-${pad(day)}`
}

// One label per week column — the month name where it first appears reading
// left to right, blank on every week already inside that month. Mirrors the
// mockup's per-day version of the same logic, collapsed to per-week since
// this is one label above each week's 7-cell column, not one per cell.
function heatmapMonthLabels(weeks: HeatmapCell[][], tz: Timezone): string[] {
  let lastMonth = -1
  return weeks.map((week) => {
    const first = week.find((c) => c.date)
    if (!first || !first.date) return ''
    const month = tz === 'utc' ? first.date.getUTCMonth() : first.date.getMonth()
    if (month === lastMonth) return ''
    lastMonth = month
    return first.date.toLocaleString('en-US', { month: 'short', timeZone: tz === 'utc' ? 'UTC' : undefined })
  })
}

// Ranking panel aggregation, client-side from the windowed `sessions` list —
// ranking panels always match the period/anchor window, same as the chart.
// model/version rank by real cost (UsageSession.model_costs/cost, from Task
// 7's Step 0) — calls is also summed for display but isn't the sort key.
// subagent/skill rank by real invocation count. Remaining approximation: a
// multi-model session's calls (not cost) are credited in full to every
// model it used, since a session has one `calls` total, not a per-model split.
type RankingDimension = 'model' | 'version' | 'subagent' | 'skill'
function aggregateSessions(sessions: UsageSession[], dimension: RankingDimension): RankedRow[] {
  if (dimension === 'model' || dimension === 'version') {
    const totals: Record<string, { cost: number; calls: number }> = {}
    const bump = (key: string, cost: number, calls: number) => {
      const row = totals[key] || { cost: 0, calls: 0 }
      row.cost += cost; row.calls += calls
      totals[key] = row
    }
    sessions.forEach((s) => {
      if (dimension === 'model') Object.entries(s.model_costs).forEach(([m, c]) => bump(m, c, s.calls))
      else bump(s.version, s.cost, s.calls)
    })
    return Object.entries(totals)
      .map(([key, v]) => ({ [dimension]: key, cost: v.cost, calls: v.calls }) as RankedRow)
      .sort((a, b) => (b.cost ?? 0) - (a.cost ?? 0))
  }
  const totals: Record<string, number> = {}
  const bump = (key: string, n: number) => { totals[key] = (totals[key] || 0) + n }
  sessions.forEach((s) => {
    const source = dimension === 'subagent' ? s.subagents : s.skills
    Object.entries(source).forEach(([k, v]) => bump(k, v))
  })
  return Object.entries(totals)
    .map(([key, calls]) => ({ [dimension]: key, calls }) as RankedRow)
    .sort((a, b) => b.calls - a.calls)
}

type SortKey = 'session_id' | 'timestamp' | 'models' | 'tokens' | 'calls' | 'cost' | 'version'
const PAGE_SIZE = 5
const SESSION_COLUMNS: [SortKey, string][] = [
  ['session_id', 'Session'], ['timestamp', 'Started'], ['models', 'Model(s)'],
  ['tokens', 'Tokens'], ['calls', 'Calls'], ['cost', 'Cost'], ['version', 'Version'],
]

export default function UsageTab() {
  const [data, setData] = useState<UsageData | null>(null)
  const [period, setPeriod] = useState<Period>('daily')
  const [anchor, setAnchor] = useState<Date>(new Date())
  const [tz, setTz] = useState<Timezone>('local')
  const [sortKey, setSortKey] = useState<SortKey>('timestamp')
  const [sortDir, setSortDir] = useState<1 | -1>(-1)
  const [filterModel, setFilterModel] = useState('all')
  const [filterVersion, setFilterVersion] = useState('all')
  const [page, setPage] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function poll() {
      const result = await fetchUsage()
      if (!cancelled) setData(result)
    }
    poll()
    const id = setInterval(poll, 4000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  useEffect(() => { setPage(0) }, [period, anchor, tz])

  const now = new Date()
  const win = useMemo(() => periodWindow(period, anchor, tz, now), [period, anchor, tz])
  const heatmapWeeks = useMemo(() => buildHeatmapWeeks(data?.sessions ?? [], tz), [data, tz])
  const heatmapMonths = useMemo(() => heatmapMonthLabels(heatmapWeeks, tz), [heatmapWeeks, tz])

  if (!data) return <div className="empty">Loading…</div>

  const sessions = sessionsInWindow(data.sessions, win)
  const totals = sessions.reduce(
    (acc, s) => {
      acc.cost += s.cost; acc.calls += s.calls; acc.unpriced_calls += s.unpriced_calls
      acc.input_tokens += s.input_tokens; acc.output_tokens += s.output_tokens
      acc.cache_creation_input_tokens += s.cache_creation_input_tokens; acc.cache_read_input_tokens += s.cache_read_input_tokens
      return acc
    },
    { cost: 0, calls: 0, unpriced_calls: 0, input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
  )
  const totalTokens = totals.input_tokens + totals.output_tokens + totals.cache_creation_input_tokens + totals.cache_read_input_tokens
  const cacheReadPlusInput = totals.cache_read_input_tokens + totals.input_tokens
  const cacheHit = cacheReadPlusInput > 0 ? (totals.cache_read_input_tokens / cacheReadPlusInput) * 100 : 0
  const buckets = zeroFillBuckets(win, tz)
  const byBucket: Record<string, number> = {}
  sessions.forEach((s) => {
    if (!s.timestamp) return
    const k = bucketKey(s.timestamp, win.granularity, tz)
    byBucket[k] = (byBucket[k] || 0) + s.cost
  })
  const max = Math.max(...buckets.map((b) => byBucket[b] || 0), 0.01)

  const earliestTs = data.sessions.reduce((min, s) => (s.timestamp && s.timestamp < min ? s.timestamp : min), data.sessions[0]?.timestamp ?? '')
  const prevDisabled = period === 'ytd' || (earliestTs !== '' && win.start <= new Date(earliestTs))
  const nextDisabled = period === 'ytd' || win.end >= startOfDay(now, tz)
  const maxDayTokens = Math.max(0, ...heatmapWeeks.flat().map((c) => c.tokens))

  const modelOptions = Array.from(new Set(sessions.flatMap((s) => s.models))).sort()
  const versionOptions = Array.from(new Set(sessions.map((s) => s.version))).sort()
  const filteredSessions = sessions.filter((s) =>
    (filterModel === 'all' || s.models.includes(filterModel)) &&
    (filterVersion === 'all' || s.version === filterVersion),
  )
  function sortValue(s: UsageSession): string | number {
    switch (sortKey) {
      case 'session_id': return s.session_id
      case 'timestamp': return s.timestamp ?? ''
      case 'models': return s.models.join(',')
      case 'tokens': return totalSessionTokens(s)
      case 'calls': return s.calls
      case 'cost': return s.cost
      case 'version': return s.version
    }
  }
  const sortedSessions = filteredSessions.slice().sort((a, b) => {
    const av = sortValue(a), bv = sortValue(b)
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sortDir
    return String(av).localeCompare(String(bv)) * sortDir
  })
  const totalPages = Math.max(1, Math.ceil(sortedSessions.length / PAGE_SIZE))
  const pageSessions = sortedSessions.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1))
    else { setSortKey(key); setSortDir(1) }
    setPage(0)
  }

  const rankings = {
    model: aggregateSessions(sessions, 'model'),
    version: aggregateSessions(sessions, 'version'),
    subagent: aggregateSessions(sessions, 'subagent'),
    skill: aggregateSessions(sessions, 'skill'),
  }

  return (
    <div>
      <div className="toolbar">
        <div className="segmented" role="group" aria-label="Period">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button key={p} aria-selected={period === p} onClick={() => setPeriod(p)}>{PERIOD_LABELS[p]}</button>
          ))}
        </div>
        {period !== 'ytd' && (
          <div className="anchor-nav" role="group" aria-label="Anchor navigation">
            <button className="icon-btn" aria-label="Previous" disabled={prevDisabled} onClick={() => setAnchor(shiftAnchor(period, anchor, -1, tz))}>‹</button>
            <span className="anchor-label tabular">{anchorLabel(period, win)}</span>
            <button className="icon-btn" aria-label="Next" disabled={nextDisabled} onClick={() => setAnchor(shiftAnchor(period, anchor, 1, tz))}>›</button>
            <button className="anchor-latest-btn" onClick={() => setAnchor(new Date())}>Latest</button>
          </div>
        )}
        <div className="segmented" role="group" aria-label="Timezone">
          <button aria-selected={tz === 'utc'} onClick={() => setTz('utc')}>UTC</button>
          <button aria-selected={tz === 'local'} onClick={() => setTz('local')}>Local</button>
        </div>
      </div>
      {/* Shown first within the content area (after the toolbar above, which
          is REG-2 and stays put) — the heatmap is static (full history) and
          doesn't respond to period/anchor, only to tz above it. */}
      <div className="card">
        <div className="head">Usage</div>
        {heatmapWeeks.length === 0 ? (
          <div className="empty">No activity yet.</div>
        ) : (
          <>
            <div className="heatmap-months">
              {heatmapMonths.map((m, i) => <span key={i} className="heatmap-month-label">{m}</span>)}
            </div>
            <div className="heatmap" role="img" aria-label="Usage heatmap">
              {heatmapWeeks.map((week, wi) => (
                <div key={wi} className="heatmap-week">
                  {week.map((cell, di) => {
                    if (!cell.date) return <div key={di} className="heatmap-cell heatmap-cell-empty" />
                    const lvl = levelFor(cell.tokens, maxDayTokens)
                    return (
                      <div
                        key={di}
                        className={`heatmap-cell${lvl ? ` level-${lvl}` : ''}`}
                        title={`${dayLabel(cell.date, tz)}: ${fmt(cell.tokens)} tokens, ${usd(cell.cost)}`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="stat-grid">
        <div className="stat"><div className="label">Cost</div><div className="value accent tabular">{usd(totals.cost)}</div></div>
        <div className="stat"><div className="label">Tokens</div><div className="value tabular">{fmt(totalTokens)}</div></div>
        <div className="stat"><div className="label">Calls</div><div className="value tabular">{fmt(totals.calls)}</div></div>
        <div className="stat"><div className="label">Sessions</div><div className="value tabular">{fmt(sessions.length)}</div></div>
        <div className="stat"><div className="label">Cache hit</div><div className="value tabular">{cacheHit.toFixed(1)}%</div></div>
      </div>
      {totals.unpriced_calls > 0 && (
        <div className="empty">{totals.unpriced_calls} call(s) used a model with no pricing entry — excluded from cost total.</div>
      )}
      <div className="card-grid">
        {([
          ['model', 'By model'], ['version', 'By cairn version'],
          ['subagent', 'Top subagents'], ['skill', 'Top skills'],
        ] as [RankingDimension, string][]).map(([dim, label]) => {
          const rows = rankings[dim]
          const metric = dim === 'model' || dim === 'version' ? 'cost' : 'calls'
          const rowMax = Math.max(...rows.map((r) => Number(r[metric] ?? 0)), 0.01)
          return (
            <div key={dim} className="card">
              <div className="head">{label}</div>
              {rows.length === 0 ? (
                <div className="empty">No data yet.</div>
              ) : (
                rows.slice(0, 4).map((row, i) => {
                  const value = Number(row[metric] ?? 0)
                  return (
                    <div key={i} className="rank-row">
                      <div className="name">{String(row[dim])}</div>
                      <div className="num tabular">{metric === 'cost' ? usd(value) : fmt(value)}</div>
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${((value / rowMax) * 100).toFixed(1)}%` }} /></div>
                    </div>
                  )
                })
              )}
            </div>
          )
        })}
      </div>
      <div className="card chart-card">
        <div className="head">Cost over time</div>
        <svg viewBox="0 0 700 150">
          {buckets.map((b, i) => {
            const value = byBucket[b] || 0
            const barW = Math.max(3, 700 / buckets.length - 4)
            const barH = Math.max(1, (value / max) * 130)
            const x = i * (barW + 4)
            const labelEvery = Math.max(1, Math.ceil(buckets.length / 8))
            return (
              <g key={b}>
                <rect className="bar" x={x} y={130 - barH} width={barW} height={barH}>
                  <title>{`${b}: ${usd(value)}`}</title>
                </rect>
                {i % labelEvery === 0 && (
                  <text className="axis" x={x + barW / 2} y={146} textAnchor="middle">{bucketAxisLabel(b, win.granularity)}</text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
      <div className="card">
        <div className="head">Sessions</div>
        {sessions.length === 0 ? (
          <div className="empty">No sessions in this window.</div>
        ) : (
          <>
            <div className="filters" role="group" aria-label="Sessions filter">
              <label htmlFor="filter-model">Model</label>
              <div className="select-wrap">
                <select id="filter-model" value={filterModel} onChange={(e) => { setFilterModel(e.target.value); setPage(0) }}>
                  <option value="all">All</option>
                  {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <label htmlFor="filter-version">Version</label>
              <div className="select-wrap">
                <select id="filter-version" value={filterVersion} onChange={(e) => { setFilterVersion(e.target.value); setPage(0) }}>
                  <option value="all">All</option>
                  {versionOptions.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
            {filteredSessions.length === 0 ? (
              <div className="empty">No sessions match this filter.</div>
            ) : (
              <>
                <table>
                  <thead>
                    <tr>
                      {SESSION_COLUMNS.map(([key, label]) => (
                        <th key={key}>
                          <button onClick={() => toggleSort(key)}>
                            {label}{sortKey === key ? (sortDir === 1 ? ' ▲' : ' ▼') : ''}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageSessions.map((s) => (
                      <tr key={s.session_id}>
                        <td>{s.session_id}</td>
                        <td>{s.timestamp ? new Date(s.timestamp).toLocaleString() : '?'}</td>
                        <td>{s.models.join(', ')}</td>
                        <td title={`Input: ${fmt(s.input_tokens)} · Output: ${fmt(s.output_tokens)} · Cache write: ${fmt(s.cache_creation_input_tokens)} · Cache read: ${fmt(s.cache_read_input_tokens)}`}>
                          {fmt(totalSessionTokens(s))}
                        </td>
                        <td>{fmt(s.calls)}</td>
                        <td>{usd(s.cost)}</td>
                        <td>{s.version}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sortedSessions.length > PAGE_SIZE && (
                  <div role="group" aria-label="Sessions pagination">
                    <button aria-label="Previous page" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
                    <span>Page {page + 1} of {totalPages} ({sortedSessions.length} rows)</span>
                    <button aria-label="Next page" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next ›</button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
