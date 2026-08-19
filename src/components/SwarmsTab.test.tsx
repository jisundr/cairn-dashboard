import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import SwarmsTab from './SwarmsTab'
import type { Swarm } from '../api'

const handoffSwarm: Swarm = {
  slug: '2026-08-19-my-slug',
  phase: 'HANDOFF NEEDED',
  status: 'waiting on a decision',
  handoff_to: 'qa-engineer',
  worktree: '/tmp/wt',
  branch: 'feature/my-slug',
  key_info: 'needs a human answer',
  last_history: { timestamp: '2026-08-19T10:00:00Z', phase: 'QA-RED', note: 'tests written' },
  recent_history: [
    { timestamp: '2026-08-19T10:00:00Z', phase: 'QA-RED', note: 'tests written' },
    { timestamp: '2026-08-19T09:30:00Z', phase: 'DOC-GATE', note: 'doc gate clean' },
  ],
  history_count: 3,
  tmux_alive: true,
  pane_tail: ['waiting for input...'],
}

const stalledSwarm: Swarm = {
  ...handoffSwarm,
  slug: '2026-08-19-other-slug',
  phase: 'IMPLEMENT',
  status: 'STALLED (2026-08-19T09:00:00Z) — no progress',
  pane_tail: null,
}

describe('SwarmsTab', () => {
  it('lists swarms in the left list without showing detail until selected', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve([handoffSwarm]) } as Response)
    ))
    render(<SwarmsTab />)
    await waitFor(() => expect(screen.getByText('2026-08-19-my-slug')).toBeInTheDocument())
    expect(screen.getByText(/select a swarm/i)).toBeInTheDocument()
    expect(screen.queryByText('feature/my-slug')).not.toBeInTheDocument()
  })

  it('opens the detail panel on click, showing branch/worktree/timeline/history', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve([handoffSwarm]) } as Response)
    ))
    render(<SwarmsTab />)
    await waitFor(() => expect(screen.getByText('2026-08-19-my-slug')).toBeInTheDocument())
    fireEvent.click(screen.getByText('2026-08-19-my-slug'))
    expect(screen.getByText('feature/my-slug')).toBeInTheDocument()
    expect(screen.getByText('/tmp/wt')).toBeInTheDocument()
    expect(screen.getByText('DOC-GATE')).toBeInTheDocument()
  })

  it('shows the pane tail only when the selected swarm is HANDOFF NEEDED', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve([handoffSwarm]) } as Response)
    ))
    render(<SwarmsTab />)
    await waitFor(() => expect(screen.getByText('2026-08-19-my-slug')).toBeInTheDocument())
    fireEvent.click(screen.getByText('2026-08-19-my-slug'))
    expect(screen.getByText('waiting for input...')).toBeInTheDocument()
  })

  it('shows the authoritative stalled badge only from STATE.md\'s own marker', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve([stalledSwarm]) } as Response)
    ))
    render(<SwarmsTab />)
    await waitFor(() => expect(screen.getByText('2026-08-19-other-slug')).toBeInTheDocument())
    fireEvent.click(screen.getByText('2026-08-19-other-slug'))
    expect(screen.getByText(/STALLED/)).toBeInTheDocument()
  })

  it('closing the detail panel deselects and returns to the empty state', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve([handoffSwarm]) } as Response)
    ))
    render(<SwarmsTab />)
    await waitFor(() => expect(screen.getByText('2026-08-19-my-slug')).toBeInTheDocument())
    fireEvent.click(screen.getByText('2026-08-19-my-slug'))
    expect(screen.getByText('feature/my-slug')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Close detail panel'))
    expect(screen.getByText(/select a swarm/i)).toBeInTheDocument()
    expect(screen.queryByText('feature/my-slug')).not.toBeInTheDocument()
  })

  it('defaults to Priority sort — Handoff Needed before a Running swarm', async () => {
    const runningSwarm: Swarm = { ...stalledSwarm, slug: '2026-08-19-running-slug', status: 'working' }
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve([runningSwarm, handoffSwarm]) } as Response)
    ))
    render(<SwarmsTab />)
    await waitFor(() => expect(screen.getByText('2026-08-19-running-slug')).toBeInTheDocument())
    const slugs = screen.getAllByText(/^2026-08-19-/).map((el) => el.textContent)
    expect(slugs.indexOf('2026-08-19-my-slug')).toBeLessThan(slugs.indexOf('2026-08-19-running-slug'))
  })

  it('shows an empty state with no swarms', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve([]) } as Response)
    ))
    render(<SwarmsTab />)
    await waitFor(() => expect(screen.getByText(/no unattended swarms/i)).toBeInTheDocument())
  })
})
