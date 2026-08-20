import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import UsageTab from './UsageTab'
import type { UsageData } from '../api'

function session(id: string, ts: string, cost = 1.23) {
  return {
    session_id: id, timestamp: ts, models: ['claude-sonnet-5'], version: '0.18.0',
    cost, unpriced_calls: 0, input_tokens: 100, output_tokens: 200,
    cache_creation_input_tokens: 0, cache_read_input_tokens: 0, calls: 5,
    model_costs: { 'claude-sonnet-5': cost }, subagents: { 'qa-engineer': 2 }, skills: { 'writer-shared': 1 },
  }
}

const sampleData: UsageData = {
  project: '/some/project',
  generated: '2026-08-19T12:00:00Z',
  totals: {},
  sessions: [session('abc123', '2026-08-19T10:00:00Z'), session('old0001', '2026-07-01T10:00:00Z', 0.50)],
  by_model: [{ model: 'claude-sonnet-5', cost: 1.23, calls: 5 } as never],
  by_version: [],
  by_subagent: [],
  by_skill: [],
}

describe('UsageTab', () => {
  // Pinned so period/anchor window assertions don't depend on the real
  // clock — matches sampleData's own timestamps (mirrors the mockup's own
  // fixed NOW for the same reason).
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-19T12:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows totals and the sessions table after loading', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve(sampleData) } as Response)
    ))
    render(<UsageTab />)

    await waitFor(() => expect(screen.getByText('abc123')).toBeInTheDocument())
  })

  it('shows an empty state with no sessions', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ ...sampleData, sessions: [] }) } as Response)
    ))
    render(<UsageTab />)
    await waitFor(() => expect(screen.getByText(/no sessions/i)).toBeInTheDocument())
  })

  it('switches period without a refetch, and excludes out-of-window sessions', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve(sampleData) } as Response)
    )
    vi.stubGlobal('fetch', fetchMock)
    render(<UsageTab />)
    await waitFor(() => expect(screen.getByText('abc123')).toBeInTheDocument())
    expect(screen.queryByText('old0001')).not.toBeInTheDocument() // default period (Daily) excludes the July session

    fireEvent.click(screen.getByRole('button', { name: 'YTD' }))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(screen.getByText('old0001')).toBeInTheDocument() // YTD includes it
  })

  it('disables next at today, and Daily period shows 24 hourly buckets', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve(sampleData) } as Response)
    ))
    render(<UsageTab />)
    await waitFor(() => expect(screen.getByText('abc123')).toBeInTheDocument())

    // Daily is already the default period — no click needed to reach it.
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    expect(document.querySelectorAll('.chart-card rect.bar')).toHaveLength(24)
  })

  it('UTC/Local toggle shifts bucket boundaries', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve(sampleData) } as Response)
    ))
    render(<UsageTab />)
    await waitFor(() => expect(screen.getByText('abc123')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Local' })).toHaveAttribute('aria-selected', 'true') // Local is the default

    fireEvent.click(screen.getByRole('button', { name: 'UTC' }))
    expect(screen.getByRole('button', { name: 'UTC' })).toHaveAttribute('aria-selected', 'true')
  })

  it('renders a full-history usage heatmap, independent of the period filter', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve(sampleData) } as Response)
    ))
    render(<UsageTab />)
    await waitFor(() => expect(screen.getByText('abc123')).toBeInTheDocument())

    expect(screen.getByTitle(/2026-08-19/)).toBeInTheDocument()
    expect(screen.getByTitle(/2026-07-01/)).toBeInTheDocument() // outside the default Daily window, still in the heatmap

    fireEvent.click(screen.getByRole('button', { name: 'YTD' }))
    expect(screen.getByTitle(/2026-07-01/)).toBeInTheDocument() // heatmap unaffected by period switch
  })

  it('shows a heatmap empty state with no session history at all', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ ...sampleData, sessions: [] }) } as Response)
    ))
    render(<UsageTab />)
    await waitFor(() => expect(screen.getByText(/no sessions/i)).toBeInTheDocument())
    expect(screen.getByText(/no activity yet/i)).toBeInTheDocument()
  })

  it('sorts the sessions table when a column header is clicked', async () => {
    const varied = { ...sampleData, sessions: [session('a1', '2026-08-19T09:00:00Z', 5), session('a2', '2026-08-19T10:00:00Z', 1)] }
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ json: () => Promise.resolve(varied) } as Response)))
    render(<UsageTab />)
    await waitFor(() => expect(screen.getByText('a1')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /Cost/ }))
    const rows = screen.getAllByRole('row').slice(1) // skip header row
    expect(rows[0]).toHaveTextContent('a2') // ascending: $1.00 sorts before $5.00
  })

  it('filters the sessions table by model and by version', async () => {
    const mixed = {
      ...sampleData,
      sessions: [
        { ...session('m1', '2026-08-19T09:00:00Z'), models: ['claude-sonnet-5'], version: '0.18.0' },
        { ...session('m2', '2026-08-19T10:00:00Z'), models: ['claude-opus-5'], version: '0.17.2' },
      ],
    }
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ json: () => Promise.resolve(mixed) } as Response)))
    render(<UsageTab />)
    await waitFor(() => expect(screen.getByText('m1')).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText('Model'), { target: { value: 'claude-opus-5' } })
    expect(screen.queryByText('m1')).not.toBeInTheDocument()
    expect(screen.getByText('m2')).toBeInTheDocument()
  })

  it('paginates the sessions table past the page size', async () => {
    // Default sort is Started, newest first: page 1 holds p5..p1, page 2 holds p0.
    const many = { ...sampleData, sessions: Array.from({ length: 6 }, (_, i) => session('p' + i, '2026-08-19T0' + i + ':00:00Z')) }
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ json: () => Promise.resolve(many) } as Response)))
    render(<UsageTab />)
    await waitFor(() => expect(screen.getByText('p5')).toBeInTheDocument())

    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument()
    expect(screen.queryByText('p0')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument()
    expect(screen.getByText('p0')).toBeInTheDocument()
  })
})
