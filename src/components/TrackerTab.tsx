import { useEffect, useState } from 'react'
import { fetchTracker, type TrackerRow } from '../api'

type SubView = 'board' | 'roadmap'

const STATUSES = ['Idea', 'Groomed', 'In Progress', 'In Review', 'Blocked', 'Done']

function stageOf(status: string): string {
  const s = status.toLowerCase()
  if (s.startsWith('in progress')) return 'In Progress'
  if (s === 'in review') return 'In Review'
  if (s === 'blocked') return 'Blocked'
  if (s === 'done') return 'Done'
  if (s === 'groomed') return 'Groomed'
  return 'Idea'
}

export default function TrackerTab() {
  const [rows, setRows] = useState<TrackerRow[] | null>(null)
  const [sub, setSub] = useState<SubView>('board')

  useEffect(() => {
    let cancelled = false
    async function poll() {
      const result = await fetchTracker()
      if (!cancelled) setRows(result)
    }
    poll()
    const id = setInterval(poll, 4000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  if (!rows) return <div className="empty">Loading…</div>
  if (rows.length === 0) {
    return <div className="empty">No tasks tracked yet — run project-manager to decompose a PRD into docs/.tasks/TRACKER.md.</div>
  }

  return (
    <div>
      <div className="tabs" role="group" aria-label="Tracker view">
        <button aria-selected={sub === 'board'} onClick={() => setSub('board')}>Board</button>
        <button aria-selected={sub === 'roadmap'} onClick={() => setSub('roadmap')}>Roadmap</button>
      </div>
      {sub === 'board' ? (
        <div style={{ display: 'flex', gap: '1rem' }}>
          {STATUSES.map((status) => {
            const items = rows.filter((r) => stageOf(r.status) === status)
            return (
              <div key={status}>
                <h3>{status} ({items.length})</h3>
                {items.map((r) => (
                  <div key={r.slug}><strong>{r.slug}</strong> — {r.scope}</div>
                ))}
              </div>
            )
          })}
        </div>
      ) : (
        <div>
          {[...new Set(rows.map((r) => (r.milestone && r.milestone !== '—' ? r.milestone : 'Unsorted')))].map(
            (milestone) => (
              <div key={milestone}>
                <h3>{milestone}</h3>
                {rows
                  .filter((r) => (r.milestone && r.milestone !== '—' ? r.milestone : 'Unsorted') === milestone)
                  .map((r) => (
                    <div key={r.slug}><strong>{r.slug}</strong> — {r.scope}</div>
                  ))}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  )
}
