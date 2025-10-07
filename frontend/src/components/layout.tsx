'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/providers/theme-provider'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

  const navItems = [
    { href: '/teams', label: 'Teams', icon: '🏆' },
    { href: '/players', label: 'Players', icon: '👥' },
    { href: '/games', label: 'Games', icon: '⚽' },
    { href: '/stat-entry', label: 'Stat Entry', icon: '📊' },
    { href: '/stats', label: 'Stats', icon: '📈' },
    { href: '/standings', label: 'Standings', icon: '🏅' },
    { href: '/seasons', label: 'Seasons', icon: '📅' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      {/* Modern Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">🏈</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Flag Football Stats</h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Track your team&apos;s performance</p>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm"
                aria-label="Toggle dark mode"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-700" />
                )}
              </button>
              <div className="hidden md:block text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Current Season</p>
                <p className="font-semibold text-gray-900 dark:text-white">Season 1</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Navigation */}
        <div className="mb-8">
          <nav className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 transition-colors duration-200">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`tab-modern ${
                    isActive ? 'tab-active' : 'tab-inactive'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{item.icon}</span>
                    <span className="hidden sm:inline">{item.label}</span>
                  </div>
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
