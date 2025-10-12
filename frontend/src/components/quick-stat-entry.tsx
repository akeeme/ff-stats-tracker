'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Game, Player } from '@/lib/api'
import { Plus, Undo2, ChevronDown, ChevronRight, X, UserPlus, Filter, Flame } from 'lucide-react'

type StatSubmission = {
  player_name: string
  game_week: number
  game_season: number
  league: string
  team1_name: string
  team2_name: string
  passing_tds?: number
  passes_completed?: number
  passes_attempted?: number
  interceptions_thrown?: number
  receptions?: number
  targets?: number
  receiving_tds?: number
  drops?: number
  first_downs?: number
  rushing_tds?: number
  rush_attempts?: number
  flag_pulls?: number
  interceptions?: number
  pass_breakups?: number
  def_td?: number
  sacks?: number
}

type PlayerStats = {
  [playerName: string]: {
    passing_tds: number
    passes_completed: number
    passes_attempted: number
    interceptions_thrown: number
    receptions: number
    targets: number
    receiving_tds: number
    drops: number
    first_downs: number
    rushing_tds: number
    rush_attempts: number
    flag_pulls: number
    sacks: number
    interceptions: number
    pass_breakups: number
    def_td: number
  }
}

type HistoryEntry = {
  playerName: string
  statType: string
  statLabel: string
  timestamp: number
}

interface QuickStatEntryProps {
  game: Game
  players: Player[]
  onSubmit: (stats: StatSubmission) => void
}

