import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

beforeEach(() => {
  window.location.hash = ''
  vi.stubGlobal('fetch', vi.fn(() =>
    Promise.resolve({ json: () => Promise.resolve({}) } as Response)
  ))
})

describe('App', () => {
  it('renders the Usage tab by default and switches tabs on click', () => {
    render(<App />)
    expect(screen.getByRole('tab', { name: 'Usage' })).toHaveAttribute('aria-selected', 'true')

    fireEvent.click(screen.getByRole('tab', { name: 'Swarms' }))
    expect(screen.getByRole('tab', { name: 'Swarms' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Usage' })).toHaveAttribute('aria-selected', 'false')
  })
})
