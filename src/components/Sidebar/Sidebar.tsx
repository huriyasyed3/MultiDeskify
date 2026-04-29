import { memo, useCallback, useState, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import type { AppEntry } from '../../types'
import { getDomain } from '../../utils/url'
import './Sidebar.css'

interface AppButtonProps {
  app: AppEntry
  isActive: boolean
  onSwitch: (id: string) => void
}

const AppButton = memo(({ app, isActive, onSwitch }: AppButtonProps) => {
  const [faviconSrc, setFaviconSrc] = useState<string | null>(null)

  const handleClick = useCallback(() => onSwitch(app.id), [app.id, onSwitch])

  useEffect(() => {
    const id = requestIdleCallback(() => {
      const domain = getDomain(app.url)
      setFaviconSrc(
        `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
      )
    })
    return () => cancelIdleCallback(id)
  }, [app.url])

  return (
    <li>
      <button
        className={`app-btn${isActive ? ' active' : ''}`}
        onClick={handleClick}
        aria-label={`Switch to ${app.name}`}
        aria-pressed={isActive}
      >
        {/* Tooltip — only visible on hover via CSS */}
        <span className="app-tooltip" role="tooltip">
          {app.name}
        </span>

        {/* Icon only — no text */}
        <div className="app-icon" aria-hidden="true">
          {faviconSrc ? (
            <img
              src={faviconSrc}
              alt=""
              width={24}
              height={24}
              onError={() => setFaviconSrc(null)}
            />
          ) : (
            <span>{app.emoji}</span>
          )}
        </div>
      </button>
    </li>
  )
})

AppButton.displayName = 'AppButton'

export default function Sidebar() {
  const apps         = useAppStore(s => s.apps)
  const activeId     = useAppStore(s => s.activeId)
  const switchApp    = useAppStore(s => s.switchApp)
  const setModalOpen = useAppStore(s => s.setModalOpen)

  const handleAdd = useCallback(
    () => setModalOpen(true),
    [setModalOpen]
  )

  return (
    <aside className="sidebar" aria-label="Application sidebar">

      {/* Logo mark at top */}
      <div className="sidebar-logo" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3"  y="3"  width="7" height="7" rx="1.5" />
          <rect x="14" y="3"  width="7" height="7" rx="1.5" />
          <rect x="3"  y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      </div>

      <div className="sidebar-divider" role="separator" />

      {/* App icons list */}
      <ul
        className="sidebar-app-list"
        role="list"
        aria-label="Apps"
      >
        {apps.map(app => (
          <AppButton
            key={app.id}
            app={app}
            isActive={app.id === activeId}
            onSwitch={switchApp}
          />
        ))}
      </ul>

      {/* Bottom — add button */}
      <div className="sidebar-bottom">
        <div className="sidebar-divider" role="separator" />
        <button
          className="add-btn"
          onClick={handleAdd}
          aria-label="Add new app (Ctrl+N)"
          title="Add new app"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <line x1="12" y1="5"  x2="12" y2="19" />
            <line x1="5"  y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </aside>
  )
}