'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Game, PlayerStats } from '@/lib/api'
import { Trophy, Target, Zap, Shield, TrendingUp, Users } from 'lucide-react'
import { useGamesWithRealtime, usePlayerStatsWithRealtime } from '@/hooks'

export function StatsViewer() {
  const searchParams = useSearchParams()
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [viewMode, setViewMode] = useState<'game' | 'season'>('game')

  // Queries with realtime updates
  const { data: games = [], isLoading: gamesLoading } = useGamesWithRealtime()
  const { data: allStats = [], isLoading: statsLoading } = usePlayerStatsWithRealtime()

  // Get unique seasons
  const seasons = Array.from(new Set(games.map(g => g.season))).sort((a, b) => b - a)

  // Auto-select game from URL parameter
  useEffect(() => {
    const gameId = searchParams.get('gameId')
    if (gameId && games.length > 0 && !selectedGame) {
      const game = games.find(g => g.id === parseInt(gameId))
      if (game) {
        setSelectedSeason(game.season)
        setSelectedGame(game)
      }
    }
  }, [searchParams, games, selectedGame])

  // Filter games by selected season
  const seasonGames = selectedSeason 
    ? games.filter(g => g.season === selectedSeason).sort((a, b) => b.week - a.week)
    : []

  // Get stats for selected game
  const gameStats = selectedGame
    ? allStats.filter(stat => stat.game_id === selectedGame.id)
    : []

  // Group stats by category
  const qbStats = gameStats.filter(s => s.passing_tds > 0 || s.passes_attempted > 0)
  const receiverStats = gameStats.filter(s => s.receptions > 0 || s.targets > 0)
  const rushingStats = gameStats.filter(s => s.rushing_tds > 0 || s.rush_attempts > 0)
  const defenseStats = gameStats.filter(s => s.flag_pulls > 0 || s.interceptions > 0 || s.pass_breakups > 0 || s.sacks > 0)

  if (gamesLoading || statsLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Game Statistics</h2>
            <p className="text-gray-600">View player stats for each game</p>
          </div>
        </div>
        <div className="card-modern p-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading statistics...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Get season stats (aggregated)
  const seasonStats = selectedSeason && viewMode === 'season'
    ? allStats.filter(stat => {
        const game = games.find(g => g.id === stat.game_id)
        return game && game.season === selectedSeason
      })
    : []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Statistics</h2>
          <p className="text-gray-600 dark:text-gray-400">View game stats and season leaderboards</p>
        </div>
        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode('game')}
            variant={viewMode === 'game' ? 'default' : 'outline'}
            className={viewMode === 'game' ? 'btn-primary' : 'btn-secondary'}
          >
            Game Stats
          </Button>
          <Button
            onClick={() => setViewMode('season')}
            variant={viewMode === 'season' ? 'default' : 'outline'}
            className={viewMode === 'season' ? 'btn-primary' : 'btn-secondary'}
          >
            Season Leaders
          </Button>
        </div>
      </div>

      {/* Stats Display - Show first if game is selected */}
      {selectedGame && (
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-600" />
              Game Stats
            </CardTitle>
            <CardDescription>
              Week {selectedGame.week} - {selectedGame.team1_name} vs {selectedGame.team2_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {gameStats.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No stats recorded for this game yet</p>
              </div>
            ) : (
              <Tabs defaultValue="qb" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="qb" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    QB ({qbStats.length})
                  </TabsTrigger>
                  <TabsTrigger value="receiver" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    WR ({receiverStats.length})
                  </TabsTrigger>
                  <TabsTrigger value="rushing" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    RB ({rushingStats.length})
                  </TabsTrigger>
                  <TabsTrigger value="defense" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    DEF ({defenseStats.length})
                  </TabsTrigger>
                </TabsList>

                {/* QB Stats */}
                <TabsContent value="qb" className="space-y-4 mt-6">
                  {qbStats.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No QB stats recorded</p>
                  ) : (
                    qbStats.map(stat => (
                      <div key={stat.id} className="relative card-bubbly p-4 sm:p-6 border-2 border-blue-200/50 dark:border-blue-600/50 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 hover:shadow-xl transition-all duration-300">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/10 to-transparent rounded-bl-full"></div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 relative z-10">{stat.player_name}</h3>
                        
                        {/* Desktop: Grid of boxes */}
                        <div className="hidden md:grid md:grid-cols-5 gap-4">
                          <StatBox label="Pass TDs" value={stat.passing_tds} color="blue" />
                          <StatBox label="Completions" value={stat.passes_completed} color="blue" />
                          <StatBox label="Attempts" value={stat.passes_attempted} color="blue" />
                          <StatBox label="INTs" value={stat.interceptions_thrown} color="red" />
                          <StatBox label="1st Downs" value={stat.first_downs} color="green" />
                        </div>

                        {/* Mobile: Table */}
                        <div className="md:hidden relative z-10">
                          <StatTable stats={[
                            { label: 'Pass TDs', value: stat.passing_tds, color: 'blue' },
                            { label: 'Completions', value: stat.passes_completed, color: 'blue' },
                            { label: 'Attempts', value: stat.passes_attempted, color: 'blue' },
                            { label: 'Interceptions', value: stat.interceptions_thrown, color: 'red' },
                            { label: '1st Downs', value: stat.first_downs, color: 'green' },
                          ]} />
                        </div>

                        {stat.passes_attempted > 0 && (
                          <div className="mt-3 sm:mt-4 text-sm text-gray-600 dark:text-gray-400 relative z-10">
                            Completion %: {((stat.passes_completed / stat.passes_attempted) * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </TabsContent>

                {/* Receiver Stats */}
                <TabsContent value="receiver" className="space-y-4 mt-6">
                  {receiverStats.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No receiver stats recorded</p>
                  ) : (
                    receiverStats.map(stat => (
                      <div key={stat.id} className="relative card-bubbly p-4 sm:p-6 border-2 border-purple-200/50 dark:border-purple-600/50 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800 hover:shadow-xl transition-all duration-300">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/10 to-transparent rounded-bl-full"></div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 relative z-10">{stat.player_name}</h3>
                        
                        {/* Desktop: Grid of boxes */}
                        <div className="hidden md:grid md:grid-cols-5 gap-4">
                          <StatBox label="Receptions" value={stat.receptions} color="purple" />
                          <StatBox label="Targets" value={stat.targets} color="purple" />
                          <StatBox label="Rec TDs" value={stat.receiving_tds} color="green" />
                          <StatBox label="Drops" value={stat.drops} color="red" />
                          <StatBox label="1st Downs" value={stat.first_downs} color="green" />
                        </div>

                        {/* Mobile: Table */}
                        <div className="md:hidden relative z-10">
                          <StatTable stats={[
                            { label: 'Receptions', value: stat.receptions, color: 'purple' },
                            { label: 'Targets', value: stat.targets, color: 'purple' },
                            { label: 'Receiving TDs', value: stat.receiving_tds, color: 'green' },
                            { label: 'Drops', value: stat.drops, color: 'red' },
                            { label: '1st Downs', value: stat.first_downs, color: 'green' },
                          ]} />
                        </div>

                        {stat.targets > 0 && (
                          <div className="mt-3 sm:mt-4 text-sm text-gray-600 dark:text-gray-400 relative z-10">
                            Catch %: {((stat.receptions / stat.targets) * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </TabsContent>

                {/* Rushing Stats */}
                <TabsContent value="rushing" className="space-y-4 mt-6">
                  {rushingStats.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No rushing stats recorded</p>
                  ) : (
                    rushingStats.map(stat => (
                      <div key={stat.id} className="relative card-bubbly p-4 sm:p-6 border-2 border-orange-200/50 dark:border-orange-600/50 bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-gray-800 hover:shadow-xl transition-all duration-300">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-400/10 to-transparent rounded-bl-full"></div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 relative z-10">{stat.player_name}</h3>
                        
                        {/* Desktop: Grid of boxes */}
                        <div className="hidden md:grid md:grid-cols-3 gap-4">
                          <StatBox label="Rush TDs" value={stat.rushing_tds} color="orange" />
                          <StatBox label="Rush Attempts" value={stat.rush_attempts} color="orange" />
                          <StatBox label="1st Downs" value={stat.first_downs} color="green" />
                        </div>

                        {/* Mobile: Table */}
                        <div className="md:hidden relative z-10">
                          <StatTable stats={[
                            { label: 'Rushing TDs', value: stat.rushing_tds, color: 'orange' },
                            { label: 'Rush Attempts', value: stat.rush_attempts, color: 'orange' },
                            { label: '1st Downs', value: stat.first_downs, color: 'green' },
                          ]} />
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                {/* Defense Stats */}
                <TabsContent value="defense" className="space-y-4 mt-6">
                  {defenseStats.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No defense stats recorded</p>
                  ) : (
                    defenseStats.map(stat => (
                      <div key={stat.id} className="relative card-bubbly p-4 sm:p-6 border-2 border-red-200/50 dark:border-red-600/50 bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-gray-800 hover:shadow-xl transition-all duration-300">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-400/10 to-transparent rounded-bl-full"></div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 relative z-10">{stat.player_name}</h3>
                        
                        {/* Desktop: Grid of boxes */}
                        <div className="hidden md:grid md:grid-cols-5 gap-4">
                          <StatBox label="Flag Pulls" value={stat.flag_pulls} color={getColorByValue(stat.flag_pulls)} />
                          <StatBox label="Sacks" value={stat.sacks} color={getColorByValue(stat.sacks)} />
                          <StatBox label="INTs" value={stat.interceptions} color={getColorByValue(stat.interceptions)} />
                          <StatBox label="Pass Breakups" value={stat.pass_breakups} color={getColorByValue(stat.pass_breakups)} />
                          <StatBox label="Def TDs" value={stat.def_td} color={getColorByValue(stat.def_td)} />
                        </div>

                        {/* Mobile: Table */}
                        <div className="md:hidden relative z-10">
                          <StatTable stats={[
                            { label: 'Flag Pulls', value: stat.flag_pulls, color: getColorByValue(stat.flag_pulls) },
                            { label: 'Sacks', value: stat.sacks, color: getColorByValue(stat.sacks) },
                            { label: 'Interceptions', value: stat.interceptions, color: getColorByValue(stat.interceptions) },
                            { label: 'Pass Breakups', value: stat.pass_breakups, color: getColorByValue(stat.pass_breakups) },
                            { label: 'Defensive TDs', value: stat.def_td, color: getColorByValue(stat.def_td) },
                          ]} />
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}

      {/* Season Selection */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-red-600" />
            Select Season
          </CardTitle>
          <CardDescription>Choose a season to view {viewMode === 'game' ? 'games' : 'leaderboards'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {seasons.map(season => (
              <Button
                key={season}
                onClick={() => {
                  setSelectedSeason(season)
                  setSelectedGame(null)
                }}
                variant={selectedSeason === season ? 'default' : 'outline'}
                className={selectedSeason === season ? 'btn-primary' : 'btn-secondary'}
              >
                Season {season}
              </Button>
            ))}
          </div>
          {seasons.length === 0 && (
            <p className="text-gray-500 text-center py-4">No seasons available</p>
          )}
        </CardContent>
      </Card>

      {/* Season Leaderboard */}
      {selectedSeason && viewMode === 'season' && (
        <SeasonLeaderboard stats={seasonStats} season={selectedSeason} />
      )}

      {/* Game Selection */}
      {selectedSeason && viewMode === 'game' && (
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-red-600" />
              Select Game
            </CardTitle>
            <CardDescription>Season {selectedSeason} Games</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {seasonGames.map(game => (
                <button
                  key={game.id}
                  onClick={() => setSelectedGame(game)}
                  className={`relative w-full text-left p-5 rounded-xl border-2 transition-all duration-300 ${
                    selectedGame?.id === game.id
                      ? 'border-red-500 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 shadow-lg shadow-red-500/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:shadow-md'
                  }`}
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-400/10 to-transparent rounded-bl-full"></div>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-block px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-bold">
                          Week {game.week}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{game.league}</span>
                      </div>
                      <div className="font-bold text-gray-900 dark:text-white">
                        {game.team1_name} <span className="text-red-600 dark:text-red-400">({game.team1_score})</span>
                        <span className="text-gray-400 dark:text-gray-500 mx-2">vs</span>
                        {game.team2_name} <span className="text-red-600 dark:text-red-400">({game.team2_score})</span>
                      </div>
                    </div>
                    {game.winning_team_name && (
                      <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 px-3 py-1.5 rounded-lg border border-yellow-300 dark:border-yellow-700">
                        <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                        <span className="font-bold text-yellow-800 dark:text-yellow-300 text-sm">{game.winning_team_name}</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
              {seasonGames.length === 0 && (
                <p className="text-gray-500 text-center py-8">No games found for Season {selectedSeason}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Helper function to determine color based on stat value
function getColorByValue(value: number): string {
  if (value === 0) return 'red'      // No stats - red
  if (value <= 2) return 'orange'    // Low stats - orange
  if (value <= 4) return 'purple'    // Medium stats - purple
  if (value <= 6) return 'blue'      // Good stats - blue
  return 'green'                     // Great stats - green
}

// Helper component for stat boxes (desktop)
function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 shadow-sm shadow-blue-500/20',
    purple: 'bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-800/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700 shadow-sm shadow-purple-500/20',
    orange: 'bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/40 dark:to-orange-800/20 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700 shadow-sm shadow-orange-500/20',
    green: 'bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-800/20 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 shadow-sm shadow-green-500/20',
    red: 'bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-800/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 shadow-sm shadow-red-500/20',
  }

  return (
    <div className={`rounded-xl p-4 border-2 transition-all duration-300 hover:scale-105 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs font-semibold mt-1 uppercase tracking-wide">{label}</div>
    </div>
  )
}

// Helper component for stat table (mobile)
function StatTable({ stats }: { stats: Array<{ label: string; value: number; color: string }> }) {
  const getTextColor = (color: string) => {
    const colors = {
      blue: 'text-blue-700 dark:text-blue-300',
      purple: 'text-purple-700 dark:text-purple-300',
      orange: 'text-orange-700 dark:text-orange-300',
      green: 'text-green-700 dark:text-green-300',
      red: 'text-red-700 dark:text-red-300',
    }
    return colors[color as keyof typeof colors] || 'text-gray-700 dark:text-gray-300'
  }

  return (
    <div className="border-2 border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
      <table className="w-full">
        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
          {stats.map((stat, index) => (
            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <td className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {stat.label}
              </td>
              <td className={`px-4 py-3 text-right text-2xl font-bold ${getTextColor(stat.color)}`}>
                {stat.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Season Leaderboard Component
function SeasonLeaderboard({ stats, season }: { stats: PlayerStats[]; season: number }) {
  // Aggregate stats by player
  const playerTotals: { [key: string]: PlayerStats } = {}
  
  stats.forEach(stat => {
    if (!playerTotals[stat.player_name]) {
      playerTotals[stat.player_name] = { ...stat }
    } else {
      const current = playerTotals[stat.player_name]
      current.passing_tds += stat.passing_tds
      current.passes_completed += stat.passes_completed
      current.passes_attempted += stat.passes_attempted
      current.receptions += stat.receptions
      current.targets += stat.targets
      current.receiving_tds += stat.receiving_tds
      current.rushing_tds += stat.rushing_tds
      current.rush_attempts += stat.rush_attempts
      current.flag_pulls += stat.flag_pulls
      current.interceptions += stat.interceptions
      current.pass_breakups += stat.pass_breakups
      current.first_downs += stat.first_downs
      current.drops += stat.drops
      current.interceptions_thrown += stat.interceptions_thrown
      current.def_td += stat.def_td
      current.sacks += stat.sacks
    }
  })

  const aggregatedStats = Object.values(playerTotals)

  const categories = [
    { 
      label: 'Passing TDs', 
      getValue: (s: PlayerStats) => s.passing_tds,
      filter: (s: PlayerStats) => s.passing_tds > 0 || s.passes_attempted > 0
    },
    { 
      label: 'Receiving TDs', 
      getValue: (s: PlayerStats) => s.receiving_tds,
      filter: (s: PlayerStats) => s.receptions > 0 || s.targets > 0
    },
    { 
      label: 'Rushing TDs', 
      getValue: (s: PlayerStats) => s.rushing_tds,
      filter: (s: PlayerStats) => s.rushing_tds > 0 || s.rush_attempts > 0
    },
    { 
      label: 'Receptions', 
      getValue: (s: PlayerStats) => s.receptions,
      filter: (s: PlayerStats) => s.receptions > 0 || s.targets > 0
    },
    { 
      label: 'Interceptions', 
      getValue: (s: PlayerStats) => s.interceptions,
      filter: (s: PlayerStats) => s.flag_pulls > 0 || s.interceptions > 0 || s.pass_breakups > 0
    },
    { 
      label: 'Flag Pulls', 
      getValue: (s: PlayerStats) => s.flag_pulls,
      filter: (s: PlayerStats) => s.flag_pulls > 0 || s.interceptions > 0 || s.pass_breakups > 0 || s.sacks > 0
    },
    { 
      label: 'Sacks', 
      getValue: (s: PlayerStats) => s.sacks,
      filter: (s: PlayerStats) => s.flag_pulls > 0 || s.interceptions > 0 || s.pass_breakups > 0 || s.sacks > 0
    },
  ]

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-red-600" />
          Season {season} Leaderboard
        </CardTitle>
        <CardDescription>Top performers across all games</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {categories.map(category => {
            const filteredStats = aggregatedStats.filter(category.filter)
            const topPlayers = [...filteredStats]
              .sort((a, b) => category.getValue(b) - category.getValue(a))
              .slice(0, 10)

            return (
              <div key={category.label} className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-center">{category.label}</h4>
                <div className="space-y-2">
                  {topPlayers.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">No stats recorded</p>
                  ) : (
                    topPlayers.map((player, index) => (
                      <div 
                        key={`${player.player_name}-${index}`}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-500 dark:text-gray-400 w-6">{index + 1}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{player.player_name}</span>
                        </div>
                        <span className="text-lg font-bold text-red-600">{category.getValue(player)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
