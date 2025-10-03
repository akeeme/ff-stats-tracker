'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    { href: '/teams', label: 'Teams', icon: '🏆' },
    { href: '/players', label: 'Players', icon: '👥' },
    { href: '/games', label: 'Games', icon: '⚽' },
    { href: '/stat-entry', label: 'Stat Entry', icon: '📊' },
    { href: '/standings', label: 'Standings', icon: '🏆' },
    { href: '/seasons', label: 'Seasons', icon: '📅' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modern Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">🏈</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Flag Football Stats</h1>
                <p className="text-gray-600 text-sm">Track your team's performance</p>
              </div>
            </Link>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Current Season</p>
                <p className="font-semibold text-gray-900">Season 1</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Navigation */}
        <div className="mb-8">
          <nav className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 bg-white p-2 rounded-2xl shadow-md border border-gray-200">
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
        <div className="card-bubbly p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
