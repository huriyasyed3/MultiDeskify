// ── Tab ─────────────────────
export interface AppTab {
  id:        string   // unique tab id
  url:       string   // tab  URL
  title:     string   // tab ka naam (user can set )
  createdAt: number
}

// ── App/Subspace (sidebar icon) ───────────────────────────
export interface AppEntry {
  id:        string   // unique app id
  name:      string   // subspace naam (renameable)
  url:       string   // default/first URL
  emoji:     string   // icon
  color:     string   // accent color
  createdAt: number
  tabs:      AppTab[] // subspace tabs
  activeTabId: string | null // currently open tab
}

// ── Store ──────────────────────────────────────────────────
export interface AppStore {
  apps:        AppEntry[]
  activeId:    string | null
  mountedIds:  Set<string>
  isModalOpen: boolean

  // App actions
  addApp:       (entry: Omit<AppEntry, 'id' | 'createdAt' | 'tabs' | 'activeTabId'>) => void
  removeApp:    (id: string) => void
  switchApp:    (id: string) => void
  renameApp:    (id: string, name: string) => void
  setModalOpen: (open: boolean) => void

  // Tab actions
  addTab:       (appId: string, url: string, title?: string) => void
  removeTab:    (appId: string, tabId: string) => void
  switchTab:    (appId: string, tabId: string) => void
  renameTab:    (appId: string, tabId: string, title: string) => void
}

export interface ValidationResult {
  ok:           boolean
  error?:       string
  warning?:     string
  normalizedUrl?: string
}