'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, TrendingUp, Target, Zap, Shield, Calendar } from 'lucide-react'
import { useGamesWithRealtime, usePlayerStatsWithRealtime, useTeamsWithRealtime } from '@/hooks'
import { Game, PlayerStats, Team } from '@/lib/api'
import { Label } from '@/components/ui/label'

export function Dashboard() {
  const [selectedTab, setSelectedTab] = useState<'latest' | 'week' | 'season' | 'alltime'>('latest')
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
      <Card className="card-modern bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="h-5 w-5 text-red-500" />
            Stats Showcase
          </CardTitle>
          <CardDescription className="text-gray-400">View latest game stats and stat leaders</CardDescription>
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
              onChange={(e) => setSelectedTab(e.target.value as 'latest' | 'week' | 'season' | 'alltime')}
              className="input-modern w-full"
            >
              <option value="latest">Latest Game</option>
              <option value="week">Week Leaders</option>
              <option value="season">Season Leaders</option>
              <option value="alltime">All-Time Leaders</option>
            </select>
          </div>

          {/* Desktop Tabs */}
          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as 'latest' | 'week' | 'season' | 'alltime')} className="w-full">
            <TabsList className="hidden sm:grid w-full grid-cols-4">
              <TabsTrigger value="latest">Latest Game</TabsTrigger>
              <TabsTrigger value="week">Week Leaders</TabsTrigger>
              <TabsTrigger value="season">Season Leaders</TabsTrigger>
              <TabsTrigger value="alltime">All-Time</TabsTrigger>
            </TabsList>

            <TabsContent value="latest" className="mt-0 sm:mt-6">
              <LatestGameStats game={latestGame} stats={allStats} />
            </TabsContent>

            <TabsContent value="week" className="mt-0 sm:mt-6">
              <WeekLeaders stats={allStats} games={games} />
            </TabsContent>

            <TabsContent value="season" className="mt-0 sm:mt-6">
              <SeasonLeaders stats={allStats} games={games} />
            </TabsContent>

            <TabsContent value="alltime" className="mt-0 sm:mt-6">
              <AllTimeLeaders stats={allStats} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recent Games and Top Teams Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Games */}
        <Card className="card-modern bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Calendar className="h-5 w-5 text-red-500" />
              Recent Games
            </CardTitle>
            <CardDescription className="text-gray-400">Latest game results</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentGames games={recentGames} />
          </CardContent>
        </Card>

        {/* Top Teams */}
        <Card className="card-modern bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Trophy className="h-5 w-5 text-red-500" />
              Top Teams
            </CardTitle>
            <CardDescription className="text-gray-400">Current standings leaders</CardDescription>
          </CardHeader>
          <CardContent>
            <TopTeams teams={topTeams} games={games} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Latest Game Stats Component (Box Score Style)
