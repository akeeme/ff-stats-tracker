'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Moon, Sun, Shield } from 'lucide-react'
import { useTheme } from '@/providers/theme-provider'
import { useAdmin } from '@/hooks'
import { WhatsNewModal } from '@/components/whats-new-modal'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const { isAdmin, clearAdmin } = useAdmin()

  const navItems = [
    { href: '/standings', label: 'Standings', icon: '🏅', adminOnly: false },
    { href: '/games', label: 'Games', icon: '⚽', adminOnly: false },
    { href: '/stats', label: 'Stats', icon: '📈', adminOnly: false },
    { href: '/teams', label: 'Teams', icon: '🏆', adminOnly: false },
    { href: '/players', label: 'Players', icon: '👥', adminOnly: false },
    { href: '/stat-entry', label: 'Stat Entry', icon: '📊', adminOnly: true },
    { href: '/seasons', label: 'Seasons', icon: '📅', adminOnly: true },
  ]

  // Filter nav items based on admin status
  const visibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      {/* What's New Modal */}
      <WhatsNewModal />
      
      {/* Modern Header */}
      <div className="sticky top-0 z-50 relative bg-gradient-to-r from-slate-900 via-gray-900 to-slate-900 dark:from-black dark:via-gray-950 dark:to-black shadow-2xl border-b border-red-500/20">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-purple-500/10 to-red-500/10 opacity-50"></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Title */}
            <Link href="/" className="flex items-center space-x-3 sm:space-x-4 group">
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/50 group-hover:shadow-red-500/80 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ring-2 ring-red-400/30 group-hover:ring-red-400/50">
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-2xl"></div>
                <div className="absolute inset-0 bg-gradient-to-tl from-black/20 to-transparent rounded-2xl"></div>
                <span className="text-3xl sm:text-4xl relative z-10 drop-shadow-lg" role="img" aria-label="rhino">🦏</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent drop-shadow-lg tracking-tight">
                  Rhinos Flag Football Stats
                </h1>
                <p className="text-gray-400 text-xs sm:text-sm font-medium tracking-wide">
                  Team performance made by <span className="text-red-400 font-semibold">keem</span>
                </p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-xl font-black bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent drop-shadow-lg">
                  Rhinos Stats
                </h1>
                <p className="text-gray-400 text-xs">by keem</p>
              </div>
            </Link>
            
            {/* Right Side Controls */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Admin Badge */}
              {isAdmin && (
                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-emerald-500/20 rounded-xl border border-emerald-500/40 backdrop-blur-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200">
                  <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
                  <span className="text-xs sm:text-sm font-bold text-emerald-300 hidden sm:inline">Admin</span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-300 sm:hidden">A</span>
                  <button
                    onClick={clearAdmin}
                    className="ml-0.5 sm:ml-1 text-[10px] sm:text-xs text-emerald-400 hover:text-emerald-200 underline transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
              
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2.5 sm:p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 shadow-lg backdrop-blur-sm group"
                aria-label="Toggle dark mode"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
                ) : (
                  <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 group-hover:text-white transition-colors" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Bottom glow effect */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Navigation */}
        <div className="mb-8">
          <nav className={`grid grid-cols-2 sm:grid-cols-3 ${visibleNavItems.length > 5 ? 'lg:grid-cols-7' : 'lg:grid-cols-5'} gap-2 sm:gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 transition-colors duration-200`}>
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    relative px-3 py-3 sm:px-4 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200
                    flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2
                    ${isActive 
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 scale-105' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105'
                    }
                  `}
                >
                  <span className="text-xl sm:text-lg">{item.icon}</span>
                  <span className="text-[10px] sm:text-sm leading-tight text-center sm:text-left">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Page Content */}
        <div className="card-bubbly p-8 bg-white dark:bg-gray-800 transition-colors duration-200">
          {children}
        </div>
      </div>
    </div>
  )
}
