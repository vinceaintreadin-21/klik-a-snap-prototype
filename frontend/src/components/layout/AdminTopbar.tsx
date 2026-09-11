import { useAuth } from '../../context/AuthContext'
import { Bell, Settings, Search } from 'lucide-react'

export default function AdminTopbar() {
  const { user } = useAuth()

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'AD'

  return (
    <header className="fixed top-0 left-[220px] right-0 z-9 h-[60px] bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-8">
      {/* Left: page context */}
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-[15px] font-semibold text-gray-900 leading-none">Operations Dashboard</h2>
          <p className="text-[12px] text-gray-400 mt-0.5">Real-time status of ID production across all institutions.</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative mr-2">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search orders, institutions..."
            className="pl-8 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-gray-400 transition-all w-64"
          />
        </div>

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

        {/* User */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-full border border-white" />
          </div>
          <div>
            <div className="text-[13px] font-medium text-gray-900 leading-none">{user?.username ?? 'Admin'}</div>
            <div className="text-[10px] font-semibold text-purple-500 tracking-widest uppercase leading-none mt-0.5">
              {user?.role ?? 'ADMIN'}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
