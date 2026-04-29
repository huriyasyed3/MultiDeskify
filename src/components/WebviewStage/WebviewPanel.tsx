import { useEffect, useRef, memo } from 'react'
import { invoke } from '@tauri-apps/api/core'
import type { AppEntry } from '../../types'

interface Props {
  app: AppEntry
  isActive: boolean
}

function toLabel(id: string): string {
  return 'wv_' + id.replace(/[^a-zA-Z0-9]/g, '_')
}

const WebviewPanel = memo(({ app, isActive }: Props) => {
  const created     = useRef(false)
  const label       = toLabel(app.id)
  const isActiveRef = useRef(isActive)

  // Keep ref updated without triggering effects
  useEffect(() => {
    isActiveRef.current = isActive
  })

  // Create webview once — then show if active
  useEffect(() => {
    if (created.current) return

    const init = async () => {
      try {
        await invoke('create_app_webview', {
          payload: { id: app.id, url: app.url, label }
        })
        created.current = true

        // Show immediately if this is the active app
        if (isActiveRef.current) {
          await invoke('show_app_webview', { label })
        }
      } catch (err) {
        console.error(`[WebviewPanel] Failed to create ${app.name}:`, err)
      }
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Show or hide when active state changes
  useEffect(() => {
    if (!created.current) return
    const cmd = isActive ? 'show_app_webview' : 'hide_app_webview'
    invoke(cmd, { label }).catch(console.error)
  }, [isActive, label])

  // Cleanup when app is removed from store
  useEffect(() => {
    return () => {
      invoke('destroy_app_webview', { label }).catch(() => {})
    }
  }, [label])

  return null
})

WebviewPanel.displayName = 'WebviewPanel'
export default WebviewPanel