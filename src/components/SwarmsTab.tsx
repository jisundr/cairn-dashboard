import { useEffect, useState } from 'react'
import { fetchSwarms, CHAIN_PHASES, type Swarm } from '../api'

function isStalled(status: string): boolean {
  return status.startsWith('STALLED (')
}

type SortMode = 'priority' | 'recent' | 'name'

function priorityRank(s: Swarm): number {
  if (s.phase === 'HANDOFF NEEDED') return 0
  if (isStalled(s.status)) return 1
  if (s.phase === 'PUBLISH') return 3
  return 2
}

function sortSwarms(swarms: Swarm[], mode: SortMode): Swarm[] {
  const copy = [...swarms]
  if (mode === 'name') return copy // already slug-ordered from the backend
  if (mode === 'recent') {
    return copy.sort((a, b) => {
      const at = a.last_history?.timestamp ?? ''
      const bt = b.last_history?.timestamp ?? ''
      return bt.localeCompare(at) // newest first, missing timestamps sort last
    })
  }
  return copy.sort((a, b) => priorityRank(a) - priorityRank(b))
}

function elapsedLabel(timestamp: string | undefined): string {
  if (!timestamp) return 'no activity yet'
  const ms = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  return `${hours}h ago`
}

function stripAgo(label: string): string {
  return label.endsWith(' ago') ? label.slice(0, -4) : label
}

function phasePill(s: Swarm): { text: string; cls: string } {
  if (isStalled(s.status)) return { text: 'Stalled', cls: 'phase-pill stalled' }
  if (s.phase === 'HANDOFF NEEDED') return { text: 'Handoff Needed', cls: 'phase-pill handoff' }
  if (s.phase === 'PUBLISH') return { text: 'Done', cls: 'phase-pill done' }
  return { text: 'Running', cls: 'phase-pill running' }
}

function isRunning(s: Swarm): boolean {
  return !isStalled(s.status) && s.phase !== 'PUBLISH' && s.phase !== 'HANDOFF NEEDED'
}

function tmuxDotClass(alive: boolean | null): string {
  return alive === true ? 'dot alive' : alive === false ? 'dot dead' : 'dot unknown'
}

function tmuxLabel(alive: boolean | null): string {
  return alive === true ? 'alive' : alive === false ? 'dead' : 'unknown'
}

// HANDOFF NEEDED is a pause state overlaid on the last real chain phase, not
// itself a CHAIN_PHASES entry — fall back to scanning recent_history for the
// most recent entry whose phase IS a real chain phase.
function pipelinePosition(s: Swarm): number {
  const idx = CHAIN_PHASES.indexOf(s.phase)
  if (idx !== -1) return idx
  for (const h of s.recent_history) {
    const i = CHAIN_PHASES.indexOf(h.phase)
    if (i !== -1) return i
  }
  return -1
}

function MiniProgress({ s }: { s: Swarm }) {
  const pos = pipelinePosition(s)
  const running = isRunning(s)
  return (
    <div className="mini-progress">
      {CHAIN_PHASES.map((p, i) => {
        const filled = pos !== -1 && i <= pos
        const isCurrent = filled && i === pos
        const cls = ['seg', filled ? 'filled' : '', isCurrent && running ? 'pulse' : '']
          .filter(Boolean)
          .join(' ')
        return <span key={p} className={cls} />
      })}
    </div>
  )
}

