import { useEffect, useId, useRef, useState } from 'react'
import { MoreVertical } from 'lucide-react'
import GenerateTestPhotosButton from './GenerateTestPhotosButton'

interface Props {
  orderId: number
  orderName: string
  disabled?: boolean
}

export default function OrderActionsMenu({ orderId, orderName, disabled }: Props) {
  const menuId = useId()
  const menu = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, right: 0 })

  useEffect(() => {
    if (!open) return
    const dismiss = () => menu.current?.hidePopover()
    window.addEventListener('scroll', dismiss, true)
    window.addEventListener('resize', dismiss)
    return () => {
      window.removeEventListener('scroll', dismiss, true)
      window.removeEventListener('resize', dismiss)
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        aria-label={`More actions for order ${orderId}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        popoverTarget={menuId}
        disabled={disabled}
        onClick={event => {
          const rect = event.currentTarget.getBoundingClientRect()
          const height = menu.current?.offsetHeight || 52
          const top = rect.bottom + height + 6 > window.innerHeight
            ? Math.max(8, rect.top - height - 6)
            : rect.bottom + 6
          setPosition({ top, right: Math.max(8, window.innerWidth - rect.right) })
        }}
        className="grid size-10 shrink-0 place-items-center rounded-lg border border-purple-100 bg-white text-slate-500 hover:bg-purple-50 hover:text-purple-700 focus-visible:outline-2 focus-visible:outline-purple-600 disabled:opacity-50"
      >
        <MoreVertical size={18} />
      </button>
      <div
        ref={menu}
        id={menuId}
        popover="auto"
        role="menu"
        aria-label={`Actions for order ${orderId}`}
        onToggle={event => {
          const expanded = event.newState === 'open'
          setOpen(expanded)
          if (expanded) menu.current?.querySelector('button')?.focus()
        }}
        onKeyDown={event => {
          if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
            event.preventDefault()
            menu.current?.querySelector('button')?.focus()
          }
        }}
        className="fixed inset-auto z-50 m-0 min-w-52 max-w-[calc(100vw-1rem)] rounded-xl border border-purple-100 bg-white p-1.5 shadow-xl"
        style={position}
      >
        <GenerateTestPhotosButton orderId={orderId} orderName={orderName} variant="menu" />
      </div>
    </>
  )
}
