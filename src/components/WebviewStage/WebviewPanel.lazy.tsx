import { useEffect, useRef, memo } from 'react'
import { invoke } from '@tauri-apps/api/core'
import type { AppEntry } from '../../types'
import { toLabel } from '../Topbar/Topbar'

interface Props {
  app: AppEntry
  isActive: boolean
}

// Get exact layout measurements from DOM
function getLayout() {
  const sidebar = document.querySelector('.sidebar') as HTMLElement
  const topbar  = document.querySelector('.topbar')  as HTMLElement
  return {
    sidebarWidth: sidebar?.offsetWidth  ?? 68,
    topbarHeight: topbar?.offsetHeight  ?? 80,
  }
}

const WebviewPanel = memo(({ app, isActive }: Props) => {
  const createdTabs = useRef<Set<string>>(new Set())
  const creating    = useRef<Set<string>>(new Set())

  // ── Create webview for active tab only (lazy loading) ─────
  useEffect(() => {
    if (!isActive || !app.activeTabId) return

    const tab = app.tabs.find(t => t.id === app.activeTabId)
    if (!tab) return

    const label = toLabel(app.id, tab.id)

    // Skip if already created or currently creating
    if (createdTabs.current.has(label)) return
    if (creating.current.has(label))    return

    creating.current.add(label)

    ;(async () => {
      try {
        // Create webview window via Rust backend
        await invoke('create_app_webview', {
          payload: { id: app.id, url: tab.url, label }
        })

        // Mark as created
        createdTabs.current.add(label)

        // Sync position immediately after creation
        const { sidebarWidth, topbarHeight } = getLayout()
        await invoke('sync_webview_position', {
          label,
          sidebarWidth,
          topbarHeight,
        }).catch(() => {})

      } catch (err) {
        // Webview already exists - this is OK
        createdTabs.current.add(label)
      } finally {
        creating.current.delete(label)
      }
    })()
  }, [app.id, app.activeTabId, isActive])

  // ── Show/hide active tab ───────────────────────────────────
  useEffect(() => {
    if (!app.activeTabId) return

    const label = toLabel(app.id, app.activeTabId)

    // Only proceed if webview exists
    if (!createdTabs.current.has(label)) return

    if (isActive) {
      // This app is active - show its active tab
      const { sidebarWidth, topbarHeight } = getLayout()

      // Sync position before showing (handles window move/resize)
      invoke('sync_webview_position', { label, sidebarWidth, topbarHeight })
        .catch(() => {})
        .finally(() => {
          // Show webview (Rust will hide others automatically)
          invoke('show_app_webview', { label }).catch(console.error)
        })
    } else {
      // This app is not active - hide its webview
      invoke('hide_app_webview', { label }).catch(() => {})
    }
  }, [isActive, app.activeTabId, app.id])

  // ── Cleanup on unmount ─────────────────────────────────────
  useEffect(() => {
    return () => {
      // Destroy all webviews for this app when component unmounts
      createdTabs.current.forEach(label => {
        invoke('destroy_app_webview', { label }).catch(() => {})
      })
    }
  }, [])

  // This component renders nothing - webviews are OS-level windows
  return null
})

WebviewPanel.displayName = 'WebviewPanel'
export default WebviewPanel
