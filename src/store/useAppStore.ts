import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AppStore, AppEntry } from '../types'
import { generateId } from '../utils/id'

const DEFAULT_APPS: AppEntry[] = [
  {
    id: 'app_google',
    name: 'Google',
    url: 'https://www.google.com',
    emoji: '🔍',
    color: '#4285f4',
    createdAt: Date.now(),
  },
  {
    id: 'app_github',
    name: 'GitHub',
    url: 'https://github.com',
    emoji: '🐙',
    color: '#333333',
    createdAt: Date.now(),
  },
]

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      apps: DEFAULT_APPS,
      activeId: null,
      mountedIds: new Set<string>(),
      isModalOpen: false,

      addApp: (entry) => {
        const newApp: AppEntry = {
          ...entry,
          id: generateId(),
          createdAt: Date.now(),
        }
        set(state => ({ apps: [...state.apps, newApp] }))
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

        set({ apps: remaining, activeId: nextActiveId, mountedIds: newMounted })

        if (nextActiveId) {
          const withNext = new Set(newMounted)
          withNext.add(nextActiveId)
          set({ mountedIds: withNext })
        }
      },

      switchApp: (id) => {
        const { mountedIds } = get()
        if (!mountedIds.has(id)) {
          set({ mountedIds: new Set([...mountedIds, id]) })
        }
        set({ activeId: id })
      },

      setModalOpen: (open) => set({ isModalOpen: open }),
    }),
    {
      name: 'singlebox_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        apps: state.apps,
        activeId: state.activeId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.activeId) {
          state.mountedIds = new Set([state.activeId])
        }
      },
    }
  )
)