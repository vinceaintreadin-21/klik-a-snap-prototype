import { useNavigate } from 'react-router-dom'
import { LayoutTemplate, ArrowRight } from 'lucide-react'

interface NoLayoutPanelProps {
  onReject: () => void
}

export function NoLayoutPanel({ onReject }: NoLayoutPanelProps) {
  const navigate = useNavigate()
  return (
    <div className="w-[300px] bg-white border-l border-gray-100 flex flex-col overflow-hidden shrink-0">
      <div className="px-5 pt-5 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <LayoutTemplate size={14} className="text-amber-500" />
          <span className="text-[11px] font-bold text-gray-900 uppercase tracking-widest">No Layout Configured</span>
        </div>
        <p className="text-[12px] text-gray-400 leading-snug">
          This is an order-level issue, not specific to this photo. Fix the layout to unblock all affected students.
        </p>
      </div>
      <div className="px-5 py-5 flex-1 flex flex-col gap-4">
        <div className="space-y-3">
          {[
            { step: '1', text: 'Go to Layout Builder and open this order' },
            { step: '2', text: 'Design and save the front and back ID card layout' },
            { step: '3', text: 'Return here and re-trigger processing for this batch' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {step}
              </span>
              <span className="text-[12px] text-gray-600 leading-snug">{text}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="px-5 py-4 border-t border-gray-100 space-y-2">
        <button
          onClick={() => navigate('/operator/layout-builder')}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-all">
          <LayoutTemplate size={15} />
          Go to Layout Builder
          <ArrowRight size={12} />
        </button>
        <button onClick={onReject}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
          Skip for Now
        </button>
      </div>
    </div>
  )
}