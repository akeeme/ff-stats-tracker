'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Moon, Sun, Shield } from 'lucide-react'
import { useTheme } from '@/providers/theme-provider'
import { useAdmin } from '@/hooks'

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
      {/* Modern Header */}
      <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 shadow-xl border-b-2 border-red-500/30">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-red-500/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center space-x-4 group">
              <div className="relative w-14 h-14 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/50 group-hover:shadow-red-500/70 transition-all duration-300 group-hover:scale-105 group-hover:rotate-3">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                <span className="text-4xl relative z-10" role="img" aria-label="rhino">🦏</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-300 bg-clip-text text-transparent">
                  Rhinos Flag Football Stats
                </h1>
                <p className="text-gray-400 text-sm">Rhinos Team performance made by keem!</p>
              </div>
            </Link>
            <div className="flex items-center space-x-3">
              {/* Admin Badge */}
              {isAdmin && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/50 backdrop-blur-sm shadow-lg shadow-green-500/20">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-bold text-green-300">Admin</span>
                  <button
                    onClick={clearAdmin}
                    className="ml-1 text-xs text-green-400 hover:text-green-200 underline transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
              
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="p-3 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-gray-600 transition-all duration-200 shadow-lg backdrop-blur-sm"
                aria-label="Toggle dark mode"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-yellow-400" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-300" />
                )}
              </button>
            </div>
          </div>
        </div>
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
