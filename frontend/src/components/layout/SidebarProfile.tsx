import { useEffect, useId, useRef, useState } from 'react'
import { ChevronUp, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/utils'

interface SidebarProfileProps {
  collapsed: boolean
  role: string
  avatarClassName?: string
  onLogout?: () => void
}

export default function SidebarProfile({
  collapsed, role, avatarClassName, onLogout,
}: SidebarProfileProps) {
  const { user, logout } = useAuth()
  const profile = useRef<HTMLDivElement>(null)
  const profileButton = useRef<HTMLButtonElement>(null)
  const logoutButton = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const menuId = useId()
  const titleId = useId()
  const descriptionId = useId()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const username = user?.username || role

  useEffect(() => {
    if (!menuOpen) return
    logoutButton.current?.focus()

    const dismissOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !profile.current?.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', dismissOnOutsideClick)
    return () => document.removeEventListener('pointerdown', dismissOnOutsideClick)
  }, [menuOpen])

  const dismissConfirmation = () => {
    if (loggingOut) return
    dialog.current?.close()
    profileButton.current?.focus()
    setMenuOpen(true)
  }

  const confirmLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await logout(onLogout)
    } finally {
      dialog.current?.close()
      setLoggingOut(false)
    }
  }

  return (
    <div
      ref={profile}
      className="relative shrink-0 border-t border-gray-100 p-2"
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false)
      }}
      onKeyDown={event => {
        if (event.key !== 'Escape' || !menuOpen) return
        event.stopPropagation()
        setMenuOpen(false)
        profileButton.current?.focus()
      }}
    >
      <button
        ref={profileButton}
        type="button"
        aria-expanded={menuOpen}
        aria-controls={menuId}
        aria-label={`Profile options for ${username}`}
        title="Profile"
        onClick={() => setMenuOpen(open => !open)}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg py-2 text-left hover:bg-gray-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600',
          menuOpen && 'bg-gray-100',
          collapsed ? 'justify-center' : 'px-2',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white',
            avatarClassName ?? 'bg-gradient-to-br from-blue-400 to-indigo-600',
          )}
        >
          {username.slice(0, 2).toUpperCase()}
        </span>
        <span className={cn('min-w-0 flex-1', collapsed && 'hidden')}>
          <span className="block truncate text-[13px] font-medium text-gray-900">{username}</span>
          <span className="block text-[11px] text-gray-500">{role}</span>
        </span>
        <ChevronUp size={14} aria-hidden="true" className={cn('shrink-0 text-gray-400', collapsed && 'hidden')} />
      </button>

      <div
        id={menuId}
        hidden={!menuOpen}
        className="absolute bottom-full left-2 z-20 mb-1 w-52 rounded-xl border border-white/10 bg-white p-1.5 text-sm text-white shadow-xl"
      >
        <div className="break-all px-2.5 py-1.5 text-xs text-gray-400">
          {user?.email || username}
        </div>
        <button
          type="button"
          disabled
          className="flex w-full cursor-not-allowed items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-gray-400"
        >
          <Settings size={16} aria-hidden="true" />
          Settings
        </button>
        <div className="my-1 border-t border-white/15" />
        <button
          ref={logoutButton}
          type="button"
          onClick={() => {
            setMenuOpen(false)
            dialog.current?.showModal()
          }}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-gray-600 hover:bg-gray-100 hover:text-black focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-300"
        >
          <LogOut size={16} aria-hidden="true" />
          Log out
        </button>
      </div>

      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onCancel={event => {
          event.preventDefault()
          dismissConfirmation()
        }}
        className="m-auto w-[calc(100%_-_2rem)] max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-gray-900 shadow-xl backdrop:bg-slate-900/45"
      >
        <h2 id={titleId} className="text-lg font-semibold">Log out?</h2>
        <p id={descriptionId} className="mt-1 text-sm text-gray-600">
          Are you sure you want to log out of your account?
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={loggingOut}
            onClick={dismissConfirmation}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loggingOut}
            onClick={confirmLogout}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loggingOut ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      </dialog>
    </div>
  )
}
