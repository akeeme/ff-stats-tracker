import { Trophy, Crown } from 'lucide-react'

interface GameTypeBadgeProps {
  gameType: 'regular' | 'playoff' | 'championship'
  size?: 'sm' | 'md' | 'lg'
}

export function GameTypeBadge({ gameType, size = 'md' }: GameTypeBadgeProps) {
  if (!gameType || gameType === 'regular') return null

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  if (gameType === 'championship') {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-semibold ${sizeClasses[size]}`}>
        <Crown className={iconSizes[size]} />
        Championship
      </span>
    )
  }

  // playoff
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold ${sizeClasses[size]}`}>
      <Trophy className={iconSizes[size]} />
      Playoff
    </span>
  )
}