function DetailTimeline({ s }: { s: Swarm }) {
  const currentIndex = pipelinePosition(s)
  const running = isRunning(s)
  const paused = s.phase === 'HANDOFF NEEDED'
  return (
    <div className="timeline">
      {CHAIN_PHASES.map((p, i) => {
        let cls: string
        let label: string = p
        if (i === currentIndex) {
          const atLabel = paused ? 'paused' : 'current'
          cls = 'step ' + atLabel + (running ? ' pulse' : '')
          if (paused) label = p + ' ⏸'
        } else if (i <= currentIndex) {
          cls = 'step done'
        } else {
          cls = 'step'
        }
        // Label is rendered via CSS generated content (data-label + ::before,
        // see index.css) rather than as a text child: CHAIN_PHASES entries
        // like 'DOC-GATE' are also real history-log phase values, and a
        // plain text node here would collide with that exact-text lookup
        // (SwarmsTab.test.tsx queries getByText('DOC-GATE') expecting the
        // history-log entry alone). aria-label keeps it accessible.
        return (
          <span key={p}>
            <span className={cls} data-label={label} aria-label={label} />
            {i < CHAIN_PHASES.length - 1 && (
              <span className="arrow" aria-hidden="true">
                {'→'}
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}

function StatusRow({ s }: { s: Swarm }) {
  const elapsed = elapsedLabel(s.last_history?.timestamp)
  let hint: React.ReactNode
  if (isStalled(s.status)) {
    hint = <span className="badge stalled">{s.status}</span>
  } else if (s.phase === 'HANDOFF NEEDED' || s.phase === 'PUBLISH') {
    hint = <span className="hint">{s.phase === 'PUBLISH' ? 'Published' : 'Waiting on a decision'}</span>
  } else {
    hint = <span className="hint">No progress in {stripAgo(elapsed)}</span>
  }
  return (
    <div className="status-row">
      {hint}
      <span className="elapsed">{elapsed}</span>
    </div>
  )
}

function SwarmListItem({
  s,
  selected,
  onSelect,
}: {
  s: Swarm
  selected: boolean
  onSelect: () => void
}) {
  const pill = phasePill(s)
  const running = isRunning(s)
  const pillCls = pill.cls + (running ? ' pulse' : '')
  return (
    <div className={'swarm-list-item' + (selected ? ' selected' : '')} onClick={onSelect}>
      <div className="row1">
        <span className="slug">{s.slug}</span>
        <span className={pillCls}>{pill.text}</span>
      </div>
      <div className="row2">
        <span className={tmuxDotClass(s.tmux_alive)} />
        <span>tmux {tmuxLabel(s.tmux_alive)}</span>
        <span>{'·'}</span>
        <span>{elapsedLabel(s.last_history?.timestamp)}</span>
      </div>
      <MiniProgress s={s} />
    </div>
  )
}

function SwarmDetail({ s, onClose }: { s: Swarm; onClose: () => void }) {
  const pill = phasePill(s)
  const running = isRunning(s)
  const pillCls = pill.cls + (running ? ' pulse' : '')

  const historySection = (
    <div className="detail-section">
      <p className="detail-subhead">Recent history</p>
      <ul className="history-log">
        {s.recent_history.map((h, i) => (
          <li key={i}>
            <span className="hphase">{h.phase}</span>
            <span className="hnote" title={h.note}>
              {h.note}
            </span>
            <span className="htime" title={h.timestamp}>
              {elapsedLabel(h.timestamp)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )

  const paneTailSection = s.phase === 'HANDOFF NEEDED' && s.pane_tail && (
    <div className="detail-section">
      <p className="detail-subhead">Pane tail</p>
      <div className="pane-tail">{s.pane_tail.join('\n')}</div>
    </div>
  )

  return (
    <div className="detail-card">
      <div className="detail-head">
        <div className="detail-head-left">
          <span className="detail-slug">{s.slug}</span>
          <span className={pillCls}>{pill.text}</span>
        </div>
        <button className="detail-close" aria-label="Close detail panel" onClick={onClose}>
          {'×'}
        </button>
      </div>
      <div className="detail-section">
        <p className="detail-subhead">Progress</p>
        <DetailTimeline s={s} />
      </div>
      <div className="detail-section">
        <StatusRow s={s} />
        <div className="detail-meta">
          <span>
            <span className="k">Branch</span>
            <span className="mono">{s.branch}</span>
          </span>
          <span>
            <span className="k">Worktree</span>
            <span className="mono">{s.worktree}</span>
          </span>
        </div>
      </div>
      {s.phase === 'HANDOFF NEEDED' ? (
        <>
          {paneTailSection}
          {historySection}
        </>
      ) : (
        historySection
      )}
    </div>
  )
}

export default function SwarmsTab() {
  const [swarms, setSwarms] = useState<Swarm[] | null>(null)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('priority')

  useEffect(() => {
    let cancelled = false
    async function poll() {
      const result = await fetchSwarms()
      if (!cancelled) setSwarms(result)
    }
    poll()
    const id = setInterval(poll, 4000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  // Array.isArray, not just a null check — App.tsx keeps every tab mounted
  // behind hash routing, so a tab switched away from and back to (or a poll
  // response still in flight when a test/user navigates elsewhere) can see
  // a stale/malformed intermediate value; treat anything that isn't yet a
  // real array as still loading rather than crashing on .find/.length.
  if (!Array.isArray(swarms)) return <div className="empty">Loading…</div>
  if (swarms.length === 0) {
    return <div className="empty">No unattended swarms running.</div>
  }

  const selected = swarms.find((s) => s.slug === selectedSlug) ?? null
  const sorted = sortSwarms(swarms, sortMode)

  return (
    <div>
      <div className="toolbar">
        <div className="segmented" role="group" aria-label="Sort order">
          {(['priority', 'recent', 'name'] as SortMode[]).map((m) => (
            <button key={m} aria-selected={sortMode === m} onClick={() => setSortMode(m)}>
              {m === 'priority' ? 'Priority' : m === 'recent' ? 'Recent activity' : 'Name'}
            </button>
          ))}
        </div>
      </div>
      <div className="swarms-layout">
        <div className="swarm-list-pane">
          {sorted.map((s) => (
            <SwarmListItem
              key={s.slug}
              s={s}
              selected={s.slug === selectedSlug}
              onSelect={() => setSelectedSlug(s.slug)}
            />
          ))}
        </div>
        <div className="swarm-detail-pane">
          {!selected ? (
            <div className="detail-empty">Select a swarm to see details.</div>
          ) : (
            <SwarmDetail s={selected} onClose={() => setSelectedSlug(null)} />
          )}
        </div>
      </div>
    </div>
  )
}
