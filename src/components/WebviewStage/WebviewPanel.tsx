import { useEffect, useRef, memo } from 'react'
import { invoke } from '@tauri-apps/api/core'
import type { AppEntry } from '../../types'
import { toLabel } from '../Topbar/Topbar'

interface Props {
  app: AppEntry
  isActive: boolean
}

const WebviewPanel = memo(({ app, isActive }: Props) => {
  const createdTabs = useRef<Set<string>>(new Set())

  // 🔥 CREATE ALL TABS (IMPORTANT FIX)
  useEffect(() => {
    app.tabs.forEach(async (tab) => {
      const label = toLabel(app.id, tab.id)

      if (createdTabs.current.has(label)) return

      try {
        await invoke('create_app_webview', {
          payload: { id: app.id, url: tab.url, label }
        })

        createdTabs.current.add(label)
      } catch (err) {
        console.error('Create error:', err)
      }
    })
  }, [app.tabs, app.id])

  // 🔥 SHOW ACTIVE TAB / HIDE OTHERS
  useEffect(() => {
    app.tabs.forEach(async (tab) => {
      const label = toLabel(app.id, tab.id)

      if (!createdTabs.current.has(label)) return

      try {
        if (isActive && tab.id === app.activeTabId) {
          await invoke('show_app_webview', { label })
        } else {
          await invoke('hide_app_webview', { label })
        }
      } catch (err) {
        console.error(err)
      }
    })
  }, [app.activeTabId, isActive, app.tabs, app.id])

  // 🔥 DESTROY ON UNMOUNT ONLY
  useEffect(() => {
    return () => {
      createdTabs.current.forEach(label => {
        invoke('destroy_app_webview', { label }).catch(() => {})
      })
    }
  }, [])

  return null
})

WebviewPanel.displayName = 'WebviewPanel'
export default WebviewPanel