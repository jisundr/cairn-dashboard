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

function PhaseTimeline({ phase }: { phase: string }) {
  const currentIndex = CHAIN_PHASES.indexOf(phase)
  return (
    <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
      {CHAIN_PHASES.map((p, i) => (
        <span
          key={p}
          style={{
            fontWeight: i === currentIndex ? 700 : 400,
            opacity: currentIndex === -1 || i <= currentIndex ? 1 : 0.4,
          }}
        >
          {p}
          {i < CHAIN_PHASES.length - 1 ? ' → ' : ''}
        </span>
      ))}
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
      <div role="group" aria-label="Sort order" style={{ marginBottom: '.75rem' }}>
        {(['priority', 'recent', 'name'] as SortMode[]).map((m) => (
          <button key={m} aria-selected={sortMode === m} onClick={() => setSortMode(m)}>
            {m === 'priority' ? 'Priority' : m === 'recent' ? 'Recent activity' : 'Name'}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '1rem' }}>
      <div style={{ flex: '0 0 40%' }}>
        {sorted.map((s) => (
          <div
            key={s.slug}
            onClick={() => setSelectedSlug(s.slug)}
            style={{
              border: '1px solid #ddd', borderRadius: 8, padding: '.6rem .75rem',
              marginBottom: '.5rem', cursor: 'pointer',
              background: s.slug === selectedSlug ? '#f0f0f0' : undefined,
            }}
          >
            <div><strong>{s.slug}</strong> — {s.phase}</div>
            <div>
              tmux: {s.tmux_alive === true ? 'alive' : s.tmux_alive === false ? 'dead' : 'unknown'}
              {' · '}
              {elapsedLabel(s.last_history?.timestamp)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ flex: '1 1 60%' }}>
        {!selected ? (
          <div className="empty">Select a swarm to see details.</div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>{selected.slug}</h3>
              <button aria-label="Close detail panel" onClick={() => setSelectedSlug(null)}>×</button>
            </div>
            <PhaseTimeline phase={selected.phase} />
            <div>Branch: <span>{selected.branch}</span></div>
            <div>Worktree: <span>{selected.worktree}</span></div>
            <div>Last activity: {elapsedLabel(selected.last_history?.timestamp)}</div>
            {isStalled(selected.status) ? (
              <div style={{ color: 'red' }}>{selected.status}</div>
            ) : (
              selected.history_count > 0 &&
              selected.phase !== 'HANDOFF NEEDED' &&
              selected.phase !== 'PUBLISH' && <div style={{ color: '#888' }}>no progress hint (soft)</div>
            )}
            <h4>Recent history</h4>
            <ul>
              {selected.recent_history.map((h, i) => (
                <li key={i}><strong>{h.phase}</strong> — {h.note}</li>
              ))}
            </ul>
            {selected.phase === 'HANDOFF NEEDED' && selected.pane_tail && (
              <pre>{selected.pane_tail.join('\n')}</pre>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
