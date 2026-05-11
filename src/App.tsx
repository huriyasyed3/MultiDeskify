import { Suspense, lazy, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useAppStore } from './store/useAppStore'
import Sidebar from './components/Sidebar/Sidebar'
import Topbar from './components/Topbar/Topbar'
import WebviewStage from './components/WebviewStage/WebviewStage'
import { toLabel } from './components/Topbar/Topbar'

const AddAppModal = lazy(() => import('./components/AddAppModal/AddAppModal'))

// Get exact layout measurements from rendered DOM
function getLayoutMeasurements() {
  const sidebar = document.querySelector('.sidebar') as HTMLElement
  const topbar  = document.querySelector('.topbar')  as HTMLElement
  return {
    sidebarWidth: sidebar?.offsetWidth  ?? 68,
    topbarHeight: topbar?.offsetHeight  ?? 80,
  }
}

export default function App() {
  const isModalOpen  = useAppStore(s => s.isModalOpen)
  const apps         = useAppStore(s => s.apps)
  const activeId     = useAppStore(s => s.activeId)
  const switchApp    = useAppStore(s => s.switchApp)
  const setModalOpen = useAppStore(s => s.setModalOpen)

  // ── Get active webview label ───────────────────────────────
  const getActiveLabel = useCallback(() => {
    if (!activeId) return null
    const app = apps.find(a => a.id === activeId)
    if (!app || !app.activeTabId) return null
    return toLabel(activeId, app.activeTabId)
  }, [activeId, apps])

  // ── Sync active webview position ───────────────────────────
  const syncPosition = useCallback(() => {
    const label = getActiveLabel()
    if (!label) return

    const { sidebarWidth, topbarHeight } = getLayoutMeasurements()

    invoke('sync_webview_position', {
      label,
      sidebarWidth,
      topbarHeight,
    }).catch(() => {})
  }, [getActiveLabel])

  // ── Keyboard shortcuts ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return

      const mod = e.ctrlKey || e.metaKey

      // Ctrl/Cmd + 1-9: Switch to app by index
      if (mod && /^[1-9]$/.test(e.key)) {
        e.preventDefault()
        const app = apps[parseInt(e.key) - 1]
        if (app) switchApp(app.id)
      }

      // Ctrl/Cmd + N: Open add app modal
      if (mod && e.key === 'n') {
        e.preventDefault()
        setModalOpen(true)
      }

      // Escape: Close modal
      if (e.key === 'Escape') {
        setModalOpen(false)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [apps, switchApp, setModalOpen])

  // ── Sync on browser window resize (debounced) ──────────────
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const handler = () => {
      // Debounce resize events to avoid excessive Rust calls
      if (timeoutId) clearTimeout(timeoutId)

      timeoutId = setTimeout(() => {
        syncPosition()
        timeoutId = null
      }, 16) // ~60fps
    }

    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('resize', handler)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [syncPosition])

  // ── Sync on window move (Tauri event) ──────────────────────
  useEffect(() => {
    let unlisten: (() => void) | null = null

    getCurrentWindow()
      .onMoved(() => syncPosition())
      .then(fn => { unlisten = fn })
      .catch(() => {})

    return () => { unlisten?.() }
  }, [syncPosition])

  // ── Sync when active app changes ───────────────────────────
  useEffect(() => {
    // Small delay to let DOM update first
    const timer = setTimeout(() => syncPosition(), 50)
    return () => clearTimeout(timer)
  }, [activeId, syncPosition])

  // ── Modal visibility management ────────────────────────────
  useEffect(() => {
    if (isModalOpen) {
      // Hide all webviews when modal opens
      invoke('hide_all_webviews').catch(() => {})
    } else {
      // Show active webview when modal closes
      const label = getActiveLabel()
      if (label) {
        const { sidebarWidth, topbarHeight } = getLayoutMeasurements()
        invoke('show_app_webview', {
          label,
          sidebarWidth,
          topbarHeight
        }).catch(() => {})
      }
    }
  }, [isModalOpen, getActiveLabel])

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-content">
        <Topbar />
        <WebviewStage />
      </div>
      <Suspense fallback={null}>
        {isModalOpen && <AddAppModal />}
      </Suspense>
    </div>
  )
}
