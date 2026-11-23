import { LayoutGrid, List } from 'lucide-react'
import { cn } from '../../lib/utils'

export type ViewMode = 'list' | 'grid'

interface Props {
  value: ViewMode
  onChange: (value: ViewMode) => void
}

export default function ViewModeToggle({ value, onChange }: Props) {
  return (
    <div role="group" aria-label="Display view" className="inline-flex shrink-0 items-center rounded-lg bg-slate-100 p-1">
      {(['list', 'grid'] as const).map(mode => {
        const Icon = mode === 'list' ? List : LayoutGrid
        const label = mode === 'list' ? 'List view' : 'Grid view'
        return (
          <button
            key={mode}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={value === mode}
            onClick={() => onChange(mode)}
            className={cn(
              'grid size-8 place-items-center rounded transition-colors focus-visible:outline-2 focus-visible:outline-purple-600',
              value === mode ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-400 hover:bg-white/60',
            )}
          >
            <Icon size={16} />
          </button>
        )
      })}
    </div>
  )
}
