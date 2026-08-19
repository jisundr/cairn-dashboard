import { useEffect, useState } from 'react'
import UsageTab from './components/UsageTab'
import TrackerTab from './components/TrackerTab'
import SwarmsTab from './components/SwarmsTab'

type Tab = 'usage' | 'tracker' | 'swarms'

function tabFromHash(): Tab {
  const hash = window.location.hash.replace('#', '').split('/')[0]
  if (hash === 'tracker' || hash === 'swarms') return hash
  return 'usage'
}

export default function App() {
  const [tab, setTab] = useState<Tab>(tabFromHash())

  useEffect(() => {
    const onHashChange = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
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
      <main>
        {tab === 'usage' && <UsageTab />}
        {tab === 'tracker' && <TrackerTab />}
        {tab === 'swarms' && <SwarmsTab />}
      </main>
    </div>
  )
}
