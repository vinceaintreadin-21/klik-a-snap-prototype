import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import type { SidebarToggleProps } from './CollapsibleSidebar'

const narrowViewport = '(max-width: 800px)'

interface ResponsiveSidebarLayoutProps {
  sidebarWidth: number
  contentGutter?: number
  renderSidebar: (props: SidebarToggleProps) => ReactNode
  children: ReactNode
}

export default function ResponsiveSidebarLayout({
  sidebarWidth, contentGutter = 0, renderSidebar, children,
}: ResponsiveSidebarLayoutProps) {
  const { key: routeKey } = useLocation()
  const [narrow, setNarrow] = useState(() => window.matchMedia(narrowViewport).matches)
  const [desktopCollapsed, setDesktopCollapsed] = useState(false)
  const [openOnRoute, setOpenOnRoute] = useState<string | null>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const overlayOpen = narrow && openOnRoute === routeKey
  const collapsed = narrow ? !overlayOpen : desktopCollapsed
  const pageOffset = narrow || collapsed ? 64 : sidebarWidth

  if (openOnRoute !== null && openOnRoute !== routeKey) setOpenOnRoute(null)

  useEffect(() => {
    const media = window.matchMedia(narrowViewport)
    const updateViewport = () => {
      setNarrow(media.matches)
      setOpenOnRoute(null)
    }
    media.addEventListener('change', updateViewport)
    updateViewport()
    return () => media.removeEventListener('change', updateViewport)
  }, [])

  useEffect(() => {
    if (!overlayOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    toggleRef.current?.focus({ preventScroll: true })
    return () => { document.body.style.overflow = previousOverflow }
  }, [overlayOpen])

  const closeOverlay = () => {
    setOpenOnRoute(null)
    toggleRef.current?.focus({ preventScroll: true })
  }

  const style: CSSProperties & { '--sidebar-width': string } = {
    '--sidebar-width': `${pageOffset}px`,
    fontFamily: "'DM Sans', sans-serif",
  }

  return (
    <div
      className="flex min-h-screen bg-[#f5f3ff]"
      style={style}
      onKeyDown={event => {
        if (overlayOpen && event.key === 'Escape' &&
            !(event.target instanceof Element && event.target.closest('dialog[open]'))) {
          event.preventDefault()
          closeOverlay()
        }
      }}
    >
      {renderSidebar({
        collapsed,
        panelWidth: overlayOpen ? sidebarWidth : undefined,
        toggleRef,
        onToggle: () => {
          if (!narrow) setDesktopCollapsed(previous => !previous)
          else if (overlayOpen) closeOverlay()
          else setOpenOnRoute(routeKey)
        },
      })}
      <div
        className={overlayOpen ? 'isolate flex min-w-0 flex-1 flex-col' : 'flex min-w-0 flex-1 flex-col'}
        style={{ marginLeft: pageOffset + (narrow ? 0 : contentGutter) }}
        inert={overlayOpen}
      >
        {children}
      </div>
      {overlayOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-[15] bg-slate-900/15 backdrop-blur-[2px]"
          onClick={closeOverlay}
        />
      )}
    </div>
  )
}