function LatestGameStats({ game, stats }: { game: Game | null; stats: PlayerStats[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rhinosWon = game?.winning_team_name === 'Rhinos'
  
  // Confetti effect when Rhinos win
  useEffect(() => {
    if (!rhinosWon || !canvasRef.current || !game) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    
    const confetti: Array<{
      x: number
      y: number
      size: number
      d: number
      emoji: string
      rotation: number
      rotationSpeed: number
      speed: number
    }> = []
    
    const confettiCount = 30
    
    for (let i = 0; i < confettiCount; i++) {
      confetti.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 20 + 20,
        d: Math.random() * confettiCount,
        emoji: '🦏',
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 5,
        speed: Math.random() * 2 + 1,
      })
    }
    
    let animationFrame: number
    
    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      confetti.forEach((c, i) => {
        ctx.save()
        ctx.translate(c.x, c.y)
        ctx.rotate((c.rotation * Math.PI) / 180)
        ctx.font = `${c.size}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(c.emoji, 0, 0)
        ctx.restore()
        
        c.y += c.speed + Math.cos(c.d) / 2
        c.x += Math.sin(c.d) * 0.5
        c.rotation += c.rotationSpeed
        c.d += 0.01
        
        if (c.y > canvas.height + 50) {
          confetti[i] = {
            ...c,
            x: Math.random() * canvas.width,
            y: -50,
            rotation: Math.random() * 360,
          }
        }
      })
      
      animationFrame = requestAnimationFrame(draw)
    }
    
    draw()
    
    return () => {
      cancelAnimationFrame(animationFrame)
    }
  }, [rhinosWon, game])
  
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

  const rhinosTeam = game.team1_name === 'Rhinos' ? 'team1' : game.team2_name === 'Rhinos' ? 'team2' : null
  const rhinosScore = rhinosTeam === 'team1' ? game.team1_score : rhinosTeam === 'team2' ? game.team2_score : 0
  const opponentScore = rhinosTeam === 'team1' ? game.team2_score : rhinosTeam === 'team2' ? game.team1_score : 0
  const opponentName = rhinosTeam === 'team1' ? game.team2_name : rhinosTeam === 'team2' ? game.team1_name : ''

  return (
    <div className="space-y-6">
      {/* Game Header - Enhanced for Rhinos Victory */}
      <div className={`relative overflow-hidden rounded-2xl p-8 ${
        rhinosWon 
          ? 'bg-gradient-to-br from-red-600 via-red-500 to-orange-500 shadow-2xl shadow-red-500/50' 
          : 'bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700'
      }`}>
        {/* Confetti Canvas */}
        {rhinosWon && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
            style={{ mixBlendMode: 'screen' }}
          />
        )}
        
        {/* Animated background effect for wins */}
        {rhinosWon && (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)]"></div>
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-4 left-4 w-16 h-16 bg-white/10 rounded-full animate-pulse"></div>
              <div className="absolute top-8 right-8 w-12 h-12 bg-white/10 rounded-full animate-pulse delay-75"></div>
              <div className="absolute bottom-6 left-1/4 w-20 h-20 bg-white/10 rounded-full animate-pulse delay-150"></div>
            </div>
          </>
        )}
        
        <div className="relative z-10 text-center space-y-4">
          {/* Week and League */}
          <div className="flex items-center justify-center gap-2">
            <span className={`text-sm font-bold tracking-wider uppercase ${
              rhinosWon ? 'text-white/90' : 'text-gray-400'
            }`}>
              Week {game.week}
            </span>
            <span className={rhinosWon ? 'text-white/60' : 'text-gray-600'}>•</span>
            <span className={`text-sm font-bold tracking-wider uppercase ${
              rhinosWon ? 'text-white/90' : 'text-gray-400'
            }`}>
              {game.league}
            </span>
          </div>

          {/* Victory Banner */}
          {rhinosWon && (
            <div className="flex items-center justify-center gap-2 animate-bounce">
              <Trophy className="h-6 w-6 text-yellow-300 drop-shadow-lg" />
              <span className="text-2xl font-black text-white tracking-tight drop-shadow-lg">
                RHINOS VICTORY!
              </span>
              <Trophy className="h-6 w-6 text-yellow-300 drop-shadow-lg" />
            </div>
          )}

          {/* Score Display */}
          <div className="flex items-center justify-center gap-6 py-4">
            {rhinosTeam === 'team1' ? (
              <>
                <div className="text-center flex-1">
                  <div className={`text-2xl font-black mb-2 ${
                    rhinosWon ? 'text-white drop-shadow-lg' : 'text-gray-300'
                  }`}>
                    {game.team1_name}
                  </div>
                  <div className={`text-6xl font-black tabular-nums ${
                    rhinosWon 
                      ? 'text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]' 
                      : 'text-red-500'
                  }`}>
                    {game.team1_score}
                  </div>
                </div>
                <div className={`text-4xl font-bold ${rhinosWon ? 'text-white/40' : 'text-gray-600'}`}>
                  -
                </div>
                <div className="text-center flex-1">
                  <div className={`text-2xl font-black mb-2 ${
                    rhinosWon ? 'text-white/70' : 'text-gray-300'
                  }`}>
                    {game.team2_name}
                  </div>
                  <div className={`text-6xl font-black tabular-nums ${
                    rhinosWon ? 'text-white/60' : 'text-red-500'
                  }`}>
                    {game.team2_score}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text-center flex-1">
                  <div className={`text-2xl font-black mb-2 ${
                    rhinosWon ? 'text-white/70' : 'text-gray-300'
                  }`}>
                    {game.team1_name}
                  </div>
                  <div className={`text-6xl font-black tabular-nums ${
                    rhinosWon ? 'text-white/60' : 'text-red-500'
                  }`}>
                    {game.team1_score}
                  </div>
                </div>
                <div className={`text-4xl font-bold ${rhinosWon ? 'text-white/40' : 'text-gray-600'}`}>
                  -
                </div>
                <div className="text-center flex-1">
                  <div className={`text-2xl font-black mb-2 ${
                    rhinosWon ? 'text-white drop-shadow-lg' : 'text-gray-300'
                  }`}>
                    {game.team2_name}
                  </div>
                  <div className={`text-6xl font-black tabular-nums ${
                    rhinosWon 
                      ? 'text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]' 
                      : 'text-red-500'
                  }`}>
                    {game.team2_score}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Final Score Label */}
          {!rhinosWon && game.winning_team_name && (
            <div className="text-sm font-semibold text-gray-400">
              {game.winning_team_name} wins
            </div>
          )}
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
function SeasonLeaders({ stats, games }: { stats: PlayerStats[]; games: Game[] }) {
  // Get current season from latest game
  const currentSeason = games.length > 0 
    ? Math.max(...games.map(g => g.season))
    : 1

  // Filter stats to current season only
  const currentSeasonGameIds = games
    .filter(g => g.season === currentSeason)
    .map(g => g.id)
  
  const currentSeasonStats = stats.filter(s => currentSeasonGameIds.includes(s.game_id))

  // Aggregate stats by player for the current season
  const playerTotals: { [key: string]: PlayerStats } = {}
  
  currentSeasonStats.forEach(stat => {
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

  return <StatLeaders stats={aggregatedStats} title={`Season ${currentSeason} Leaders`} />
}

// All-Time Leaders Component
function AllTimeLeaders({ stats }: { stats: PlayerStats[] }) {
  // Aggregate stats by player across all seasons
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

  return <StatLeaders stats={aggregatedStats} title="All-Time Leaders" />
}

// Stat Leaders Component (Leaderboard Style)
function StatLeaders({ stats, title }: { stats: PlayerStats[]; title: string }) {
  const categories = [
    { 
      label: 'Passing TDs', 
      getValue: (s: PlayerStats) => s.passing_tds,
      filter: (s: PlayerStats) => s.passing_tds > 0 || s.passes_attempted > 0,
      icon: Target
    },
    { 
      label: 'Receiving TDs', 
      getValue: (s: PlayerStats) => s.receiving_tds,
      filter: (s: PlayerStats) => s.receptions > 0 || s.targets > 0,
      icon: Zap
    },
    { 
      label: 'Rushing TDs', 
      getValue: (s: PlayerStats) => s.rushing_tds,
      filter: (s: PlayerStats) => s.rushing_tds > 0 || s.rush_attempts > 0,
      icon: TrendingUp
    },
    { 
      label: 'Receptions', 
      getValue: (s: PlayerStats) => s.receptions,
      filter: (s: PlayerStats) => s.receptions > 0 || s.targets > 0,
      icon: Zap
    },
    { 
      label: 'Interceptions', 
      getValue: (s: PlayerStats) => s.interceptions,
      filter: (s: PlayerStats) => s.flag_pulls > 0 || s.interceptions > 0 || s.pass_breakups > 0,
      icon: Shield
    },
    { 
      label: 'Flag Pulls', 
      getValue: (s: PlayerStats) => s.flag_pulls,
      filter: (s: PlayerStats) => s.flag_pulls > 0 || s.interceptions > 0 || s.pass_breakups > 0,
      icon: Shield
    },
  ]

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-black text-white text-center tracking-wide">{title}</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map(category => {
          const filteredStats = stats.filter(category.filter)
          const topPlayers = [...filteredStats]
            .sort((a, b) => category.getValue(b) - category.getValue(a))
            .slice(0, 5)

          const Icon = category.icon

          return (
            <div 
              key={category.label} 
              className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 rounded-2xl p-5 hover:border-red-500/50 transition-all duration-300"
            >
              {/* Category Header */}
              <div className="flex items-center justify-center gap-2 mb-4 pb-3 border-b border-gray-700">
                <Icon className="h-5 w-5 text-red-500" />
                <h4 className="font-black text-white text-lg tracking-tight">{category.label}</h4>
              </div>
              
              {/* Leaderboard */}
              <div className="space-y-2">
                {topPlayers.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-6">No stats recorded</p>
                ) : (
                  topPlayers.map((player, index) => (
                    <div 
                      key={`${player.player_name}-${index}`}
                      className={`flex items-center justify-between py-3 px-4 rounded-xl transition-all duration-300 ${
                        index === 0 
                          ? 'bg-gradient-to-r from-red-600/30 to-orange-600/30 border border-red-500/50' 
                          : 'bg-gray-800/50 hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`flex items-center justify-center w-7 h-7 rounded-lg font-black text-sm ${
                          index === 0 
                            ? 'bg-yellow-500 text-gray-900' 
                            : index === 1
                            ? 'bg-gray-600 text-white'
                            : index === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-gray-700 text-gray-400'
                        }`}>
                          {index + 1}
                        </div>
                        <span className={`font-bold truncate ${
                          index === 0 ? 'text-white' : 'text-gray-300'
                        }`}>
                          {player.player_name}
                        </span>
                      </div>
                      <span className={`text-2xl font-black tabular-nums ${
                        index === 0 ? 'text-red-500' : 'text-red-600'
                      }`}>
                        {category.getValue(player)}
                      </span>
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
      <div className="text-center py-12 text-gray-400">
        No recent games
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {games.map(game => {
        const rhinosWon = game.winning_team_name === 'Rhinos'
        const rhinosPlayed = game.team1_name === 'Rhinos' || game.team2_name === 'Rhinos'
        
        return (
          <div 
            key={game.id}
            className={`relative overflow-hidden p-4 rounded-xl border-2 transition-all duration-300 ${
              rhinosWon 
                ? 'bg-gradient-to-r from-red-600/20 to-orange-600/20 border-red-500/50 hover:border-red-400' 
                : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold tracking-wider uppercase text-gray-400">
                Week {game.week} • {game.league}
              </span>
              {rhinosWon && (
                <Trophy className="h-4 w-4 text-yellow-400 animate-pulse" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className={`font-bold ${
                  game.winning_team_name === game.team1_name 
                    ? 'text-white' 
                    : 'text-gray-400'
                }`}>
                  {game.team1_name}
                </div>
              </div>
              <div className="flex items-center gap-3 px-4">
                <span className={`text-2xl font-black tabular-nums ${
                  game.winning_team_name === game.team1_name 
                    ? 'text-red-500' 
                    : 'text-gray-500'
                }`}>
                  {game.team1_score}
                </span>
                <span className="text-gray-600">-</span>
                <span className={`text-2xl font-black tabular-nums ${
                  game.winning_team_name === game.team2_name 
                    ? 'text-red-500' 
                    : 'text-gray-500'
                }`}>
                  {game.team2_score}
                </span>
              </div>
              <div className="flex-1 text-right">
                <div className={`font-bold ${
                  game.winning_team_name === game.team2_name 
                    ? 'text-white' 
                    : 'text-gray-400'
                }`}>
                  {game.team2_name}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Top Teams Component
function TopTeams({ teams, games }: { teams: Team[]; games: Game[] }) {
  if (teams.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        No teams available
      </div>
    )
  }

  // Get current season from latest game
  const currentSeason = games.length > 0 
    ? Math.max(...games.map(g => g.season))
    : teams.length > 0 
      ? Math.max(...teams.map(t => t.season))
      : 1

  // Filter teams to current season only
  const currentSeasonTeams = teams.filter(t => t.season === currentSeason)
  
  // Sort by win percentage
  const sortedTeams = [...currentSeasonTeams]
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
    <div className="space-y-3">
      {sortedTeams.map((team, index) => {
        const gamesPlayed = team.wins + team.losses + team.ties
        const winPct = gamesPlayed > 0 ? (team.wins / gamesPlayed * 100).toFixed(1) : '0.0'
        const isRhinos = team.name === 'Rhinos'
        
        return (
          <div 
            key={team.id}
            className={`relative overflow-hidden p-4 rounded-xl border-2 transition-all duration-300 ${
              isRhinos
                ? 'bg-gradient-to-r from-red-600/20 to-orange-600/20 border-red-500/50 hover:border-red-400'
                : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-black ${
                  index === 0 
                    ? 'bg-yellow-500 text-gray-900' 
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <div className={`font-bold ${isRhinos ? 'text-white' : 'text-gray-200'}`}>
                    {team.name}
                  </div>
                  <div className="text-xs text-gray-400">{team.league}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Record</div>
                  <div className="font-bold text-white tabular-nums">
                    {team.wins}-{team.losses}-{team.ties}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">Win %</div>
                  <div className={`font-black text-lg tabular-nums ${
                    parseFloat(winPct) >= 50 ? 'text-red-500' : 'text-gray-400'
                  }`}>
                    {winPct}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
