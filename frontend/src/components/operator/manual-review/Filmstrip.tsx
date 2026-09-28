import { cn } from '../../../lib/utils'
import { type ReviewStudent, issueType, ISSUE_LABELS, ISSUE_STRIP, HUES } from './types'

interface FilmstripProps {
  students: ReviewStudent[]
  resolvedIds: Set<number>
  rejectedIds: Set<number>
  currentIdx: number
  onSelect: (i: number) => void
}

export function Filmstrip({
  students,
  resolvedIds,
  rejectedIds,
  currentIdx,
  onSelect,
}: FilmstripProps) {
  return (
    <div className="h-[72px] bg-[#0a0c10] border-t border-white/8 flex items-center gap-1.5 px-4 overflow-x-auto shrink-0">
      {students.map((s, i) => {
        const issue = issueType(s)
        const done = resolvedIds.has(s.id)
        const rejected = rejectedIds.has(s.id)
        return (
          <button
            key={s.id}
            onClick={() => onSelect(i)}
            title={`${s.full_name} — ${ISSUE_LABELS[issue]}`}
            className={cn(
              'relative w-11 h-[52px] rounded overflow-hidden shrink-0 border-2 transition-all duration-150',
              i === currentIdx
                ? 'border-blue-400 scale-110 shadow-lg shadow-blue-900/40'
                : 'border-transparent opacity-50 hover:opacity-80',
            )}
          >
            {s.original_photo_url ? (
              <img src={s.original_photo_url} alt={s.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full"
                style={{ background: `linear-gradient(160deg, hsl(${HUES[i % HUES.length]},35%,32%), hsl(${HUES[i % HUES.length]},45%,22%))` }} />
            )}
            <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: ISSUE_STRIP[issue] }} />
            <div className={cn(
              'absolute top-1 right-1 w-2 h-2 rounded-full border border-black/30',
              done ? 'bg-emerald-400' : rejected ? 'bg-red-400' : 'bg-gray-500',
            )} />
            <div className="absolute top-0.5 left-1 text-[7px] text-white/50 font-mono">{i + 1}</div>
          </button>
        )
      })}
    </div>
  )
}