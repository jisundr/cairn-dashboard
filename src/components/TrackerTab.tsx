import { useEffect, useState } from 'react'
import { fetchTracker, type TrackerRow } from '../api'

type SubView = 'board' | 'roadmap'

const STATUSES = ['Idea', 'Groomed', 'In Progress', 'In Review', 'Blocked', 'Done']

const STATUS_SLUG: Record<string, string> = {
  Idea: 'idea',
  Groomed: 'groomed',
  'In Progress': 'progress',
  'In Review': 'review',
  Blocked: 'blocked',
  Done: 'done',
}

function stageOf(status: string): string {
  const s = status.toLowerCase()
  if (s.startsWith('in progress')) return 'In Progress'
  if (s === 'in review') return 'In Review'
  if (s === 'blocked') return 'Blocked'
  if (s === 'done') return 'Done'
  if (s === 'groomed') return 'Groomed'
  return 'Idea'
}

function milestoneOf(r: TrackerRow): string {
  return r.milestone && r.milestone !== '—' ? r.milestone : 'Unsorted'
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

  // Ordered most-complete first (mirrors the roadmap's left-to-right progress
  // narrative), with "Unsorted" always last since it isn't a real milestone.
  const milestones = [...new Set(rows.map(milestoneOf))].sort((a, b) => {
    if (a === 'Unsorted') return 1
    if (b === 'Unsorted') return -1
    const doneFrac = (name: string) => {
      const group = rows.filter((r) => milestoneOf(r) === name)
      return group.filter((r) => stageOf(r.status) === 'Done').length / group.length
    }
    return doneFrac(b) - doneFrac(a)
  })

  return (
    <div>
      <div className="tabs" role="group" aria-label="Tracker view">
        <button aria-selected={sub === 'board'} onClick={() => setSub('board')}>Board</button>
        <button aria-selected={sub === 'roadmap'} onClick={() => setSub('roadmap')}>Roadmap</button>
      </div>
      {sub === 'board' ? (
        <div className="board">
          {STATUSES.map((status) => {
            const items = rows.filter((r) => stageOf(r.status) === status)
            return (
              <div key={status} className={`col col-${STATUS_SLUG[status]}`}>
                <h2>
                  <span className="name">{status}</span>
                  <span>{items.length}</span>
                </h2>
                {items.length === 0 ? (
                  <div className="empty">Nothing here yet.</div>
                ) : (
                  items.map((r) => (
                    <div key={r.slug} className="task-card">
                      {r.milestone && r.milestone !== '—' && (
                        <div className="milestone">{r.milestone}</div>
                      )}
                      <div className="slug">{r.slug}</div>
                      <div className="scope">{r.scope}</div>
                    </div>
                  ))
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rmap">
          {milestones.map((milestone, idx) => {
            const groupRows = rows.filter((r) => milestoneOf(r) === milestone)
            const doneCount = groupRows.filter((r) => stageOf(r.status) === 'Done').length
            const total = groupRows.length
            const isDone = total > 0 && doneCount === total
            const isActive = !isDone && doneCount > 0
            const filled = isDone || isActive
            const label = isDone ? 'Done' : isActive ? 'In progress' : 'Upcoming'
            const sortedRows = [...groupRows].sort((a, b) => {
              const aDone = stageOf(a.status) === 'Done' ? 0 : 1
              const bDone = stageOf(b.status) === 'Done' ? 0 : 1
              return aDone - bDone
            })
            const stationClass = [
              'rstation',
              isDone && 'done',
              isActive && 'active',
              filled && 'filled',
            ].filter(Boolean).join(' ')
            return (
              <div key={milestone} className={stationClass}>
                <div className="rnoderow">
                  <div className="node">{isDone ? '✓' : idx + 1}</div>
                </div>
                <div className="rname">
                  <span>{milestone}</span>
                  <span className="rcount">{doneCount}/{total} · {label}</span>
                </div>
                {sortedRows.map((r) => (
                  <div key={r.slug} className={`icard${stageOf(r.status) === 'Done' ? ' is-done' : ''}`}>
                    {r.slug} — {r.scope}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
