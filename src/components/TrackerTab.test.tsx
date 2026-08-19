import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import TrackerTab from './TrackerTab'
import type { TrackerRow } from '../api'

const rows: TrackerRow[] = [
  { slug: 'task-a', scope: 'Do a thing', status: 'In Progress: IMPLEMENT', milestone: 'M1', ticket: '—' },
  { slug: 'task-b', scope: 'Do another thing', status: 'Done', milestone: '—', ticket: '—' },
]

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() =>
    Promise.resolve({ json: () => Promise.resolve(rows) } as Response)
  ))
})

describe('TrackerTab', () => {
  it('shows the Board grouped by status', async () => {
    render(<TrackerTab />)
    await waitFor(() => expect(screen.getByText('task-a')).toBeInTheDocument())
    expect(screen.getByText('task-b')).toBeInTheDocument()
  })

  it('switches to the Roadmap sub-view grouped by milestone', async () => {
    render(<TrackerTab />)
    await waitFor(() => expect(screen.getByText('task-a')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Roadmap' }))
    expect(screen.getByText('M1')).toBeInTheDocument()
  })

  it('shows an empty state with no rows', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve([]) } as Response)
    ))
    render(<TrackerTab />)
    await waitFor(() => expect(screen.getByText(/no tasks tracked/i)).toBeInTheDocument())
  })
})