export function QuickStatEntry({ game, players, onSubmit }: QuickStatEntryProps) {
  const [playerStats, setPlayerStats] = useState<PlayerStats>({})
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    qb: true,
    wr: true,
    rb: true,
    def: true,
  })
  const [assignedPlayers, setAssignedPlayers] = useState<{
    qb: string[]
    wr: string[]
    rb: string[]
    def: string[]
  }>({
    qb: [],
    wr: [],
    rb: [],
    def: [],
  })
  const [showPlayerSelector, setShowPlayerSelector] = useState<string | null>(null)
  const [selectorSearch, setSelectorSearch] = useState('')
  const [showUndoAllConfirm, setShowUndoAllConfirm] = useState(false)
  const [feedFilter, setFeedFilter] = useState('')
  const [selectedFeedEntries, setSelectedFeedEntries] = useState<number[]>([])
  const [showFeedFilters, setShowFeedFilters] = useState(false)

  // Auto-save to localStorage
  useEffect(() => {
    const storageKey = `game-stats-${game.season}-${game.week}-${game.team1_name}-${game.team2_name}`
    
    // Load from localStorage on mount
    const savedData = localStorage.getItem(storageKey)
    if (savedData) {
      try {
        const { stats, hist } = JSON.parse(savedData)
        setPlayerStats(stats)
        setHistory(hist)
      } catch (e) {
        console.error('Failed to load saved stats:', e)
      }
    }
  }, [game.season, game.week, game.team1_name, game.team2_name])

  // Save to localStorage whenever stats or history change
  useEffect(() => {
    const storageKey = `game-stats-${game.season}-${game.week}-${game.team1_name}-${game.team2_name}`
    if (Object.keys(playerStats).length > 0 || history.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify({
        stats: playerStats,
        hist: history
      }))
    }
  }, [playerStats, history, game.season, game.week, game.team1_name, game.team2_name])

  const incrementStat = (playerName: string, statType: keyof PlayerStats[string], statLabel: string, autoIncrement?: { stat: keyof PlayerStats[string]; label: string }) => {
    setPlayerStats(prev => {
      const current = prev[playerName] || {
        passing_tds: 0,
        passes_completed: 0,
        passes_attempted: 0,
        interceptions_thrown: 0,
        receptions: 0,
        targets: 0,
        receiving_tds: 0,
        drops: 0,
        first_downs: 0,
        rushing_tds: 0,
        rush_attempts: 0,
        flag_pulls: 0,
        sacks: 0,
        interceptions: 0,
        pass_breakups: 0,
        def_td: 0,
      }

      const updated = {
        ...current,
        [statType]: current[statType] + 1,
      }

      // Auto-increment related stat (e.g., receptions should also increment targets)
      if (autoIncrement) {
        updated[autoIncrement.stat] = current[autoIncrement.stat] + 1
      }

      return {
        ...prev,
        [playerName]: updated,
      }
    })

    // Add to history
    setHistory(prev => [...prev, { playerName, statType, statLabel, timestamp: Date.now() }])
  }

  const undoLast = () => {
    if (history.length === 0) return

    const lastEntry = history[history.length - 1]
    setPlayerStats(prev => {
      const current = prev[lastEntry.playerName]
      if (!current) return prev

      return {
        ...prev,
        [lastEntry.playerName]: {
          ...current,
          [lastEntry.statType]: Math.max(0, current[lastEntry.statType as keyof typeof current] - 1),
        },
      }
    })

    setHistory(prev => prev.slice(0, -1))
  }

  const submitAllStats = () => {
    Object.entries(playerStats).forEach(([playerName, stats]) => {
      // Only submit if player has any non-zero stats
      const hasStats = Object.values(stats).some(val => val > 0)
      if (hasStats) {
        onSubmit({
          player_name: playerName,
          game_week: game.week,
          game_season: game.season,
          league: game.league,
          team1_name: game.team1_name,
          team2_name: game.team2_name,
          ...stats,
        })
      }
    })

    // Clear stats after submission
    setPlayerStats({})
    setHistory([])
    // Clear localStorage
    const storageKey = `game-stats-${game.season}-${game.week}-${game.team1_name}-${game.team2_name}`
    localStorage.removeItem(storageKey)
  }

  // Bulk undo selected entries
  const undoSelected = () => {
    selectedFeedEntries.forEach(idx => {
      const entry = history[idx]
      if (entry) {
        setPlayerStats(prev => {
          const current = prev[entry.playerName]
          if (!current) return prev
          return {
            ...prev,
            [entry.playerName]: {
              ...current,
              [entry.statType]: Math.max(0, current[entry.statType as keyof typeof current] - 1),
            },
          }
        })
      }
    })
    setHistory(prev => prev.filter((_, idx) => !selectedFeedEntries.includes(idx)))
    setSelectedFeedEntries([])
  }

  // Hot streak detection - player has 3+ actions in last 2 minutes
  const getHotStreakPlayers = () => {
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000
    const recentActions = history.filter(entry => entry.timestamp > twoMinutesAgo)
    const playerCounts: { [key: string]: number } = {}
    recentActions.forEach(entry => {
      playerCounts[entry.playerName] = (playerCounts[entry.playerName] || 0) + 1
    })
    return Object.entries(playerCounts)
      .filter(([_, count]) => count >= 3)
      .map(([playerName]) => playerName)
  }

  const hotStreakPlayers = getHotStreakPlayers()

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const addPlayerToSection = (section: keyof typeof assignedPlayers, playerName: string) => {
    setAssignedPlayers(prev => {
      // Check if already added to prevent duplicates
      if (prev[section].includes(playerName)) {
        return prev
      }
      return {
        ...prev,
        [section]: [...prev[section], playerName]
      }
    })
    setShowPlayerSelector(null)
    setSelectorSearch('') // Clear search when closing
  }

  const removePlayerFromSection = (section: keyof typeof assignedPlayers, playerName: string) => {
    setAssignedPlayers(prev => ({
      ...prev,
      [section]: prev[section].filter(name => name !== playerName)
    }))
  }

  // Filter players by game season first
  const seasonPlayers = players.filter(p => p.season === game.season)

  const filteredPlayers = searchTerm
    ? seasonPlayers.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : seasonPlayers

  // Get players assigned to each section
  const qbPlayers = seasonPlayers.filter(p => assignedPlayers.qb.includes(p.name))
  const wrPlayers = seasonPlayers.filter(p => assignedPlayers.wr.includes(p.name))
  const rbPlayers = seasonPlayers.filter(p => assignedPlayers.rb.includes(p.name))
  const defPlayers = seasonPlayers.filter(p => assignedPlayers.def.includes(p.name))

  // Get available players (not yet assigned to a section) with optional search filter
  const getAvailablePlayersForSection = (section: keyof typeof assignedPlayers) => {
    const available = seasonPlayers.filter(p => !assignedPlayers[section].includes(p.name))
    
    if (!selectorSearch) return available
    
    return available.filter(p => 
      p.name.toLowerCase().includes(selectorSearch.toLowerCase()) ||
      (p.jersey_number && p.jersey_number.includes(selectorSearch))
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Actions Bar */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search players..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      {/* Desktop Action Buttons */}
      <div className="hidden md:flex gap-3 mb-6">
        <Button
          onClick={undoLast}
          disabled={history.length === 0}
          variant="outline"
          className="gap-2"
        >
          <Undo2 className="h-4 w-4" />
          Undo Last
        </Button>
        <Button
          onClick={() => setShowUndoAllConfirm(true)}
          disabled={history.length === 0}
          variant="outline"
          className="gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border-red-300 hover:border-red-400 dark:border-red-700 dark:hover:border-red-600"
        >
          <X className="h-4 w-4" />
          Undo All
        </Button>
        <Button
          onClick={submitAllStats}
          disabled={Object.keys(playerStats).length === 0}
          className="btn-primary gap-2 ml-auto"
        >
          <Plus className="h-4 w-4" />
          Submit All Stats
        </Button>
      </div>

      {/* Mobile Action Buttons */}
      <div className="flex md:hidden flex-col gap-3 mb-6">
        <div className="flex gap-3">
          <Button
            onClick={undoLast}
            disabled={history.length === 0}
            variant="outline"
            className="gap-2 flex-1 min-h-[48px]"
          >
            <Undo2 className="h-4 w-4" />
            Undo Last
          </Button>
          <Button
            onClick={() => setShowUndoAllConfirm(true)}
            disabled={history.length === 0}
            variant="outline"
            className="gap-2 flex-1 min-h-[48px] text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border-red-300 hover:border-red-400 dark:border-red-700 dark:hover:border-red-600"
          >
            <X className="h-4 w-4" />
            Undo All
          </Button>
        </div>
      </div>

      {/* Undo All Confirmation Dialog */}
      {showUndoAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4 shadow-2xl border-2 border-red-300 dark:border-red-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                <X className="h-6 w-6" />
                Clear All Stats?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to undo all entries? This will clear <strong>{history.length} {history.length === 1 ? 'entry' : 'entries'}</strong> and reset all player stats. This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  onClick={() => setShowUndoAllConfirm(false)}
                  variant="outline"
                  className="gap-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setPlayerStats({})
                    setHistory([])
                    setShowUndoAllConfirm(false)
                  }}
                  className="gap-2 bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800"
                >
                  <X className="h-4 w-4" />
                  Yes, Clear All
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Live Game Feed */}
      {history.length > 0 && (
        <Card className="card-modern bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200/50 dark:border-blue-700/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
                Live Game Feed
                <span className="text-sm font-normal text-gray-600 dark:text-gray-400">({history.length} {history.length === 1 ? 'entry' : 'entries'})</span>
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowFeedFilters(!showFeedFilters)}
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1"
                >
                  <Filter className="h-3 w-3" />
                  Filter
                </Button>
                <Button
                  onClick={() => setHistory([])}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Clear Feed
                </Button>
              </div>
            </div>
            {showFeedFilters && (
              <div className="flex gap-3 items-center">
                <Input
                  placeholder="Search player or action..."
                  value={feedFilter}
                  onChange={(e) => setFeedFilter(e.target.value)}
                  className="h-8 text-sm flex-1"
                />
                {selectedFeedEntries.length > 0 && (
                  <Button
                    onClick={undoSelected}
                    size="sm"
                    variant="outline"
                    className="gap-1 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Undo2 className="h-3 w-3" />
                    Undo ({selectedFeedEntries.length})
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.slice().reverse()
                .filter(entry => {
                  if (!feedFilter) return true
                  const searchLower = feedFilter.toLowerCase()
                  return entry.playerName.toLowerCase().includes(searchLower) ||
                         entry.statLabel.toLowerCase().includes(searchLower)
                })
                .map((entry, idx) => {
                const originalIdx = history.length - 1 - idx
                const timeAgo = Math.floor((Date.now() - entry.timestamp) / 1000)
                const timeDisplay = timeAgo < 60 
                  ? `${timeAgo}s ago` 
                  : timeAgo < 3600 
                    ? `${Math.floor(timeAgo / 60)}m ago`
                    : new Date(entry.timestamp).toLocaleTimeString()
                
                const isSelected = selectedFeedEntries.includes(originalIdx)
                const isHotStreak = hotStreakPlayers.includes(entry.playerName)
                
                // Color coding based on stat type
                let bgColor = 'bg-gray-100 dark:bg-gray-800'
                let textColor = 'text-gray-700 dark:text-gray-300'
                let borderColor = 'border-gray-300 dark:border-gray-600'
                
                if (entry.statLabel.includes('TD')) {
                  bgColor = 'bg-green-100 dark:bg-green-900/30'
                  textColor = 'text-green-700 dark:text-green-300'
                  borderColor = 'border-green-300 dark:border-green-600'
                } else if (entry.statLabel.includes('INT') || entry.statLabel.includes('Drop') || entry.statLabel.includes('Incomp')) {
                  bgColor = 'bg-red-100 dark:bg-red-900/30'
                  textColor = 'text-red-700 dark:text-red-300'
                  borderColor = 'border-red-300 dark:border-red-600'
                } else if (entry.statLabel.includes('Pull') || entry.statLabel.includes('Sack')) {
                  bgColor = 'bg-yellow-100 dark:bg-yellow-900/30'
                  textColor = 'text-yellow-700 dark:text-yellow-300'
                  borderColor = 'border-yellow-300 dark:border-yellow-600'
                } else if (entry.statLabel.includes('Rec') || entry.statLabel.includes('Rush') || entry.statLabel.includes('Pass') || entry.statLabel.includes('Completion')) {
                  bgColor = 'bg-blue-100 dark:bg-blue-900/30'
                  textColor = 'text-blue-700 dark:text-blue-300'
                  borderColor = 'border-blue-300 dark:border-blue-600'
                }
                
                return (
                  <div 
                    key={originalIdx}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${bgColor} ${borderColor} ${isSelected ? 'ring-2 ring-blue-500' : ''} hover:shadow-md transition-all group`}
                  >
                    {showFeedFilters && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedFeedEntries(prev => 
                            prev.includes(originalIdx) 
                              ? prev.filter(i => i !== originalIdx)
                              : [...prev, originalIdx]
                          )
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    )}
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        if (showFeedFilters) return
                        // Undo this specific entry
                        const entryToUndo = history[originalIdx]
                        setPlayerStats(prev => {
                          const current = prev[entryToUndo.playerName]
                          if (!current) return prev
                          return {
                            ...prev,
                            [entryToUndo.playerName]: {
                              ...current,
                              [entryToUndo.statType]: Math.max(0, current[entryToUndo.statType as keyof typeof current] - 1),
                            },
                          }
                        })
                        setHistory(prev => prev.filter((_, i) => i !== originalIdx))
                      }}
                      title={showFeedFilters ? "" : "Click to undo this entry"}
                    >
                      <div className={`font-bold ${textColor} flex items-center gap-2`}>
                        {entry.playerName}
                        {isHotStreak && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full animate-pulse">
                            <Flame className="h-3 w-3" />
                            HOT
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {entry.statLabel}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {timeDisplay}
                      </span>
                      {!showFeedFilters && (
                        <X className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* QB Section */}
      <Card className="card-modern border-2 border-blue-200/50 dark:border-blue-600/50 overflow-visible">
        <CardHeader className="overflow-visible">
          <div className="flex items-center justify-between">
            <CardTitle 
              className="flex items-center gap-2 text-blue-700 dark:text-blue-300 cursor-pointer"
              onClick={() => toggleSection('qb')}
            >
              {expandedSections.qb ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              Quarterbacks ({qbPlayers.length})
            </CardTitle>
            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (showPlayerSelector === 'qb') {
                    setShowPlayerSelector(null)
                    setSelectorSearch('')
                  } else {
                    setShowPlayerSelector('qb')
                  }
                }}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Add Player
              </Button>
              {showPlayerSelector === 'qb' && (
                <div className="absolute right-0 top-12 z-50 w-80 bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-600 rounded-lg shadow-xl">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <Input
                      placeholder="Search players..."
                      value={selectorSearch}
                      onChange={(e) => setSelectorSearch(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {getAvailablePlayersForSection('qb').length === 0 ? (
                      <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                        {selectorSearch ? 'No players found' : 'All players added'}
                      </div>
                    ) : (
                      getAvailablePlayersForSection('qb').map(player => (
                        <button
                          key={player.id}
                          onClick={() => addPlayerToSection('qb', player.name)}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-sm border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {player.jersey_number && (
                              <span className="inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs font-bold">
                                #{player.jersey_number}
                              </span>
                            )}
                            <span className="font-medium text-gray-900 dark:text-white">{player.name}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        {expandedSections.qb && (
          <CardContent className="space-y-4">
            {qbPlayers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No players assigned. Click "Add Player" to get started.
              </div>
            ) : (
              qbPlayers.map(player => {
                const stats = playerStats[player.name]
                return (
                  <div key={player.id} className="relative card-bubbly p-4 border-2 border-blue-200/50 dark:border-blue-600/50 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 hover:shadow-lg transition-all duration-300">
                    <button
                      onClick={() => removePlayerFromSection('qb', player.name)}
                      className="absolute top-2 right-2 z-20 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                      title="Remove from this section"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-bl-full"></div>
                    <div className="relative z-10">
                      <div className="mb-3">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                          <span>
                            {player.jersey_number && (
                              <span className="inline-block px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded text-xs font-bold mr-2">
                                #{player.jersey_number}
                              </span>
                            )}
                            {player.name}
                          </span>
                          {hotStreakPlayers.includes(player.name) && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full animate-pulse">
                              <Flame className="h-3 w-3" />
                              ON FIRE
                            </span>
                          )}
                        </h4>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => incrementStat(player.name, 'passing_tds', 'Pass TD')}
                            className="gap-1 relative overflow-hidden bg-gradient-to-br from-blue-100 via-blue-50 to-blue-100 hover:from-blue-200 hover:via-blue-100 hover:to-blue-200 dark:from-blue-900/60 dark:via-blue-800/40 dark:to-blue-900/60 dark:hover:from-blue-800/70 dark:hover:via-blue-700/50 dark:hover:to-blue-800/70 text-blue-700 dark:text-blue-300 border-2 border-blue-200/50 dark:border-blue-700/50 rounded-full shadow-md hover:shadow-lg transition-all font-semibold px-4 min-h-[48px] md:min-h-0 before:absolute before:inset-0 before:rounded-full before:p-[1px] before:bg-gradient-to-br before:from-white/15 before:to-transparent before:pointer-events-none"
                          >
                            <Plus className="h-3 w-3 relative z-10" /> <span className="relative z-10">Pass TD</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              incrementStat(player.name, 'passes_completed', 'Completion')
                              incrementStat(player.name, 'passes_attempted', 'Attempt (auto)')
                            }}
                            className="gap-1 relative overflow-hidden bg-gradient-to-br from-blue-100 via-blue-50 to-blue-100 hover:from-blue-200 hover:via-blue-100 hover:to-blue-200 dark:from-blue-900/60 dark:via-blue-800/40 dark:to-blue-900/60 dark:hover:from-blue-800/70 dark:hover:via-blue-700/50 dark:hover:to-blue-800/70 text-blue-700 dark:text-blue-300 border-2 border-blue-200/50 dark:border-blue-700/50 rounded-full shadow-md hover:shadow-lg transition-all font-semibold px-4 before:absolute before:inset-0 before:rounded-full before:p-[1px] before:bg-gradient-to-br before:from-white/15 before:to-transparent before:pointer-events-none"
                          >
                            <Plus className="h-3 w-3 relative z-10" /> <span className="relative z-10">Comp/Att</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => incrementStat(player.name, 'passes_attempted', 'Incompletion')}
                            className="gap-1 relative overflow-hidden bg-gradient-to-br from-blue-100 via-blue-50 to-blue-100 hover:from-blue-200 hover:via-blue-100 hover:to-blue-200 dark:from-blue-900/60 dark:via-blue-800/40 dark:to-blue-900/60 dark:hover:from-blue-800/70 dark:hover:via-blue-700/50 dark:hover:to-blue-800/70 text-blue-700 dark:text-blue-300 border-2 border-blue-200/50 dark:border-blue-700/50 rounded-full shadow-md hover:shadow-lg transition-all font-semibold px-4 before:absolute before:inset-0 before:rounded-full before:p-[1px] before:bg-gradient-to-br before:from-white/15 before:to-transparent before:pointer-events-none"
                          >
                            <Plus className="h-3 w-3 relative z-10" /> <span className="relative z-10">Incomp</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => incrementStat(player.name, 'interceptions_thrown', 'INT Thrown')}
                            className="gap-1 relative overflow-hidden bg-gradient-to-br from-red-100 via-red-50 to-red-100 hover:from-red-200 hover:via-red-100 hover:to-red-200 dark:from-red-900/60 dark:via-red-800/40 dark:to-red-900/60 dark:hover:from-red-800/70 dark:hover:via-red-700/50 dark:hover:to-red-800/70 text-red-700 dark:text-red-300 border-2 border-red-200/50 dark:border-red-700/50 rounded-full shadow-md hover:shadow-lg transition-all font-semibold px-4 before:absolute before:inset-0 before:rounded-full before:p-[1px] before:bg-gradient-to-br before:from-white/15 before:to-transparent before:pointer-events-none"
                          >
                            <Plus className="h-3 w-3 relative z-10" /> <span className="relative z-10">INT</span>
                          </Button>
                        </div>
                        {stats && (stats.passing_tds > 0 || stats.passes_attempted > 0 || stats.interceptions_thrown > 0) && (
                          <div className="flex items-center gap-6 ml-auto">
                            {stats.passing_tds > 0 && (
                              <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-600 to-green-400 dark:from-green-400 dark:to-green-300 leading-none">
                                  {stats.passing_tds}
                                </span>
                                <span className="text-base font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">TD</span>
                              </div>
                            )}
                            {stats.passes_attempted > 0 && (
                              <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-blue-400 dark:from-blue-400 dark:to-blue-300 leading-none">
                                  {stats.passes_completed}/{stats.passes_attempted}
                                </span>
                                <span className="text-base font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">C/A</span>
                              </div>
                            )}
                            {stats.interceptions_thrown > 0 && (
                              <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-600 to-red-400 dark:from-red-400 dark:to-red-300 leading-none">
                                  {stats.interceptions_thrown}
                                </span>
                                <span className="text-base font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">INT</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                  </div>
                </div>
              )
            })
            )}
          </CardContent>
        )}
      </Card>

      {/* WR Section */}
      <Card className="card-modern border-2 border-purple-200/50 dark:border-purple-600/50 overflow-visible">
        <CardHeader className="overflow-visible">
          <div className="flex items-center justify-between">
            <CardTitle 
              className="flex items-center gap-2 text-purple-700 dark:text-purple-300 cursor-pointer"
              onClick={() => toggleSection('wr')}
            >
              {expandedSections.wr ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              Receivers ({wrPlayers.length})
            </CardTitle>
            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (showPlayerSelector === 'wr') {
                    setShowPlayerSelector(null)
                    setSelectorSearch('')
                  } else {
                    setShowPlayerSelector('wr')
                  }
                }}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Add Player
              </Button>
              {showPlayerSelector === 'wr' && (
                <div className="absolute right-0 top-12 z-50 w-80 bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-600 rounded-lg shadow-xl">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <Input
                      placeholder="Search players..."
                      value={selectorSearch}
                      onChange={(e) => setSelectorSearch(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {getAvailablePlayersForSection('wr').length === 0 ? (
                      <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                        {selectorSearch ? 'No players found' : 'All players added'}
                      </div>
                    ) : (
                      getAvailablePlayersForSection('wr').map(player => (
                        <button
                          key={player.id}
                          onClick={() => addPlayerToSection('wr', player.name)}
                          className="w-full text-left px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/30 text-sm border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {player.jersey_number && (
                              <span className="inline-block px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-xs font-bold">
                                #{player.jersey_number}
                              </span>
                            )}
                            <span className="font-medium text-gray-900 dark:text-white">{player.name}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        {expandedSections.wr && (
          <CardContent className="space-y-4">
            {wrPlayers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No players assigned. Click "Add Player" to get started.
              </div>
            ) : (
              wrPlayers.map(player => {
                const stats = playerStats[player.name]
                return (
                  <div key={player.id} className="relative card-bubbly p-4 border-2 border-purple-200/50 dark:border-purple-600/50 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800 hover:shadow-lg transition-all duration-300">
                    <button
                      onClick={() => removePlayerFromSection('wr', player.name)}
                      className="absolute top-2 right-2 z-20 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                      title="Remove from this section"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-transparent rounded-bl-full"></div>
                    <div className="relative z-10">
                    <div className="mb-3">
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                        <span>
                          {player.jersey_number && (
                            <span className="inline-block px-2 py-0.5 bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 rounded text-xs font-bold mr-2">
                              #{player.jersey_number}
                            </span>
                          )}
                          {player.name}
                        </span>
                        {hotStreakPlayers.includes(player.name) && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full animate-pulse">
                            <Flame className="h-3 w-3" />
                            ON FIRE
                          </span>
                        )}
                      </h4>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => incrementStat(player.name, 'receptions', 'Reception', { stat: 'targets', label: 'Target' })}
                          className="gap-1 relative overflow-hidden bg-gradient-to-br from-purple-100 via-purple-50 to-purple-100 hover:from-purple-200 hover:via-purple-100 hover:to-purple-200 dark:from-purple-900/60 dark:via-purple-800/40 dark:to-purple-900/60 dark:hover:from-purple-800/70 dark:hover:via-purple-700/50 dark:hover:to-purple-800/70 text-purple-700 dark:text-purple-300 border-2 border-purple-200/50 dark:border-purple-700/50 rounded-full shadow-md hover:shadow-lg transition-all font-semibold px-4 before:absolute before:inset-0 before:rounded-full before:p-[1px] before:bg-gradient-to-br before:from-white/15 before:to-transparent before:pointer-events-none"
                        >
                          <Plus className="h-3 w-3 relative z-10" /> <span className="relative z-10">Rec</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => incrementStat(player.name, 'targets', 'Target (Miss)')}
                          className="gap-1 relative overflow-hidden bg-gradient-to-br from-purple-100 via-purple-50 to-purple-100 hover:from-purple-200 hover:via-purple-100 hover:to-purple-200 dark:from-purple-900/60 dark:via-purple-800/40 dark:to-purple-900/60 dark:hover:from-purple-800/70 dark:hover:via-purple-700/50 dark:hover:to-purple-800/70 text-purple-700 dark:text-purple-300 border-2 border-purple-200/50 dark:border-purple-700/50 rounded-full shadow-md hover:shadow-lg transition-all font-semibold px-4 before:absolute before:inset-0 before:rounded-full before:p-[1px] before:bg-gradient-to-br before:from-white/15 before:to-transparent before:pointer-events-none"
                        >
                          <Plus className="h-3 w-3 relative z-10" /> <span className="relative z-10">Target</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            incrementStat(player.name, 'receiving_tds', 'Rec TD')
                            incrementStat(player.name, 'receptions', 'Reception (auto)')
                            incrementStat(player.name, 'targets', 'Target (auto)')
                          }}
                          className="gap-1 relative overflow-hidden bg-gradient-to-br from-green-100 via-green-50 to-green-100 hover:from-green-200 hover:via-green-100 hover:to-green-200 dark:from-green-900/60 dark:via-green-800/40 dark:to-green-900/60 dark:hover:from-green-800/70 dark:hover:via-green-700/50 dark:hover:to-green-800/70 text-green-700 dark:text-green-300 border-2 border-green-200/50 dark:border-green-700/50 rounded-full shadow-md hover:shadow-lg transition-all font-semibold px-4 before:absolute before:inset-0 before:rounded-full before:p-[1px] before:bg-gradient-to-br before:from-white/15 before:to-transparent before:pointer-events-none"
                        >
                          <Plus className="h-3 w-3 relative z-10" /> <span className="relative z-10">TD Catch</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => incrementStat(player.name, 'drops', 'Drop')}
                          className="gap-1 relative overflow-hidden bg-gradient-to-br from-red-100 via-red-50 to-red-100 hover:from-red-200 hover:via-red-100 hover:to-red-200 dark:from-red-900/60 dark:via-red-800/40 dark:to-red-900/60 dark:hover:from-red-800/70 dark:hover:via-red-700/50 dark:hover:to-red-800/70 text-red-700 dark:text-red-300 border-2 border-red-200/50 dark:border-red-700/50 rounded-full shadow-md hover:shadow-lg transition-all font-semibold px-4 before:absolute before:inset-0 before:rounded-full before:p-[1px] before:bg-gradient-to-br before:from-white/15 before:to-transparent before:pointer-events-none"
                        >
                          <Plus className="h-3 w-3 relative z-10" /> <span className="relative z-10">Drop</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => incrementStat(player.name, 'first_downs', '1st Down')}
                          className="gap-1 relative overflow-hidden bg-gradient-to-br from-purple-100 via-purple-50 to-purple-100 hover:from-purple-200 hover:via-purple-100 hover:to-purple-200 dark:from-purple-900/60 dark:via-purple-800/40 dark:to-purple-900/60 dark:hover:from-purple-800/70 dark:hover:via-purple-700/50 dark:hover:to-purple-800/70 text-purple-700 dark:text-purple-300 border-2 border-purple-200/50 dark:border-purple-700/50 rounded-full shadow-md hover:shadow-lg transition-all font-semibold px-4 before:absolute before:inset-0 before:rounded-full before:p-[1px] before:bg-gradient-to-br before:from-white/15 before:to-transparent before:pointer-events-none"
                        >
                          <Plus className="h-3 w-3 relative z-10" /> <span className="relative z-10">1st</span>
                        </Button>
                      </div>
                      {stats && (stats.receptions > 0 || stats.targets > 0 || stats.receiving_tds > 0 || stats.drops > 0 || stats.first_downs > 0) && (
                        <div className="flex items-center gap-6 ml-auto">
                          {stats.receptions > 0 && (
                            <div className="flex items-baseline gap-2">
                              <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-600 to-purple-400 dark:from-purple-400 dark:to-purple-300 leading-none">
                                {stats.receptions}/{stats.targets}
                              </span>
                              <span className="text-base font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">REC</span>
                            </div>
                          )}
                          {stats.receiving_tds > 0 && (
                            <div className="flex items-baseline gap-2">
                              <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-600 to-green-400 dark:from-green-400 dark:to-green-300 leading-none">
                                {stats.receiving_tds}
                              </span>
                              <span className="text-base font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">TD</span>
                            </div>
                          )}
                          {stats.drops > 0 && (
                            <div className="flex items-baseline gap-2">
                              <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-600 to-red-400 dark:from-red-400 dark:to-red-300 leading-none">
                                {stats.drops}
                              </span>
                              <span className="text-base font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">DROP</span>
                            </div>
                          )}
                          {stats.first_downs > 0 && (
                            <div className="flex items-baseline gap-2">
                              <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-blue-400 dark:from-blue-400 dark:to-blue-300 leading-none">
                                {stats.first_downs}
                              </span>
                              <span className="text-base font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">1ST</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
            )}
          </CardContent>
        )}
      </Card>

      {/* RB Section */}
      <Card className="card-modern border-2 border-orange-200/50 dark:border-orange-600/50 overflow-visible">
        <CardHeader className="overflow-visible">
          <div className="flex items-center justify-between">
            <CardTitle 
              className="flex items-center gap-2 text-orange-700 dark:text-orange-300 cursor-pointer"
              onClick={() => toggleSection('rb')}
            >
              {expandedSections.rb ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              Rushers ({rbPlayers.length})
            </CardTitle>
            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (showPlayerSelector === 'rb') {
                    setShowPlayerSelector(null)
                    setSelectorSearch('')
                  } else {
                    setShowPlayerSelector('rb')
                  }
                }}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Add Player
              </Button>
              {showPlayerSelector === 'rb' && (
                <div className="absolute right-0 top-12 z-50 w-80 bg-white dark:bg-gray-800 border-2 border-orange-300 dark:border-orange-600 rounded-lg shadow-xl">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <Input
                      placeholder="Search players..."
                      value={selectorSearch}
                      onChange={(e) => setSelectorSearch(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {getAvailablePlayersForSection('rb').length === 0 ? (
                      <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                        {selectorSearch ? 'No players found' : 'All players added'}
                      </div>
                    ) : (
                      getAvailablePlayersForSection('rb').map(player => (
                        <button
                          key={player.id}
                          onClick={() => addPlayerToSection('rb', player.name)}
                          className="w-full text-left px-4 py-3 hover:bg-orange-50 dark:hover:bg-orange-900/30 text-sm border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {player.jersey_number && (
                              <span className="inline-block px-2 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded text-xs font-bold">
                                #{player.jersey_number}
                              </span>
                            )}
                            <span className="font-medium text-gray-900 dark:text-white">{player.name}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        {expandedSections.rb && (
          <CardContent className="space-y-4">
            {rbPlayers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No players assigned. Click "Add Player" to get started.
              </div>
            ) : (
              rbPlayers.map(player => {
                const stats = playerStats[player.name]
                return (
                  <div key={player.id} className="relative card-bubbly p-4 border-2 border-orange-200/50 dark:border-orange-600/50 bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-gray-800 hover:shadow-lg transition-all duration-300">
                    <button
                      onClick={() => removePlayerFromSection('rb', player.name)}
                      className="absolute top-2 right-2 z-20 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                      title="Remove from this section"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-transparent rounded-bl-full"></div>
                    <div className="relative z-10">
                      <div className="mb-3">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                          <span>
                            {player.jersey_number && (
                              <span className="inline-block px-2 py-0.5 bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-300 rounded text-xs font-bold mr-2">
                                #{player.jersey_number}
                              </span>
                            )}
                            {player.name}
                          </span>
                          {hotStreakPlayers.includes(player.name) && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full animate-pulse">
                              <Flame className="h-3 w-3" />
                              ON FIRE
                            </span>
                          )}
                        </h4>
                      </div>
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => incrementStat(player.name, 'rush_attempts', 'Rush Attempt')}
                            className="gap-1 relative overflow-hidden bg-gradient-to-br from-orange-100 via-orange-50 to-orange-100 hover:from-orange-200 hover:via-orange-100 hover:to-orange-200 dark:from-orange-900/60 dark:via-orange-800/40 dark:to-orange-900/60 dark:hover:from-orange-800/70 dark:hover:via-orange-700/50 dark:hover:to-orange-800/70 text-orange-700 dark:text-orange-300 border-2 border-orange-200/50 dark:border-orange-700/50 rounded-full shadow-md hover:shadow-lg transition-all font-semibold px-4 before:absolute before:inset-0 before:rounded-full before:p-[1px] before:bg-gradient-to-br before:from-white/15 before:to-transparent before:pointer-events-none"
                          >
                            <Plus className="h-3 w-3 relative z-10" /> <span className="relative z-10">Rush</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              incrementStat(player.name, 'rushing_tds', 'Rush TD')
                              incrementStat(player.name, 'rush_attempts', 'Rush Attempt (auto)')
                            }}
                            className="gap-1 relative overflow-hidden bg-gradient-to-br from-green-100 via-green-50 to-green-100 hover:from-green-200 hover:via-green-100 hover:to-green-200 dark:from-green-900/60 dark:via-green-800/40 dark:to-green-900/60 dark:hover:from-green-800/70 dark:hover:via-green-700/50 dark:hover:to-green-800/70 text-green-700 dark:text-green-300 border-2 border-green-200/50 dark:border-green-700/50 rounded-full shadow-md hover:shadow-lg transition-all font-semibold px-4 before:absolute before:inset-0 before:rounded-full before:p-[1px] before:bg-gradient-to-br before:from-white/15 before:to-transparent before:pointer-events-none"
                          >
                            <Plus className="h-3 w-3 relative z-10" /> <span className="relative z-10">Rush TD</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => incrementStat(player.name, 'first_downs', '1st Down')}
                            className="gap-1 relative overflow-hidden bg-gradient-to-br from-orange-100 via-orange-50 to-orange-100 hover:from-orange-200 hover:via-orange-100 hover:to-orange-200 dark:from-orange-900/60 dark:via-orange-800/40 dark:to-orange-900/60 dark:hover:from-orange-800/70 dark:hover:via-orange-700/50 dark:hover:to-orange-800/70 text-orange-700 dark:text-orange-300 border-2 border-orange-200/50 dark:border-orange-700/50 rounded-full shadow-md hover:shadow-lg transition-all font-semibold px-4 before:absolute before:inset-0 before:rounded-full before:p-[1px] before:bg-gradient-to-br before:from-white/15 before:to-transparent before:pointer-events-none"
                          >
                            <Plus className="h-3 w-3 relative z-10" /> <span className="relative z-10">1st</span>
                          </Button>
                        </div>
                        {stats && (stats.rush_attempts > 0 || stats.rushing_tds > 0 || stats.first_downs > 0) && (
                          <div className="flex items-center gap-6 ml-auto">
                            {stats.rush_attempts > 0 && (
                              <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-600 to-orange-400 dark:from-orange-400 dark:to-orange-300 leading-none">
                                  {stats.rush_attempts}
                                </span>
                                <span className="text-base font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide">ATT</span>
                              </div>
                            )}
                            {stats.rushing_tds > 0 && (
                              <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-600 to-green-400 dark:from-green-400 dark:to-green-300 leading-none">
                                  {stats.rushing_tds}
                                </span>
                                <span className="text-base font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">TD</span>
                              </div>
                            )}
                            {stats.first_downs > 0 && (
                              <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-blue-400 dark:from-blue-400 dark:to-blue-300 leading-none">
                                  {stats.first_downs}
                                </span>
                                <span className="text-base font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">1ST</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        )}
      </Card>

      {/* Defense Section */}
      <Card className="card-modern border-2 border-red-200/50 dark:border-red-600/50 overflow-visible">
        <CardHeader className="overflow-visible">
          <div className="flex items-center justify-between">
            <CardTitle 
              className="flex items-center gap-2 text-red-700 dark:text-red-300 cursor-pointer"
              onClick={() => toggleSection('def')}
            >
              {expandedSections.def ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              Defense ({defPlayers.length})
            </CardTitle>
            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (showPlayerSelector === 'def') {
                    setShowPlayerSelector(null)
                    setSelectorSearch('')
                  } else {
                    setShowPlayerSelector('def')
                  }
                }}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Add Player
              </Button>
              {showPlayerSelector === 'def' && (
                <div className="absolute right-0 bottom-12 z-50 w-80 bg-white dark:bg-gray-800 border-2 border-red-300 dark:border-red-600 rounded-lg shadow-xl">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <Input
                      placeholder="Search players..."
                      value={selectorSearch}
                      onChange={(e) => setSelectorSearch(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {getAvailablePlayersForSection('def').length === 0 ? (
                      <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                        {selectorSearch ? 'No players found' : 'All players added'}
                      </div>
                    ) : (
                      getAvailablePlayersForSection('def').map(player => (
                        <button
                          key={player.id}
                          onClick={() => addPlayerToSection('def', player.name)}
                          className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/30 text-sm border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {player.jersey_number && (
                              <span className="inline-block px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-xs font-bold">
                                #{player.jersey_number}
                              </span>
                            )}
                            <span className="font-medium text-gray-900 dark:text-white">{player.name}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        {expandedSections.def && (
          <CardContent className="space-y-4">
            {defPlayers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No players assigned. Click "Add Player" to get started.
              </div>
            ) : (
              defPlayers.map(player => {
                const stats = playerStats[player.name]
                return (
                  <div key={player.id} className="relative card-bubbly p-4 border-2 border-red-200/50 dark:border-red-600/50 bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-gray-800 hover:shadow-lg transition-all duration-300">
                    <button
                      onClick={() => removePlayerFromSection('def', player.name)}
                      className="absolute top-2 right-2 z-20 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                      title="Remove from this section"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-400/20 to-transparent rounded-bl-full"></div>
                    <div className="relative z-10">
                      <div className="mb-3">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                          <span>
                            {player.jersey_number && (
                              <span className="inline-block px-2 py-0.5 bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300 rounded text-xs font-bold mr-2">
                                #{player.jersey_number}
                              </span>
                            )}
                            {player.name}
                          </span>
                          {hotStreakPlayers.includes(player.name) && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full animate-pulse">
                              <Flame className="h-3 w-3" />
                              ON FIRE
                            </span>
                          )}
                        </h4>
                      </div>
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => incrementStat(player.name, 'flag_pulls', 'Flag Pull')}
                            className="gap-1 relative overflow-hidden bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-100 hover:from-yellow-200 hover:via-yellow-100 hover:to-yellow-200 dark:from-yellow-900/60 dark:via-yellow-800/40 dark:to-yellow-900/60 dark:hover:from-yellow-800/70 dark:hover:via-yellow-700/50 dark:hover:to-yellow-800/70 text-yellow-700 dark:text-yellow-300 border-2 border-yellow-200/50 dark:border-yellow-700/50 rounded-full shadow-md hover:shadow-lg transition-all font-semibold px-4 before:absolute before:inset-0 before:rounded-full before:p-[1px] before:bg-gradient-to-br before:from-white/15 before:to-transparent before:pointer-events-none"
                          >
                            <Plus className="h-3 w-3 relative z-10" /> <span className="relative z-10">Pull</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => incrementStat(player.name, 'sacks', 'Sack')}
                            className="gap-1 relative overflow-hidden bg-gradient-to-br from-orange-100 via-orange-50 to-orange-100 hover:from-orange-200 hover:via-orange-100 hover:to-orange-200 dark:from-orange-900/60 dark:via-orange-800/40 dark:to-orange-900/60 dark:hover:from-orange-800/70 dark:hover:via-orange-700/50 dark:hover:to-orange-800/70 text-orange-700 dark:text-orange-300 border-2 border-orange-200/50 dark:border-orange-700/50 rounded-full shadow-md hover:shadow-lg transition-all font-semibold px-4 before:absolute before:inset-0 before:rounded-full before:p-[1px] before:bg-gradient-to-br before:from-white/15 before:to-transparent before:pointer-events-none"
                          >
                            <Plus className="h-3 w-3 relative z-10" /> <span className="relative z-10">Sack</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => incrementStat(player.name, 'interceptions', 'Interception')}
                            className="gap-1 relative overflow-hidden bg-gradient-to-br from-purple-100 via-purple-50 to-purple-100 hover:from-purple-200 hover:via-purple-100 hover:to-purple-200 dark:from-purple-900/60 dark:via-purple-800/40 dark:to-purple-900/60 dark:hover:from-purple-800/70 dark:hover:via-purple-700/50 dark:hover:to-purple-800/70 text-purple-700 dark:text-purple-300 border-2 border-purple-200/50 dark:border-purple-700/50 rounded-full shadow-md hover:shadow-lg transition-all font-semibold px-4 before:absolute before:inset-0 before:rounded-full before:p-[1px] before:bg-gradient-to-br before:from-white/15 before:to-transparent before:pointer-events-none"
                          >
                            <Plus className="h-3 w-3 relative z-10" /> <span className="relative z-10">INT</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => incrementStat(player.name, 'pass_breakups', 'Pass Breakup')}
                            className="gap-1 relative overflow-hidden bg-gradient-to-br from-blue-100 via-blue-50 to-blue-100 hover:from-blue-200 hover:via-blue-100 hover:to-blue-200 dark:from-blue-900/60 dark:via-blue-800/40 dark:to-blue-900/60 dark:hover:from-blue-800/70 dark:hover:via-blue-700/50 dark:hover:to-blue-800/70 text-blue-700 dark:text-blue-300 border-2 border-blue-200/50 dark:border-blue-700/50 rounded-full shadow-md hover:shadow-lg transition-all font-semibold px-4 before:absolute before:inset-0 before:rounded-full before:p-[1px] before:bg-gradient-to-br before:from-white/15 before:to-transparent before:pointer-events-none"
                          >
                            <Plus className="h-3 w-3 relative z-10" /> <span className="relative z-10">PBU</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => incrementStat(player.name, 'def_td', 'Def TD')}
                            className="gap-1 relative overflow-hidden bg-gradient-to-br from-green-100 via-green-50 to-green-100 hover:from-green-200 hover:via-green-100 hover:to-green-200 dark:from-green-900/60 dark:via-green-800/40 dark:to-green-900/60 dark:hover:from-green-800/70 dark:hover:via-green-700/50 dark:hover:to-green-800/70 text-green-700 dark:text-green-300 border-2 border-green-200/50 dark:border-green-700/50 rounded-full shadow-md hover:shadow-lg transition-all font-semibold px-4 before:absolute before:inset-0 before:rounded-full before:p-[1px] before:bg-gradient-to-br before:from-white/15 before:to-transparent before:pointer-events-none"
                          >
                            <Plus className="h-3 w-3 relative z-10" /> <span className="relative z-10">Def TD</span>
                          </Button>
                        </div>
                        {stats && (stats.flag_pulls > 0 || stats.sacks > 0 || stats.interceptions > 0 || stats.pass_breakups > 0 || stats.def_td > 0) && (
                          <div className="flex items-center gap-4 ml-auto">
                            {stats.flag_pulls > 0 && (
                              <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-600 to-yellow-400 dark:from-yellow-400 dark:to-yellow-300 leading-none">
                                  {stats.flag_pulls}
                                </span>
                                <span className="text-base font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">PULL</span>
                              </div>
                            )}
                            {stats.sacks > 0 && (
                              <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-600 to-orange-400 dark:from-orange-400 dark:to-orange-300 leading-none">
                                  {stats.sacks}
                                </span>
                                <span className="text-base font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide">SACK</span>
                              </div>
                            )}
                            {stats.interceptions > 0 && (
                              <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-600 to-purple-400 dark:from-purple-400 dark:to-purple-300 leading-none">
                                  {stats.interceptions}
                                </span>
                                <span className="text-base font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">INT</span>
                              </div>
                            )}
                            {stats.pass_breakups > 0 && (
                              <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-blue-400 dark:from-blue-400 dark:to-blue-300 leading-none">
                                  {stats.pass_breakups}
                                </span>
                                <span className="text-base font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">PBU</span>
                              </div>
                            )}
                            {stats.def_td > 0 && (
                              <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-600 to-green-400 dark:from-green-400 dark:to-green-300 leading-none">
                                  {stats.def_td}
                                </span>
                                <span className="text-base font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">DEF TD</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        )}
      </Card>

      {/* Mobile Sticky Submit Button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t-2 border-blue-300 dark:border-blue-700 shadow-lg z-40">
        <Button
          onClick={submitAllStats}
          disabled={Object.keys(playerStats).length === 0}
          className="btn-primary w-full min-h-[56px] text-lg font-bold gap-2 shadow-xl"
        >
          <Plus className="h-5 w-5" />
          Submit All Stats
          {Object.keys(playerStats).length > 0 && (
            <span className="ml-auto bg-white/20 px-3 py-1 rounded-full text-sm">
              {Object.keys(playerStats).length} {Object.keys(playerStats).length === 1 ? 'player' : 'players'}
            </span>
          )}
        </Button>
      </div>

      {/* Spacer for mobile sticky button */}
      <div className="md:hidden h-24"></div>
    </div>
  )
}
