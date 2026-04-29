// ─── Core domain types ─────────────────────────────────────────────────────

export interface AppEntry {
  id: string
  name: string
  url: string
  emoji: string
  color: string
  createdAt: number
}

// ─── Store shape ───────────────────────────────────────────────────────────

export interface AppStore {
  apps: AppEntry[]
  activeId: string | null
  mountedIds: Set<string>
  isModalOpen: boolean

  addApp: (entry: Omit<AppEntry, 'id' | 'createdAt'>) => void
  removeApp: (id: string) => void
  switchApp: (id: string) => void
  setModalOpen: (open: boolean) => void
}

// ─── Utility types ─────────────────────────────────────────────────────────

export type SecurityStatus = 'safe' | 'warn' | 'unsafe'

export interface SecurityResult {
  status: SecurityStatus
  message: string
}