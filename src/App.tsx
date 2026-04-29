import { Suspense, lazy, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useAppStore } from './store/useAppStore'
import Sidebar from './components/Sidebar/Sidebar'
import Topbar from './components/Topbar/Topbar'
import WebviewStage from './components/WebviewStage/WebviewStage'

const AddAppModal = lazy(
  () => import('./components/AddAppModal/AddAppModal')
)

function toLabel(id: string): string {
  return 'wv_' + id.replace(/[^a-zA-Z0-9]/g, '_')
}

export default function App() {
  const isModalOpen  = useAppStore(s => s.isModalOpen)
  const apps         = useAppStore(s => s.apps)
  const activeId     = useAppStore(s => s.activeId)
  const switchApp    = useAppStore(s => s.switchApp)
  const setModalOpen = useAppStore(s => s.setModalOpen)

  // ── Keyboard shortcuts ──────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return

      const mod = e.ctrlKey || e.metaKey

      if (mod && /^[1-9]$/.test(e.key)) {
        e.preventDefault()
        const app = apps[parseInt(e.key) - 1]
        if (app) switchApp(app.id)
        return
      }
      if (mod && e.key === 'n') {
        e.preventDefault()
        setModalOpen(true)
        return
      }
      if (e.key === 'Escape') {
        setModalOpen(false)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [apps, switchApp, setModalOpen])

  // ── Sync on browser resize ──────────────────────────────
  useEffect(() => {
    if (!activeId) return
    const label = toLabel(activeId)
    const handler = () => {
      invoke('sync_webview_position', { label }).catch(() => {})
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [activeId])

  // ── Sync on window move (Tauri event) ───────────────────
  useEffect(() => {
    if (!activeId) return
    const label = toLabel(activeId)
    let unlisten: (() => void) | null = null

    getCurrentWindow()
      .onMoved(() => {
        invoke('sync_webview_position', { label }).catch(() => {})
      })
      .then(fn => { unlisten = fn })
      .catch(() => {})

    return () => { unlisten?.() }
  }, [activeId])

  // ── Hide webviews when modal opens ──────────────────────
  useEffect(() => {
    if (isModalOpen) {
      invoke('hide_all_webviews').catch(() => {})
    } else if (activeId) {
      invoke('show_app_webview', { label: toLabel(activeId) }).catch(() => {})
    }
  }, [isModalOpen, activeId])

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