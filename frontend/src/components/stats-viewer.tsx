'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Game } from '@/lib/api'
import { Trophy, Target, Zap, Shield, TrendingUp, Users } from 'lucide-react'
import { useGamesWithRealtime, usePlayerStatsWithRealtime } from '@/hooks'

export function StatsViewer() {
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)

  // Queries with realtime updates
  const { data: games = [], isLoading: gamesLoading } = useGamesWithRealtime()
  const { data: allStats = [], isLoading: statsLoading } = usePlayerStatsWithRealtime()

  // Get unique seasons
  const seasons = Array.from(new Set(games.map(g => g.season))).sort((a, b) => b - a)

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
  const defenseStats = gameStats.filter(s => s.flag_pulls > 0 || s.interceptions > 0 || s.pass_breakups > 0)

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Game Statistics</h2>
          <p className="text-gray-600">View detailed player stats for each game</p>
        </div>
      </div>

      {/* Season Selection */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-red-600" />
            Select Season
          </CardTitle>
          <CardDescription>Choose a season to view games</CardDescription>
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

      {/* Game Selection */}
      {selectedSeason && (
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
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedGame?.id === game.id
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">
                        Week {game.week} - {game.league}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {game.team1_name} ({game.team1_score}) vs {game.team2_name} ({game.team2_score})
                      </div>
                    </div>
                    {game.winning_team_name && (
                      <div className="flex items-center gap-1 text-green-600 font-medium text-sm">
                        <Trophy className="h-4 w-4" />
                        {game.winning_team_name}
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

      {/* Stats Display */}
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
                      <div key={stat.id} className="bg-gradient-to-r from-blue-50 to-white rounded-xl p-6 border border-blue-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">{stat.player_name}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <StatBox label="Pass TDs" value={stat.passing_tds} color="blue" />
                          <StatBox label="Completions" value={stat.passes_completed} color="blue" />
                          <StatBox label="Attempts" value={stat.passes_attempted} color="blue" />
                          <StatBox label="INTs" value={stat.interceptions_thrown} color="red" />
                          <StatBox label="1st Downs" value={stat.first_downs} color="green" />
                        </div>
                        {stat.passes_attempted > 0 && (
                          <div className="mt-4 text-sm text-gray-600">
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
                      <div key={stat.id} className="bg-gradient-to-r from-purple-50 to-white rounded-xl p-6 border border-purple-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">{stat.player_name}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <StatBox label="Receptions" value={stat.receptions} color="purple" />
                          <StatBox label="Targets" value={stat.targets} color="purple" />
                          <StatBox label="Rec TDs" value={stat.receiving_tds} color="green" />
                          <StatBox label="Drops" value={stat.drops} color="red" />
                          <StatBox label="1st Downs" value={stat.first_downs} color="green" />
                        </div>
                        {stat.targets > 0 && (
                          <div className="mt-4 text-sm text-gray-600">
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
                      <div key={stat.id} className="bg-gradient-to-r from-orange-50 to-white rounded-xl p-6 border border-orange-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">{stat.player_name}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <StatBox label="Rush TDs" value={stat.rushing_tds} color="orange" />
                          <StatBox label="Rush Attempts" value={stat.rush_attempts} color="orange" />
                          <StatBox label="1st Downs" value={stat.first_downs} color="green" />
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
                      <div key={stat.id} className="bg-gradient-to-r from-green-50 to-white rounded-xl p-6 border border-green-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">{stat.player_name}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <StatBox label="Flag Pulls" value={stat.flag_pulls} color="green" />
                          <StatBox label="INTs" value={stat.interceptions} color="green" />
                          <StatBox label="Pass Breakups" value={stat.pass_breakups} color="green" />
                          <StatBox label="Def TDs" value={stat.def_td} color="green" />
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
    </div>
  )
}

// Helper component for stat boxes
function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    red: 'bg-red-100 text-red-700 border-red-200',
  }

  return (
    <div className={`rounded-lg p-4 border-2 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium mt-1">{label}</div>
    </div>
  )
}
