'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, TrendingUp, Target, Zap, Shield, Calendar } from 'lucide-react'
import { useGamesWithRealtime, usePlayerStatsWithRealtime, useTeamsWithRealtime } from '@/hooks'
import { Game, PlayerStats, Team } from '@/lib/api'
import { Label } from '@/components/ui/label'

export function Dashboard() {
  const [selectedTab, setSelectedTab] = useState<'latest' | 'week' | 'season'>('latest')
  const { data: games = [] } = useGamesWithRealtime()
  const { data: allStats = [] } = usePlayerStatsWithRealtime()
  const { data: teams = [] } = useTeamsWithRealtime()

  // Get latest game
  const latestGame = games.length > 0 
    ? games.reduce((latest, game) => {
        const latestDate = new Date(latest.season, 0, latest.week)
        const gameDate = new Date(game.season, 0, game.week)
        return gameDate > latestDate ? game : latest
      })
    : null

  // Get latest 5 games
  const recentGames = [...games]
    .sort((a, b) => {
      if (b.season !== a.season) return b.season - a.season
      return b.week - a.week
    })
    .slice(0, 5)

  // Get top teams
  const activeTeams = teams.filter(t => t.is_active === 1)
  const topTeams = [...activeTeams]
    .sort((a, b) => {
      const aWinPct = a.wins + a.losses + a.ties > 0 
        ? a.wins / (a.wins + a.losses + a.ties) 
        : 0
      const bWinPct = b.wins + b.losses + b.ties > 0 
        ? b.wins / (b.wins + b.losses + b.ties) 
        : 0
      return bWinPct - aWinPct
    })
    .slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h2>
        <p className="text-gray-600 dark:text-gray-400">Overview of Rhinos league stats and performance</p>
      </div>

      {/* Stats Showcase */}
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-red-600" />
            Stats Showcase
          </CardTitle>
          <CardDescription>View latest game stats and stat leaders</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile Dropdown */}
          <div className="sm:hidden mb-6">
            <Label htmlFor="stats-view" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
              View Stats
            </Label>
            <select
              id="stats-view"
              value={selectedTab}
              onChange={(e) => setSelectedTab(e.target.value as 'latest' | 'week' | 'season')}
              className="input-modern w-full"
            >
              <option value="latest">Latest Game</option>
              <option value="week">Week Leaders</option>
              <option value="season">Season Leaders</option>
            </select>
          </div>

          {/* Desktop Tabs */}
          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as 'latest' | 'week' | 'season')} className="w-full">
            <TabsList className="hidden sm:grid w-full grid-cols-3">
              <TabsTrigger value="latest">Latest Game</TabsTrigger>
              <TabsTrigger value="week">Week Leaders</TabsTrigger>
              <TabsTrigger value="season">Season Leaders</TabsTrigger>
            </TabsList>

            <TabsContent value="latest" className="mt-0 sm:mt-6">
              <LatestGameStats game={latestGame} stats={allStats} />
            </TabsContent>

            <TabsContent value="week" className="mt-0 sm:mt-6">
              <WeekLeaders stats={allStats} games={games} />
            </TabsContent>

            <TabsContent value="season" className="mt-0 sm:mt-6">
              <SeasonLeaders stats={allStats} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recent Games and Top Teams Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Games */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-red-600" />
              Recent Games
            </CardTitle>
            <CardDescription>Latest game results</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentGames games={recentGames} />
          </CardContent>
        </Card>

        {/* Top Teams */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-red-600" />
              Top Teams
            </CardTitle>
            <CardDescription>Current standings leaders</CardDescription>
          </CardHeader>
          <CardContent>
            <TopTeams teams={topTeams} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Latest Game Stats Component (Box Score Style)
function LatestGameStats({ game, stats }: { game: Game | null; stats: PlayerStats[] }) {
  if (!game) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No games available
      </div>
    )
  }

  const gameStats = stats.filter(s => s.game_id === game.id)
  
  // Group stats by category - show ALL players with any stats
  const qbStats = gameStats.filter(s => s.passes_attempted > 0)
  const receiverStats = gameStats.filter(s => s.targets > 0)
  const rushingStats = gameStats.filter(s => s.rush_attempts > 0)
  const defenseStats = gameStats.filter(s => s.flag_pulls > 0 || s.interceptions > 0 || s.pass_breakups > 0 || s.def_td > 0)

  // Calculate team totals for passing
  const teamPassingTotals = qbStats.reduce((acc, s) => ({
    completed: acc.completed + s.passes_completed,
    attempted: acc.attempted + s.passes_attempted,
    tds: acc.tds + s.passing_tds,
    ints: acc.ints + s.interceptions_thrown
  }), { completed: 0, attempted: 0, tds: 0, ints: 0 })

  // Calculate team totals for receiving
  const teamReceivingTotals = receiverStats.reduce((acc, s) => ({
    receptions: acc.receptions + s.receptions,
    targets: acc.targets + s.targets,
    tds: acc.tds + s.receiving_tds,
    drops: acc.drops + s.drops
  }), { receptions: 0, targets: 0, tds: 0, drops: 0 })

  // Calculate team totals for rushing
  const teamRushingTotals = rushingStats.reduce((acc, s) => ({
    attempts: acc.attempts + s.rush_attempts,
    tds: acc.tds + s.rushing_tds,
    firstDowns: acc.firstDowns + s.first_downs
  }), { attempts: 0, tds: 0, firstDowns: 0 })

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <div className="text-center pb-4 border-b-2 border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Week {game.week} - {game.league}
        </h3>
        <div className="flex items-center justify-center gap-4 text-lg">
          <span className="font-bold text-gray-900 dark:text-white">{game.team1_name}</span>
          <span className="text-2xl font-bold text-red-600">{game.team1_score}</span>
          <span className="text-gray-400">-</span>
          <span className="text-2xl font-bold text-red-600">{game.team2_score}</span>
          <span className="font-bold text-gray-900 dark:text-white">{game.team2_name}</span>
        </div>
      </div>

      {/* Passing Stats */}
      {qbStats.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-5 w-5 text-red-600" />
            <h4 className="font-bold text-gray-900 dark:text-white">Passing</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-2 border-gray-200 dark:border-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Player</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">C/ATT</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">TD</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">INT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {qbStats.map((stat, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">{stat.player_name}</td>
                    <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300">{stat.passes_completed}/{stat.passes_attempted}</td>
                    <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300">{stat.passing_tds}</td>
                    <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300">{stat.interceptions_thrown}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 dark:bg-gray-700/50 font-bold">
                  <td className="py-2 px-3 text-gray-900 dark:text-white">TEAM</td>
                  <td className="py-2 px-3 text-center text-gray-900 dark:text-white">{teamPassingTotals.completed}/{teamPassingTotals.attempted}</td>
                  <td className="py-2 px-3 text-center text-gray-900 dark:text-white">{teamPassingTotals.tds}</td>
                  <td className="py-2 px-3 text-center text-gray-900 dark:text-white">{teamPassingTotals.ints}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Receiving Stats */}
      {receiverStats.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-red-600" />
            <h4 className="font-bold text-gray-900 dark:text-white">Receiving</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-2 border-gray-200 dark:border-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Player</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">REC</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">TGT</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">TD</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">DROPS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {receiverStats.map((stat, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">{stat.player_name}</td>
                    <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300">{stat.receptions}</td>
                    <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300">{stat.targets}</td>
                    <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300">{stat.receiving_tds}</td>
                    <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300">{stat.drops}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 dark:bg-gray-700/50 font-bold">
                  <td className="py-2 px-3 text-gray-900 dark:text-white">TEAM</td>
                  <td className="py-2 px-3 text-center text-gray-900 dark:text-white">{teamReceivingTotals.receptions}</td>
                  <td className="py-2 px-3 text-center text-gray-900 dark:text-white">{teamReceivingTotals.targets}</td>
                  <td className="py-2 px-3 text-center text-gray-900 dark:text-white">{teamReceivingTotals.tds}</td>
                  <td className="py-2 px-3 text-center text-gray-900 dark:text-white">{teamReceivingTotals.drops}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rushing Stats */}
      {rushingStats.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-red-600" />
            <h4 className="font-bold text-gray-900 dark:text-white">Rushing</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-2 border-gray-200 dark:border-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Player</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">ATT</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">TD</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">1ST</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {rushingStats.map((stat, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">{stat.player_name}</td>
                    <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300">{stat.rush_attempts}</td>
                    <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300">{stat.rushing_tds}</td>
                    <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300">{stat.first_downs}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 dark:bg-gray-700/50 font-bold">
                  <td className="py-2 px-3 text-gray-900 dark:text-white">TEAM</td>
                  <td className="py-2 px-3 text-center text-gray-900 dark:text-white">{teamRushingTotals.attempts}</td>
                  <td className="py-2 px-3 text-center text-gray-900 dark:text-white">{teamRushingTotals.tds}</td>
                  <td className="py-2 px-3 text-center text-gray-900 dark:text-white">{teamRushingTotals.firstDowns}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Defense Stats */}
      {defenseStats.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-red-600" />
            <h4 className="font-bold text-gray-900 dark:text-white">Defense</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-2 border-gray-200 dark:border-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Player</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">FLAG</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">INT</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">PBU</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">TD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {defenseStats.map((stat, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">{stat.player_name}</td>
                    <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300">{stat.flag_pulls}</td>
                    <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300">{stat.interceptions}</td>
                    <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300">{stat.pass_breakups}</td>
                    <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300">{stat.def_td}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Week Leaders Component
function WeekLeaders({ stats, games }: { stats: PlayerStats[]; games: Game[] }) {
  if (games.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No games available
      </div>
    )
  }

  // Find the most recent game (regardless of whether it has stats)
  const latestGame = games.reduce((latest, game) => {
    if (game.season > latest.season) return game
    if (game.season === latest.season && game.week > latest.week) return game
    return latest
  })

  // Get stats for that week (may be empty)
  const weekStats = stats.filter(s => {
    const game = games.find(g => g.id === s.game_id)
    return game && game.week === latestGame.week && game.season === latestGame.season
  })

  return <StatLeaders stats={weekStats} title={`Week ${latestGame.week} Leaders`} />
}

// Season Leaders Component
function SeasonLeaders({ stats }: { stats: PlayerStats[] }) {
  // Aggregate stats by player for the season
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
    }
  })

  const aggregatedStats = Object.values(playerTotals)

  return <StatLeaders stats={aggregatedStats} title="Season Leaders" />
}

// Stat Leaders Component (Leaderboard Style)
function StatLeaders({ stats, title }: { stats: PlayerStats[]; title: string }) {
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
      filter: (s: PlayerStats) => s.flag_pulls > 0 || s.interceptions > 0 || s.pass_breakups > 0
    },
  ]

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center">{title}</h3>
      <div className="grid gap-6 md:grid-cols-2">
        {categories.map(category => {
          const filteredStats = stats.filter(category.filter)
          const topPlayers = [...filteredStats]
            .sort((a, b) => category.getValue(b) - category.getValue(a))
            .slice(0, 5)

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
    </div>
  )
}

// Recent Games Component
function RecentGames({ games }: { games: Game[] }) {
  if (games.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No recent games
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {games.map(game => (
        <div 
          key={game.id}
          className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-red-300 dark:hover:border-red-600 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              Week {game.week} • {game.league}
            </span>
            {game.winning_team_name && (
              <Trophy className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className={`font-bold ${game.winning_team_name === game.team1_name ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                {game.team1_name}
              </div>
            </div>
            <div className="flex items-center gap-3 px-4">
              <span className={`text-2xl font-bold ${game.winning_team_name === game.team1_name ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'}`}>
                {game.team1_score}
              </span>
              <span className="text-gray-400">-</span>
              <span className={`text-2xl font-bold ${game.winning_team_name === game.team2_name ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'}`}>
                {game.team2_score}
              </span>
            </div>
            <div className="flex-1 text-right">
              <div className={`font-bold ${game.winning_team_name === game.team2_name ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                {game.team2_name}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Top Teams Component
function TopTeams({ teams }: { teams: Team[] }) {
  if (teams.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No teams available
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {teams.map((team, index) => {
        const gamesPlayed = team.wins + team.losses + team.ties
        const winPct = gamesPlayed > 0 ? (team.wins / gamesPlayed * 100).toFixed(1) : '0.0'
        
        return (
          <div 
            key={team.id}
            className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-red-300 dark:hover:border-red-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-500 dark:text-gray-400 w-6">{index + 1}</span>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">{team.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{team.league}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Record</div>
                  <div className="font-bold text-gray-900 dark:text-white">{team.wins}-{team.losses}-{team.ties}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Win %</div>
                  <div className="font-bold text-red-600">{winPct}%</div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
