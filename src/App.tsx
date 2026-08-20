import { useEffect, useState } from 'react'
import UsageTab from './components/UsageTab'
import TrackerTab from './components/TrackerTab'
import SwarmsTab from './components/SwarmsTab'
import { fetchUsage } from './api'

type Tab = 'usage' | 'tracker' | 'swarms'

function tabFromHash(): Tab {
  const hash = window.location.hash.replace('#', '').split('/')[0]
  if (hash === 'tracker' || hash === 'swarms') return hash
  return 'usage'
}

export default function App() {
  const [tab, setTab] = useState<Tab>(tabFromHash())
  // Project path for the header — fetched once (not polled like the tabs'
  // own data) since it only changes if the dashboard is pointed at a
  // different project directory, which doesn't happen mid-session.
  const [project, setProject] = useState<string | null>(null)

  useEffect(() => {
    const onHashChange = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchUsage()
      .then((data) => { if (!cancelled) setProject(data.project ?? null) })
      .catch(() => { /* header project path is decorative — degrade to hidden, not an error */ })
    return () => { cancelled = true }
  }, [])

  function selectTab(next: Tab) {
    window.location.hash = next
    setTab(next)
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'usage', label: 'Usage' },
    { id: 'tracker', label: 'Tracker' },
    { id: 'swarms', label: 'Swarms' },
  ]

  return (
    <div>
      <header className="app-header">
        <h1 className="brand">Cairn <span className="brand-accent">Dashboard</span></h1>
        <div className="tabs" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => selectTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {project && <div className="project-path">{project}</div>}
        <span
          className="info-icon"
          tabIndex={0}
          role="button"
          aria-label="About this dashboard"
          title="Cairn Dashboard — a realtime local usage and task tracker for this project. Read-only; data refreshes automatically."
        >
          &#9432;
        </span>
      </header>
      <main>
        {tab === 'usage' && <UsageTab />}
        {tab === 'tracker' && <TrackerTab />}
        {tab === 'swarms' && <SwarmsTab />}
      </main>
    </div>
  )
}
