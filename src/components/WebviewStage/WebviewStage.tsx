// import { useCallback } from 'react'
// import { useAppStore } from '../../store/useAppStore'
// import WebviewPanel from './WebviewPanel'
// import './WebviewStage.css'

// export default function WebviewStage() {
//   const apps         = useAppStore(s => s.apps)
//   const activeId     = useAppStore(s => s.activeId)
//   const mountedIds   = useAppStore(s => s.mountedIds)
//   const setModalOpen = useAppStore(s => s.setModalOpen)

//   const handleAddClick = useCallback(() => setModalOpen(true), [setModalOpen])

//   const hasApps   = apps.length > 0
//   const hasActive = activeId !== null

//   return (
//     <main className="webview-stage" role="main">
//       {!hasApps && (
//         <div className="webview-empty">
//           <div className="webview-empty-icon">🪟</div>
//           <div className="webview-empty-title">No apps added yet</div>
//           <p className="webview-empty-desc">Add your first web app — Gmail, Notion, Slack, or any URL.</p>
//           <button className="webview-empty-cta" onClick={handleAddClick}>
//             Add your first app
//           </button>
//         </div>
//       )}

//       {hasApps && !hasActive && (
//         <div className="webview-empty">
//           <div className="webview-empty-icon">👈</div>
//           <div className="webview-empty-title">Select an app</div>
//           <p className="webview-empty-desc">Click any icon in the sidebar to open it here.</p>
//         </div>
//       )}

//       {apps
//         .filter(app => mountedIds.has(app.id))
//         .map(app => (
//           <WebviewPanel
//             key={app.id}
//             app={app}
//             isActive={app.id === activeId}
//           />
//         ))
//       }
//     </main>
//   )
// }


import { useCallback } from 'react'
import { useAppStore } from '../../store/useAppStore'
import WebviewPanel from './WebviewPanel'
import './WebviewStage.css'

export default function WebviewStage() {
  const apps         = useAppStore(s => s.apps)
  const activeId     = useAppStore(s => s.activeId)
  const mountedIds   = useAppStore(s => s.mountedIds)
  const setModalOpen = useAppStore(s => s.setModalOpen)

  const handleAddClick = useCallback(() => setModalOpen(true), [setModalOpen])

  const hasApps   = apps.length > 0
  const hasActive = activeId !== null

  return (
    <main className="webview-stage" role="main">

      {/* Empty state — no apps at all */}
      {!hasApps && (
        <div className="webview-empty">
          <div className="webview-empty-icon">🪟</div>
          <div className="webview-empty-title">No apps added yet</div>
          <p className="webview-empty-desc">
            Add your first web app — Gmail, Notion, Slack, or any URL.
          </p>
          <button className="webview-empty-cta" onClick={handleAddClick}>
            Add your first app
          </button>
        </div>
      )}

      {/* Has apps but none selected */}
      {hasApps && !hasActive && (
        <div className="webview-empty">
          <div className="webview-empty-icon">👈</div>
          <div className="webview-empty-title">Select an app</div>
          <p className="webview-empty-desc">
            Click any icon in the sidebar to open it here.
          </p>
        </div>
      )}

      {/*
        Mount WebviewPanel for each visited app.
        Each panel manages its own native WebviewWindow lifecycle.
        Renders null to DOM — content is in the OS-level window.
      */}
      {apps
        .filter(app => mountedIds.has(app.id))
        .map(app => (
          <WebviewPanel
            key={app.id}
            app={app}
            isActive={app.id === activeId}
          />
        ))
      }

    </main>
  )
}