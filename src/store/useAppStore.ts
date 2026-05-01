import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AppStore, AppEntry, AppTab } from '../types'
import { generateId } from '../utils/url'

const makeTab = (url: string, title: string): AppTab => ({
  id: generateId(),
  url,
  title,
  createdAt: Date.now(),
})

// ✅ FIX: default tabs ko active banaya
const createDefaultApp = (
  id: string,
  name: string,
  url: string,
  emoji: string,
  color: string
): AppEntry => {
  const firstTab = makeTab(url, name)

  return {
    id,
    name,
    url,
    emoji,
    color,
    createdAt: Date.now(),
    tabs: [firstTab],
    activeTabId: firstTab.id, // ✅ IMPORTANT FIX
  }
}

const DEFAULT_APPS: AppEntry[] = [
  createDefaultApp(
    'app_google',
    'Google',
    'https://www.google.com',
    '🔍',
    '#4285f4'
  ),
  createDefaultApp(
    'app_github',
    'GitHub',
    'https://github.com',
    '🐙',
    '#6e40c9'
  ),
]

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      apps: DEFAULT_APPS,
      activeId: DEFAULT_APPS[0]?.id || null,
      mountedIds: new Set<string>([DEFAULT_APPS[0]?.id]),
      isModalOpen: false,

      addApp: (entry) => {
        const firstTab = makeTab(entry.url, entry.name)

        const newApp: AppEntry = {
          ...entry,
          id: generateId(),
          createdAt: Date.now(),
          tabs: [firstTab],
          activeTabId: firstTab.id,
        }

        set(state => ({
          apps: [...state.apps, newApp],
        }))

        get().switchApp(newApp.id)
      },

      removeApp: (id) => {
        const { apps, activeId, mountedIds } = get()
        const remaining = apps.filter(a => a.id !== id)

        const newMounted = new Set(mountedIds)
        newMounted.delete(id)

        let nextActiveId = activeId
        if (activeId === id) {
          nextActiveId = remaining.length > 0
            ? remaining[remaining.length - 1].id
            : null
        }

        set({
          apps: remaining,
          activeId: nextActiveId,
          mountedIds: newMounted,
        })
      },

      switchApp: (id) => {
        const { mountedIds } = get()

        if (!mountedIds.has(id)) {
          set({ mountedIds: new Set([...mountedIds, id]) })
        }

        set({ activeId: id })
      },

      renameApp: (id, name) => {
        set(state => ({
          apps: state.apps.map(a =>
            a.id === id ? { ...a, name } : a
          ),
        }))
      },

      setModalOpen: (open) => set({ isModalOpen: open }),

      addTab: (appId, url, title) => {
        const newTab = makeTab(url, title || url)

        set(state => ({
          apps: state.apps.map(a => {
            if (a.id !== appId) return a

            return {
              ...a,
              tabs: [...a.tabs, newTab],
              activeTabId: newTab.id,
            }
          }),
        }))

        return newTab.id
      },

      removeTab: (appId, tabId) => {
        set(state => ({
          apps: state.apps.map(a => {
            if (a.id !== appId) return a

            const remaining = a.tabs.filter(t => t.id !== tabId)

            const newActive =
              a.activeTabId === tabId
                ? remaining[remaining.length - 1]?.id || null
                : a.activeTabId

            return {
              ...a,
              tabs: remaining,
              activeTabId: newActive,
            }
          }),
        }))
      },

      switchTab: (appId, tabId) => {
        set(state => ({
          apps: state.apps.map(a =>
            a.id === appId
              ? { ...a, activeTabId: tabId }
              : a
          ),
        }))
      },

      renameTab: (appId, tabId, title) => {
        set(state => ({
          apps: state.apps.map(a => {
            if (a.id !== appId) return a

            return {
              ...a,
              tabs: a.tabs.map(t =>
                t.id === tabId ? { ...t, title } : t
              ),
            }
          }),
        }))
      },
    }),

    {
      name: 'multideskify_v3',
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        apps: state.apps,
        activeId: state.activeId,
      }),

      onRehydrateStorage: () => (state) => {
        if (state?.activeId) {
          state.mountedIds = new Set([state.activeId])
        } else {
          state!.mountedIds = new Set()
        }

        // ✅ ensure activeTab always exists
        if (state?.apps) {
          state.apps = state.apps.map(a => ({
            ...a,
            activeTabId:
              a.activeTabId || a.tabs[0]?.id || null,
          }))
        }
      },
    }
  )
)