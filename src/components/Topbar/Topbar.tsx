import { useState, useCallback, useRef, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useAppStore } from '../../store/useAppStore'
import { validateAndNormalizeUrl } from '../../utils/url'
import './Topbar.css'

export function toLabel(appId: string, tabId: string): string {
  return 'wv_' + (appId + '_' + tabId).replace(/[^a-zA-Z0-9]/g, '_')
}

export default function Topbar() {
  const apps      = useAppStore(s => s.apps)
  const activeId  = useAppStore(s => s.activeId)
  const removeApp = useAppStore(s => s.removeApp)
  const renameApp = useAppStore(s => s.renameApp)
  const addTab    = useAppStore(s => s.addTab)
  const removeTab = useAppStore(s => s.removeTab)
  const switchTab = useAppStore(s => s.switchTab)

  const activeApp = apps.find(a => a.id === activeId) ?? null

  const [renaming,  setRenaming]  = useState(false)
  const [newName,   setNewName]   = useState('')
  const [addingTab, setAddingTab] = useState(false)
  const [tabUrl,    setTabUrl]    = useState('')
  const [urlError,  setUrlError]  = useState('')

  const nameRef = useRef<HTMLInputElement>(null)
  const urlRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renaming)  setTimeout(() => nameRef.current?.focus(), 50)
  }, [renaming])

  useEffect(() => {
    if (addingTab) setTimeout(() => urlRef.current?.focus(), 50)
  }, [addingTab])

  const startRename = useCallback(() => {
    if (!activeApp) return
    setNewName(activeApp.name)
    setRenaming(true)
  }, [activeApp])

  const submitRename = useCallback(() => {
    if (activeId && newName.trim()) renameApp(activeId, newName.trim())
    setRenaming(false)
  }, [activeId, newName, renameApp])

  const handleTabSwitch = useCallback((tabId: string) => {
    if (!activeId) return
    switchTab(activeId, tabId)
    const label = toLabel(activeId, tabId)
    invoke('show_app_webview', { label }).catch(console.error)
  }, [activeId, switchTab])

  const handleAddTab = useCallback(async () => {
    if (!activeId) return
    const result = validateAndNormalizeUrl(tabUrl)
    if (!result.ok) { setUrlError(result.error || 'Invalid URL'); return }
    const url   = result.normalizedUrl!
    const title = new URL(url).hostname.replace('www.', '')
    addTab(activeId, url, title)
    await new Promise(r => setTimeout(r, 50))
    const currentApp = useAppStore.getState().apps.find(a => a.id === activeId)
    if (!currentApp) return
    const newTab = currentApp.tabs[currentApp.tabs.length - 1]
    if (!newTab) return
    const label = toLabel(activeId, newTab.id)
    try {
      await invoke('create_app_webview', { payload: { id: activeId, url, label } })
      await invoke('show_app_webview', { label })
    } catch (err) { console.error('Tab create error:', err) }
    setAddingTab(false)
    setTabUrl('')
    setUrlError('')
  }, [activeId, tabUrl, addTab])

  const handleRemoveTab = useCallback(async (tabId: string) => {
    if (!activeId || !activeApp) return
    if (activeApp.tabs.length === 1) {
      if (window.confirm(`Remove "${activeApp.name}"?`)) {
        for (const tab of activeApp.tabs) {
          await invoke('destroy_app_webview', { label: toLabel(activeId, tab.id) }).catch(() => {})
        }
        removeApp(activeId)
      }
      return
    }
    await invoke('destroy_app_webview', { label: toLabel(activeId, tabId) }).catch(() => {})
    removeTab(activeId, tabId)
    const remaining = activeApp.tabs.filter(t => t.id !== tabId)
    if (remaining.length > 0) {
      const next = remaining[remaining.length - 1]
      switchTab(activeId, next.id)
      await invoke('show_app_webview', { label: toLabel(activeId, next.id) }).catch(console.error)
    }
  }, [activeId, activeApp, removeApp, removeTab, switchTab])

  const handleRemoveApp = useCallback(async () => {
    if (!activeId || !activeApp) return
    if (window.confirm(`Remove "${activeApp.name}" and all tabs?`)) {
      for (const tab of activeApp.tabs) {
        await invoke('destroy_app_webview', { label: toLabel(activeId, tab.id) }).catch(() => {})
      }
      removeApp(activeId)
    }
  }, [activeId, activeApp, removeApp])

  if (!activeApp) {
    return (
      <header className="topbar">
        <div className="topbar-row-1">
          <span className="tb-empty">Select an app from the sidebar</span>
        </div>
        <div className="topbar-row-2" />
      </header>
    )
  }

  return (
    <header className="topbar">

      {/* ── Row 1 — App info + Actions (52px) ─────────────── */}
      <div className="topbar-row-1">
        <div className="tb-app-info">
          <span className="tb-status-dot ready" />
          {renaming ? (
            <input
              ref={nameRef}
              className="tb-rename-input"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onBlur={submitRename}
              onKeyDown={e => {
                if (e.key === 'Enter')  submitRename()
                if (e.key === 'Escape') setRenaming(false)
              }}
            />
          ) : (
            <span
              className="tb-app-name"
              onDoubleClick={startRename}
              title="Double click to rename"
            >
              {activeApp.emoji} {activeApp.name}
            </span>
          )}
        </div>

        <div className="tb-actions">
          <button className="tb-btn" onClick={startRename} title="Rename">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button className="tb-btn danger" onClick={handleRemoveApp} title="Remove">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Row 2 — Tabs (28px) ────────────────────────────── */}
      <div className="topbar-row-2">
        <div className="tb-tabs">
          {activeApp.tabs.map(tab => (
            <div
              key={tab.id}
              className={`tb-tab${tab.id === activeApp.activeTabId ? ' active' : ''}`}
              onClick={() => handleTabSwitch(tab.id)}
            >
              <span className="tb-tab-title">{tab.title}</span>
              <button
                className="tb-tab-close"
                onClick={e => { e.stopPropagation(); handleRemoveTab(tab.id) }}
                aria-label="Close tab"
              >×</button>
            </div>
          ))}

          {addingTab ? (
            <div className="tb-tab-add-form">
              <input
                ref={urlRef}
                className={`tb-tab-url-input${urlError ? ' error' : ''}`}
                placeholder="https://..."
                value={tabUrl}
                onChange={e => { setTabUrl(e.target.value); setUrlError('') }}
                onKeyDown={e => {
                  if (e.key === 'Enter')  handleAddTab()
                  if (e.key === 'Escape') { setAddingTab(false); setTabUrl('') }
                }}
              />
              <button className="tb-tab-add-go" onClick={handleAddTab}>Go</button>
              {urlError && <span className="tb-tab-error">{urlError}</span>}
            </div>
          ) : (
            <button
              className="tb-add-tab-btn"
              onClick={() => setAddingTab(true)}
              title="Add new tab"
            >+</button>
          )}
        </div>
      </div>

    </header>
  )
}