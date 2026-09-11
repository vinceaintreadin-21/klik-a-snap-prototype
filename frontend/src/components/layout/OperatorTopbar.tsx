import { Bell, Settings } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// Route → title/subtitle mapping
const ROUTE_META: Record<string, { title: string; subtitle: string }> = {
  '/operator/dashboard':     { title: 'Operator Workspace',  subtitle: 'Manage your production queue.'         },
  '/operator/layout-builder':{ title: 'Layout Builder',      subtitle: 'Configure ID card layouts for orders.' },
  '/operator/batch-upload':  { title: 'Batch Upload',        subtitle: 'Upload student photos in bulk.'        },
  '/operator/pipeline':      { title: 'Pipeline',            subtitle: 'Live status of your active batches.'   },
  '/operator/manual-review': { title: 'Manual Review',       subtitle: 'Inspect and resolve flagged students.' },
  '/operator/proofing':      { title: 'Proofing',            subtitle: 'Review and approve ID card proofs.'    },
  '/operator/export':        { title: 'Export',              subtitle: 'Print and export completed ID cards.'  },
}

export default function OperatorTopbar() {
  const { user }    = useAuth()
  const { pathname } = useLocation()

  const meta     = ROUTE_META[pathname] ?? ROUTE_META['/operator/dashboard']
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'OP'

  return (
    <header
      className="fixed top-0 right-0 z-10 h-[60px] bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-8"
      style={{ left: 220 }}
    >
      {/* Left: page context */}
      <div>
        <h2 className="text-[15px] font-semibold text-gray-900 leading-none">{meta.title}</h2>
        <p className="text-[12px] text-gray-400 mt-0.5">{meta.subtitle}</p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Bell */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors border border-gray-100">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
        </button>

        {/* Settings */}
        <button className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors border border-gray-100">
          <Settings size={16} />
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* User chip */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-full border border-white" />
          </div>
          <div>
            <div className="text-[13px] font-medium text-gray-900 leading-none">{user?.username ?? 'Operator'}</div>
            <div className="text-[10px] font-semibold text-blue-500 tracking-widest uppercase leading-none mt-0.5">
              OPERATOR
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
