import { useCallback } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { invoke } from '@tauri-apps/api/core'
import './Topbar.css'

export default function Topbar() {
  const apps      = useAppStore(s => s.apps)
  const activeId  = useAppStore(s => s.activeId)
  const removeApp = useAppStore(s => s.removeApp)
  const activeApp = apps.find(a => a.id === activeId) ?? null

  const handleRemove = useCallback(() => {
    if (!activeId) return
    if (window.confirm(`Remove "${activeApp?.name}"?`)) removeApp(activeId)
  }, [activeId, activeApp?.name, removeApp])

  const handleReload = useCallback(() => {
    if (!activeId) return
    const label = 'wv_' + activeId.replace(/[^a-zA-Z0-9]/g, '_')
    invoke('reload_app_webview', { label }).catch(console.error)
  }, [activeId])

  return (
    <header className="topbar">
      {activeApp ? (
        <>
          <div className="topbar-app-info">
            <span className="topbar-status-dot ready" />
            <span className="topbar-app-name" title={activeApp.name}>
              {activeApp.emoji} {activeApp.name}
            </span>
          </div>
          <div className="topbar-sep" />
          <div className="topbar-url-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span className="topbar-url-text">{activeApp.url}</span>
          </div>
          <div className="topbar-actions">
            <button
              className="topbar-icon-btn"
              onClick={handleReload}
              title="Reload"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
            <button
              className="topbar-icon-btn danger"
              onClick={handleRemove}
              title="Remove app"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          </div>
        </>
      ) : (
        <span className="topbar-empty">
          Select an app from the sidebar
        </span>
      )}
    </header>
  )
}