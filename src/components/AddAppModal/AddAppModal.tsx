import { useState, useCallback, useRef, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { validateAndNormalizeUrl, deriveAppName } from '../../utils/url'
import './AddAppModal.css'

const EMOJI_OPTIONS = ['🌐','💬','📧','📅','✅','📝','🔔','📊','🎵','🛒','💼','🔗','📌','🎨','⚡','🔒','🚀','🎯','🏠','📱']
const COLOR_OPTIONS = ['#4f6ef7','#a855f7','#22c55e','#ef4444','#f59e0b','#06b6d4','#ec4899','#f97316']

export default function AddAppModal() {
  const addApp       = useAppStore(s => s.addApp)
  const setModalOpen = useAppStore(s => s.setModalOpen)

  const [url, setUrl]         = useState('')
  const [name, setName]       = useState('')
  const [emoji, setEmoji]     = useState('🌐')
  const [color, setColor]     = useState('#4f6ef7')
  const [urlHint, setUrlHint] = useState<{ type: 'error'|'warning'|'info'; message: string } | null>(null)
  const [nameError, setNameError] = useState(false)

  const urlInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => urlInputRef.current?.focus(), 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleClose = useCallback(() => setModalOpen(false), [setModalOpen])

  const handleUrlChange = useCallback((value: string) => {
    setUrl(value)
    setUrlHint(null)
    if (!value.trim()) return

    const result = validateAndNormalizeUrl(value)
    if (!result.ok) { setUrlHint({ type: 'error', message: result.error! }); return }
    if (result.warning) setUrlHint({ type: 'warning', message: result.warning })
    if (!name && result.normalizedUrl) {
      const derived = deriveAppName(result.normalizedUrl)
      if (derived) setName(derived)
    }
  }, [name])

  const handleSubmit = useCallback(() => {
    let isValid = true
    const urlResult = validateAndNormalizeUrl(url)
    if (!urlResult.ok) { setUrlHint({ type: 'error', message: urlResult.error! }); isValid = false }
    if (!name.trim())  { setNameError(true); isValid = false }
    if (!isValid) return

    addApp({ name: name.trim(), url: urlResult.normalizedUrl!, emoji, color })
    handleClose()
  }, [url, name, emoji, color, addApp, handleClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }, [handleSubmit])

  const isSubmittable = url.trim().length > 0 && name.trim().length > 0

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) handleClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-title" id="modal-title">Add web app</div>
            <div className="modal-subtitle">Any URL — Gmail, Notion, Jira, or internal tools</div>
          </div>
          <button className="modal-close" onClick={handleClose} aria-label="Close modal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="form-field">
            <label className="form-label" htmlFor="app-url">URL</label>
            <input
              ref={urlInputRef}
              id="app-url"
              className={`form-input${urlHint?.type === 'error' ? ' error' : ''}`}
              type="url"
              placeholder="https://mail.google.com"
              value={url}
              onChange={e => handleUrlChange(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck={false}
            />
            {urlHint && (
              <p className={`form-hint ${urlHint.type}`} role={urlHint.type === 'error' ? 'alert' : 'status'}>
                {urlHint.message}
              </p>
            )}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="app-name">Name</label>
            <input
              id="app-name"
              className={`form-input${nameError ? ' error' : ''}`}
              type="text"
              placeholder="Gmail"
              value={name}
              onChange={e => { setName(e.target.value); setNameError(false) }}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />
            {nameError && (
              <p className="form-hint error" role="alert">Name is required</p>
            )}
          </div>

          <div className="form-field">
            <label className="form-label">Icon</label>
            <div className="emoji-grid" role="radiogroup" aria-label="Select icon">
              {EMOJI_OPTIONS.map(e => (
                <button
                  key={e}
                  className={`emoji-opt${emoji === e ? ' selected' : ''}`}
                  onClick={() => setEmoji(e)}
                  role="radio"
                  aria-checked={emoji === e}
                  type="button"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                  aria-pressed={color === c}
                  type="button"
                  style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: c,
                    border: `2.5px solid ${color === c ? '#fff' : 'transparent'}`,
                    cursor: 'pointer',
                    transition: 'transform 0.12s, border-color 0.12s',
                    transform: color === c ? 'scale(1.2)' : 'scale(1)',
                    outline: 'none',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-ghost" onClick={handleClose} type="button">Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={!isSubmittable} type="button">
            Add app
          </button>
        </div>
      </div>
    </div>
  )
}