// ─── ID generation ─────────────────────────────────────────────────────────

export function generateId(): string {
  return `app_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

// ─── URL utilities ─────────────────────────────────────────────────────────

export function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try { return new URL(withScheme).href } catch { return null }
}

export function getDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

export function deriveAppName(url: string): string {
  const domain = getDomain(url)
  const part = domain.split('.')[0]
  return part.charAt(0).toUpperCase() + part.slice(1)
}

// ─── Security validation ────────────────────────────────────────────────────

const BLOCKED_SCHEMES = ['javascript', 'data', 'vbscript', 'file', 'blob']
const BLOCKED_HOSTS = new Set([
  'localhost', '127.0.0.1', '0.0.0.0', '::1', '169.254.169.254',
])

export interface ValidationResult {
  ok: boolean
  error?: string
  warning?: string
  normalizedUrl?: string
}

export function validateAndNormalizeUrl(raw: string): ValidationResult {
  if (!raw.trim()) return { ok: false, error: 'URL is required' }

  const scheme = raw.trim().split(':')[0].toLowerCase()
  if (BLOCKED_SCHEMES.includes(scheme))
    return { ok: false, error: `"${scheme}:" URLs are not allowed` }

  const normalizedUrl = normalizeUrl(raw)
  if (!normalizedUrl) return { ok: false, error: 'Invalid URL format' }

  let parsed: URL
  try { parsed = new URL(normalizedUrl) } catch {
    return { ok: false, error: 'Cannot parse URL' }
  }

  if (BLOCKED_HOSTS.has(parsed.hostname))
    return { ok: false, error: 'Local network addresses are not allowed' }

  if (parsed.protocol === 'http:')
    return { ok: true, warning: 'This site uses HTTP (unencrypted).', normalizedUrl }

  return { ok: true, normalizedUrl }
}

// ─── Favicon ────────────────────────────────────────────────────────────────

const faviconCache = new Map<string, string>()

export function getFaviconUrl(url: string): string {
  const domain = getDomain(url)
  if (faviconCache.has(domain)) return faviconCache.get(domain)!
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
  faviconCache.set(domain, faviconUrl)
  return faviconUrl
}