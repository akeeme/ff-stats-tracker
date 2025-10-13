'use client'

import { useState, useMemo } from 'react'
import { AlertDialog, AlertDialogContent } from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Player, PlayerStats } from '@/lib/api'
import { Trophy, TrendingUp, Calendar, Target, BarChart3, Award } from 'lucide-react'

interface PlayerDetailModalProps {
  player: Player | null
  stats: PlayerStats[]
  allPlayers: Player[]
  isOpen: boolean
  onClose: () => void
}

export function PlayerDetailModal({ player, stats, allPlayers, isOpen, onClose }: PlayerDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview')

  // Filter stats for this player across all seasons using canonical_player_id
  const playerStats = useMemo(() => {
    if (!player) return []
    
    // Get the canonical ID for this player
    const canonicalId = player.canonical_player_id || player.id
    
    // Find all player records that share the same canonical_player_id
    const relatedPlayerIds = new Set(
      allPlayers
        .filter(p => (p.canonical_player_id || p.id) === canonicalId)
        .map(p => p.id)
    )
    
    // Return stats for all related player records
    return stats.filter(s => relatedPlayerIds.has(s.player_id))
  }, [player, stats, allPlayers])

  // Calculate aggregated stats
  const careerStats = useMemo(() => {
    return playerStats.reduce((acc, stat) => ({
      passing_tds: acc.passing_tds + stat.passing_tds,
      passes_completed: acc.passes_completed + stat.passes_completed,
      passes_attempted: acc.passes_attempted + stat.passes_attempted,
      interceptions_thrown: acc.interceptions_thrown + stat.interceptions_thrown,
      receptions: acc.receptions + stat.receptions,
      targets: acc.targets + stat.targets,
      receiving_tds: acc.receiving_tds + stat.receiving_tds,
      drops: acc.drops + stat.drops,
      first_downs: acc.first_downs + stat.first_downs,
      rushing_tds: acc.rushing_tds + stat.rushing_tds,
      rush_attempts: acc.rush_attempts + stat.rush_attempts,
      flag_pulls: acc.flag_pulls + stat.flag_pulls,
      interceptions: acc.interceptions + stat.interceptions,
      pass_breakups: acc.pass_breakups + stat.pass_breakups,
      def_td: acc.def_td + stat.def_td,
      sacks: acc.sacks + stat.sacks,
      games: acc.games + 1,
    }), {
      passing_tds: 0, passes_completed: 0, passes_attempted: 0, interceptions_thrown: 0,
      receptions: 0, targets: 0, receiving_tds: 0, drops: 0, first_downs: 0,
      rushing_tds: 0, rush_attempts: 0, flag_pulls: 0, interceptions: 0,
      pass_breakups: 0, def_td: 0, sacks: 0, games: 0
    })
  }, [playerStats])

  // Calculate career highs
  const careerHighs = useMemo(() => {
    if (playerStats.length === 0) return null
    
    return {
      passing_tds: Math.max(...playerStats.map(s => s.passing_tds)),
      passes_completed: Math.max(...playerStats.map(s => s.passes_completed)),
      receptions: Math.max(...playerStats.map(s => s.receptions)),
      targets: Math.max(...playerStats.map(s => s.targets)),
      receiving_tds: Math.max(...playerStats.map(s => s.receiving_tds)),
      rushing_tds: Math.max(...playerStats.map(s => s.rushing_tds)),
      rush_attempts: Math.max(...playerStats.map(s => s.rush_attempts)),
      flag_pulls: Math.max(...playerStats.map(s => s.flag_pulls)),
      sacks: Math.max(...playerStats.map(s => s.sacks)),
      interceptions: Math.max(...playerStats.map(s => s.interceptions)),
    }
  }, [playerStats])

  // Group stats by season
  const statsBySeason = useMemo(() => {
    const grouped = playerStats.reduce((acc, stat) => {
      if (!acc[stat.game_season]) {
        acc[stat.game_season] = []
      }
      acc[stat.game_season].push(stat)
      return acc
    }, {} as Record<number, PlayerStats[]>)

    return Object.entries(grouped).map(([season, stats]) => ({
      season: Number(season),
      stats: stats.reduce((acc, stat) => ({
        passing_tds: acc.passing_tds + stat.passing_tds,
        passes_completed: acc.passes_completed + stat.passes_completed,
        passes_attempted: acc.passes_attempted + stat.passes_attempted,
        interceptions_thrown: acc.interceptions_thrown + stat.interceptions_thrown,
        receptions: acc.receptions + stat.receptions,
        targets: acc.targets + stat.targets,
        receiving_tds: acc.receiving_tds + stat.receiving_tds,
        drops: acc.drops + stat.drops,
        first_downs: acc.first_downs + stat.first_downs,
        rushing_tds: acc.rushing_tds + stat.rushing_tds,
        rush_attempts: acc.rush_attempts + stat.rush_attempts,
        flag_pulls: acc.flag_pulls + stat.flag_pulls,
        interceptions: acc.interceptions + stat.interceptions,
        pass_breakups: acc.pass_breakups + stat.pass_breakups,
        def_td: acc.def_td + stat.def_td,
        sacks: acc.sacks + stat.sacks,
        games: acc.games + 1,
      }), {
        passing_tds: 0, passes_completed: 0, passes_attempted: 0, interceptions_thrown: 0,
        receptions: 0, targets: 0, receiving_tds: 0, drops: 0, first_downs: 0,
        rushing_tds: 0, rush_attempts: 0, flag_pulls: 0, interceptions: 0,
        pass_breakups: 0, def_td: 0, sacks: 0, games: 0
      })
    })).sort((a, b) => b.season - a.season)
  }, [playerStats])

  // Calculate per game averages
  const perGameAvg = useMemo(() => {
    if (careerStats.games === 0) return null
    return {
      passing_tds: (careerStats.passing_tds / careerStats.games).toFixed(1),
      passes_completed: (careerStats.passes_completed / careerStats.games).toFixed(1),
      receptions: (careerStats.receptions / careerStats.games).toFixed(1),
      targets: (careerStats.targets / careerStats.games).toFixed(1),
      receiving_tds: (careerStats.receiving_tds / careerStats.games).toFixed(1),
      rushing_tds: (careerStats.rushing_tds / careerStats.games).toFixed(1),
      rush_attempts: (careerStats.rush_attempts / careerStats.games).toFixed(1),
      flag_pulls: (careerStats.flag_pulls / careerStats.games).toFixed(1),
      sacks: (careerStats.sacks / careerStats.games).toFixed(1),
      interceptions: (careerStats.interceptions / careerStats.games).toFixed(1),
    }
  }, [careerStats])

  // Calculate catch percentage
  const catchPercentage = careerStats.targets > 0 
    ? ((careerStats.receptions / careerStats.targets) * 100).toFixed(1)
    : '0.0'

  const completionPercentage = careerStats.passes_attempted > 0
    ? ((careerStats.passes_completed / careerStats.passes_attempted) * 100).toFixed(1)
    : '0.0'

  // Recent form (last 3 games)
  const recentGames = useMemo(() => {
    return playerStats.slice(-3).reverse()
  }, [playerStats])

  if (!player) return null

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {player.jersey_number && (
              <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-lg font-bold">
                #{player.jersey_number}
              </span>
            )}
            <h2 className="text-2xl font-bold">{player.name}</h2>
            <span className="text-sm font-normal text-gray-500">• {player.team_name}</span>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="seasons">By Season</TabsTrigger>
            <TabsTrigger value="games">Game Log</TabsTrigger>
            <TabsTrigger value="records">Records</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Career Totals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Career Totals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatBox label="Games" value={careerStats.games} />
                  {careerStats.passing_tds > 0 && (
                    <>
                      <StatBox label="Pass TDs" value={careerStats.passing_tds} />
                      <StatBox label="Completions" value={`${careerStats.passes_completed}/${careerStats.passes_attempted}`} />
                      <StatBox label="Comp %" value={`${completionPercentage}%`} />
                      <StatBox label="INTs Thrown" value={careerStats.interceptions_thrown} />
                    </>
                  )}
                  {(careerStats.receptions > 0 || careerStats.targets > 0) && (
                    <>
                      {careerStats.receptions > 0 && <StatBox label="Receptions" value={careerStats.receptions} />}
                      {careerStats.targets > 0 && <StatBox label="Targets" value={careerStats.targets} />}
                      {careerStats.targets > 0 && <StatBox label="Catch %" value={`${catchPercentage}%`} />}
                      {careerStats.receiving_tds > 0 && <StatBox label="Rec TDs" value={careerStats.receiving_tds} />}
                      {careerStats.drops > 0 && <StatBox label="Drops" value={careerStats.drops} />}
                    </>
                  )}
                  {careerStats.rush_attempts > 0 && (
                    <>
                      <StatBox label="Rush Att" value={careerStats.rush_attempts} />
                      <StatBox label="Rush TDs" value={careerStats.rushing_tds} />
                    </>
                  )}
                  {careerStats.flag_pulls > 0 && (
                    <>
                      <StatBox label="Flag Pulls" value={careerStats.flag_pulls} />
                      <StatBox label="Sacks" value={careerStats.sacks} />
                      <StatBox label="Def INTs" value={careerStats.interceptions} />
                      <StatBox label="PBUs" value={careerStats.pass_breakups} />
                      <StatBox label="Def TDs" value={careerStats.def_td} />
                    </>
                  )}
                  {careerStats.first_downs > 0 && (
                    <StatBox label="1st Downs" value={careerStats.first_downs} />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Per Game Averages */}
            {perGameAvg && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Per Game Averages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {careerStats.passing_tds > 0 && (
                      <>
                        <StatBox label="Pass TDs/G" value={perGameAvg.passing_tds} />
                        <StatBox label="Comp/G" value={perGameAvg.passes_completed} />
                      </>
                    )}
                    {(careerStats.receptions > 0 || careerStats.targets > 0) && (
                      <>
                        {careerStats.receptions > 0 && <StatBox label="Rec/G" value={perGameAvg.receptions} />}
                        {careerStats.targets > 0 && <StatBox label="Targets/G" value={perGameAvg.targets} />}
                        {careerStats.receiving_tds > 0 && <StatBox label="Rec TD/G" value={perGameAvg.receiving_tds} />}
                      </>
                    )}
                    {careerStats.rush_attempts > 0 && (
                      <>
                        <StatBox label="Rush Att/G" value={perGameAvg.rush_attempts} />
                        <StatBox label="Rush TD/G" value={perGameAvg.rushing_tds} />
                      </>
                    )}
                    {careerStats.flag_pulls > 0 && (
                      <>
                        <StatBox label="Pulls/G" value={perGameAvg.flag_pulls} />
                        <StatBox label="Sacks/G" value={perGameAvg.sacks} />
                        <StatBox label="INT/G" value={perGameAvg.interceptions} />
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Form */}
            {recentGames.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Form (Last {recentGames.length} Games)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentGames.map((game) => (
                      <div key={game.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-500">Week {game.game_week}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {game.team1_name} vs {game.team2_name}
                          </span>
                        </div>
                        <div className="flex gap-4 text-sm">
                          {game.passing_tds > 0 && <span className="font-semibold">{game.passing_tds} Pass TD</span>}
                          {game.passes_attempted > 0 && <span>{game.passes_completed}/{game.passes_attempted}</span>}
                          {game.receptions > 0 && <span className="font-semibold">{game.receptions} Rec</span>}
                          {game.targets > 0 && <span>{game.targets} Tgt</span>}
                          {game.receiving_tds > 0 && <span className="font-semibold">{game.receiving_tds} TD</span>}
                          {game.rush_attempts > 0 && <span>{game.rush_attempts} Rush</span>}
                          {game.rushing_tds > 0 && <span className="font-semibold">{game.rushing_tds} Rush TD</span>}
                          {game.flag_pulls > 0 && <span>{game.flag_pulls} Pulls</span>}
                          {game.sacks > 0 && <span>{game.sacks} Sacks</span>}
                          {game.interceptions > 0 && <span>{game.interceptions} INT</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* By Season Tab */}
          <TabsContent value="seasons" className="space-y-4">
            {statsBySeason.map(({ season, stats }) => (
              <Card key={season}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Season {season}
                    <span className="text-sm font-normal text-gray-500">({stats.games} games)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.passing_tds > 0 && (
                      <>
                        <StatBox label="Pass TDs" value={stats.passing_tds} />
                        <StatBox label="Completions" value={`${stats.passes_completed}/${stats.passes_attempted}`} />
                        <StatBox label="Comp %" value={`${((stats.passes_completed / stats.passes_attempted) * 100).toFixed(1)}%`} />
                        <StatBox label="INTs Thrown" value={stats.interceptions_thrown} />
                      </>
                    )}
                    {(stats.receptions > 0 || stats.targets > 0) && (
                      <>
                        {stats.receptions > 0 && <StatBox label="Receptions" value={stats.receptions} />}
                        {stats.targets > 0 && <StatBox label="Targets" value={stats.targets} />}
                        {stats.targets > 0 && <StatBox label="Catch %" value={`${((stats.receptions / stats.targets) * 100).toFixed(1)}%`} />}
                        {stats.receiving_tds > 0 && <StatBox label="Rec TDs" value={stats.receiving_tds} />}
                        {stats.drops > 0 && <StatBox label="Drops" value={stats.drops} />}
                      </>
                    )}
                    {stats.rush_attempts > 0 && (
                      <>
                        <StatBox label="Rush Att" value={stats.rush_attempts} />
                        <StatBox label="Rush TDs" value={stats.rushing_tds} />
                      </>
                    )}
                    {stats.flag_pulls > 0 && (
                      <>
                        <StatBox label="Flag Pulls" value={stats.flag_pulls} />
                        <StatBox label="Sacks" value={stats.sacks} />
                        <StatBox label="Def INTs" value={stats.interceptions} />
                        <StatBox label="PBUs" value={stats.pass_breakups} />
                        <StatBox label="Def TDs" value={stats.def_td} />
                      </>
                    )}
                    {stats.first_downs > 0 && (
                      <StatBox label="1st Downs" value={stats.first_downs} />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Game Log Tab */}
          <TabsContent value="games" className="space-y-2">
            <div className="space-y-2">
              {playerStats.slice().reverse().map((game) => {
                // Collect all non-zero stats for this game
                const stats = []
                if (game.passing_tds > 0) stats.push({ label: 'Pass TD', value: game.passing_tds, color: 'text-green-600 dark:text-green-400' })
                if (game.passes_attempted > 0) stats.push({ label: 'C/A', value: `${game.passes_completed}/${game.passes_attempted}`, color: 'text-blue-600 dark:text-blue-400' })
                if (game.interceptions_thrown > 0) stats.push({ label: 'INT', value: game.interceptions_thrown, color: 'text-red-600 dark:text-red-400' })
                if (game.receptions > 0) stats.push({ label: 'Rec', value: game.receptions, color: 'text-purple-600 dark:text-purple-400' })
                if (game.targets > 0) stats.push({ label: 'Tgt', value: game.targets, color: 'text-gray-600 dark:text-gray-400' })
                if (game.receiving_tds > 0) stats.push({ label: 'Rec TD', value: game.receiving_tds, color: 'text-green-600 dark:text-green-400' })
                if (game.drops > 0) stats.push({ label: 'Drops', value: game.drops, color: 'text-red-600 dark:text-red-400' })
                if (game.rush_attempts > 0) stats.push({ label: 'Rush', value: game.rush_attempts, color: 'text-orange-600 dark:text-orange-400' })
                if (game.rushing_tds > 0) stats.push({ label: 'Rush TD', value: game.rushing_tds, color: 'text-green-600 dark:text-green-400' })
                if (game.flag_pulls > 0) stats.push({ label: 'Pulls', value: game.flag_pulls, color: 'text-yellow-600 dark:text-yellow-400' })
                if (game.sacks > 0) stats.push({ label: 'Sacks', value: game.sacks, color: 'text-orange-600 dark:text-orange-400' })
                if (game.interceptions > 0) stats.push({ label: 'INT', value: game.interceptions, color: 'text-purple-600 dark:text-purple-400' })
                if (game.pass_breakups > 0) stats.push({ label: 'PBU', value: game.pass_breakups, color: 'text-blue-600 dark:text-blue-400' })
                if (game.def_td > 0) stats.push({ label: 'Def TD', value: game.def_td, color: 'text-green-600 dark:text-green-400' })
                if (game.first_downs > 0) stats.push({ label: '1st', value: game.first_downs, color: 'text-blue-600 dark:text-blue-400' })

                return (
                  <Card key={game.id} className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0 flex-shrink-0">
                        <div className="text-center flex-shrink-0">
                          <div className="text-xs text-gray-500">Week</div>
                          <div className="text-lg font-bold">{game.game_week}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{game.team1_name} vs {game.team2_name}</div>
                          <div className="text-xs text-gray-500">Season {game.game_season}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 justify-end items-center">
                        {stats.map((stat, idx) => (
                          <div key={idx} className="flex items-center gap-1 whitespace-nowrap">
                            <span className="text-xs text-gray-500">{stat.label}:</span>
                            <span className={`font-bold text-sm ${stat.color}`}>{stat.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Records Tab */}
          <TabsContent value="records" className="space-y-4">
            {careerHighs && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Career Highs (Single Game)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {careerHighs.passing_tds > 0 && <StatBox label="Pass TDs" value={careerHighs.passing_tds} highlight />}
                    {careerHighs.passes_completed > 0 && <StatBox label="Completions" value={careerHighs.passes_completed} highlight />}
                    {careerHighs.receptions > 0 && <StatBox label="Receptions" value={careerHighs.receptions} highlight />}
                    {careerHighs.targets > 0 && <StatBox label="Targets" value={careerHighs.targets} highlight />}
                    {careerHighs.receiving_tds > 0 && <StatBox label="Rec TDs" value={careerHighs.receiving_tds} highlight />}
                    {careerHighs.rush_attempts > 0 && <StatBox label="Rush Att" value={careerHighs.rush_attempts} highlight />}
                    {careerHighs.rushing_tds > 0 && <StatBox label="Rush TDs" value={careerHighs.rushing_tds} highlight />}
                    {careerHighs.flag_pulls > 0 && <StatBox label="Flag Pulls" value={careerHighs.flag_pulls} highlight />}
                    {careerHighs.sacks > 0 && <StatBox label="Sacks" value={careerHighs.sacks} highlight />}
                    {careerHighs.interceptions > 0 && <StatBox label="INTs" value={careerHighs.interceptions} highlight />}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Milestones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Career Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {careerStats.receptions > 0 && (
                    <MilestoneProgress 
                      label="Receptions" 
                      current={careerStats.receptions} 
                      milestones={[25, 50, 100, 200]}
                    />
                  )}
                  {careerStats.receiving_tds > 0 && (
                    <MilestoneProgress 
                      label="Receiving TDs" 
                      current={careerStats.receiving_tds} 
                      milestones={[5, 10, 25, 50]}
                    />
                  )}
                  {careerStats.passing_tds > 0 && (
                    <MilestoneProgress 
                      label="Passing TDs" 
                      current={careerStats.passing_tds} 
                      milestones={[5, 10, 25, 50]}
                    />
                  )}
                  {careerStats.flag_pulls > 0 && (
                    <MilestoneProgress 
                      label="Flag Pulls" 
                      current={careerStats.flag_pulls} 
                      milestones={[25, 50, 100, 200]}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function StatBox({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`p-3 rounded-lg ${highlight ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-700' : 'bg-gray-50 dark:bg-gray-800'}`}>
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${highlight ? 'text-yellow-700 dark:text-yellow-400' : 'text-gray-900 dark:text-white'}`}>{value}</div>
    </div>
  )
}

function MilestoneProgress({ label, current, milestones }: { label: string; current: number; milestones: number[] }) {
  const nextMilestone = milestones.find(m => m > current) || milestones[milestones.length - 1]
  const progress = (current / nextMilestone) * 100
  const remaining = nextMilestone - current

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-sm text-gray-500">
          {current} / {nextMilestone} {remaining > 0 && `(${remaining} to go)`}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div 
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(progress, 100)}%` }}
        ></div>
      </div>
    </div>
  )
}
