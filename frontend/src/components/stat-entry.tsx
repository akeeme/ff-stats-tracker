'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api, Game, Player } from '@/lib/api'
import { Plus, Minus, Target, Zap, Shield, CheckCircle2, XCircle, Layers, List } from 'lucide-react'
import { useGamesWithRealtime, usePlayersWithRealtime } from '@/hooks'
import { QuickStatEntry } from './quick-stat-entry'

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

export function StatEntry() {
  const queryClient = useQueryClient()
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Queries with realtime updates
  const { data: games = [] } = useGamesWithRealtime()
  const { data: players = [] } = usePlayersWithRealtime()

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // Mutations
  const createStatsMutation = useMutation({
    mutationFn: api.createPlayerStats,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      const message = data.message || 'Stats logged successfully!'
      setToast({ message, type: 'success' })
    },
    onError: (error: Error) => {
      setToast({ message: error.message || 'Failed to log stats', type: 'error' })
    },
  })

  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [entryMode, setEntryMode] = useState<'quick' | 'detailed'>('quick')
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)

  const activePlayers = players.filter(player => player.is_active)

  // Get unique seasons sorted by most recent
  const seasons = Array.from(new Set(games.map(g => g.season))).sort((a, b) => b - a)

  // Auto-select most recent season if none selected
  useEffect(() => {
    if (!selectedSeason && seasons.length > 0) {
      setSelectedSeason(seasons[0])
    }
  }, [seasons.length, selectedSeason])

  // Filter games by selected season and sort by week descending
  const seasonGames = selectedSeason
    ? games.filter(g => g.season === selectedSeason).sort((a, b) => b.week - a.week)
    : []

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-top-5 ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Stat Entry</h2>
          <p className="text-gray-600 dark:text-gray-400">Enter player statistics for each game</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setEntryMode('quick')}
            variant={entryMode === 'quick' ? 'default' : 'outline'}
            className={entryMode === 'quick' ? 'btn-primary gap-2' : 'btn-secondary gap-2'}
          >
            <Layers className="h-4 w-4" />
            Quick Entry
          </Button>
          <Button
            onClick={() => setEntryMode('detailed')}
            variant={entryMode === 'detailed' ? 'default' : 'outline'}
            className={entryMode === 'detailed' ? 'btn-primary gap-2' : 'btn-secondary gap-2'}
          >
            <List className="h-4 w-4" />
            Detailed
          </Button>
        </div>
      </div>
      
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-red-600" />
            Select Game
          </CardTitle>
          <CardDescription>
            Choose a season and game to enter stats for
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Season Selector */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Season</Label>
            <div className="flex flex-wrap gap-2">
              {seasons.map(season => (
                <Button
                  key={season}
                  onClick={() => {
                    setSelectedSeason(season)
                    setSelectedGame(null) // Reset selected game when changing season
                  }}
                  variant={selectedSeason === season ? 'default' : 'outline'}
                  className={selectedSeason === season ? 'btn-primary' : 'btn-secondary'}
                >
                  Season {season}
                </Button>
              ))}
            </div>
          </div>

          {/* Games Grid */}
          {selectedSeason && (
            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Games ({seasonGames.length})
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {seasonGames.map(game => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGame(game)}
                    className={`relative text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                      selectedGame?.id === game.id
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                            selectedGame?.id === game.id
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}>
                            Week {game.week}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{game.league}</span>
                        </div>
                        <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {game.team1_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">vs</div>
                        <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {game.team2_name}
                        </div>
                      </div>
                      {selectedGame?.id === game.id && (
                        <CheckCircle2 className="h-5 w-5 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedGame && (
        <>
          {entryMode === 'quick' ? (
            <QuickStatEntry
              game={selectedGame}
              players={activePlayers}
              onSubmit={(stats) => createStatsMutation.mutate(stats)}
            />
          ) : (
            <Tabs defaultValue="qb" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="qb" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  QB Stats
                </TabsTrigger>
                <TabsTrigger value="receiver" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Receiver Stats
                </TabsTrigger>
                <TabsTrigger value="rushing" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Rushing Stats
                </TabsTrigger>
                <TabsTrigger value="defense" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Defense Stats
                </TabsTrigger>
              </TabsList>

              <TabsContent value="qb">
                <QBStatsForm 
                  game={selectedGame}
                  players={activePlayers}
                  onSubmit={(stats) => createStatsMutation.mutate(stats)}
                />
              </TabsContent>

              <TabsContent value="receiver">
                <ReceiverStatsForm 
                  game={selectedGame}
                  players={activePlayers}
                  onSubmit={(stats) => createStatsMutation.mutate(stats)}
                />
              </TabsContent>

              <TabsContent value="rushing">
                <RushingStatsForm 
                  game={selectedGame}
                  players={activePlayers}
                  onSubmit={(stats) => createStatsMutation.mutate(stats)}
                />
              </TabsContent>

              <TabsContent value="defense">
                <DefenseStatsForm 
                  game={selectedGame}
                  players={activePlayers}
                  onSubmit={(stats) => createStatsMutation.mutate(stats)}
                />
              </TabsContent>
            </Tabs>
          )}
        </>
      )}
    </div>
  )
}

function QBStatsForm({ 
  game, 
  players, 
  onSubmit 
}: { 
  game: Game
  players: Player[]
  onSubmit: (stats: StatSubmission) => void 
}) {
  const [formData, setFormData] = useState({
    player_name: '',
    passing_tds: 0,
    passes_completed: 0,
    passes_attempted: 0,
    interceptions_thrown: 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      game_week: game.week,
      game_season: game.season,
      league: game.league,
      team1_name: game.team1_name,
      team2_name: game.team2_name,
    })
    setFormData({
      player_name: '',
      passing_tds: 0,
      passes_completed: 0,
      passes_attempted: 0,
      interceptions_thrown: 0,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          QB Stats Entry
        </CardTitle>
        <CardDescription>
          Enter quarterback statistics for {game.team1_name} vs {game.team2_name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="qb-player" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Select QB</Label>
            <select
              id="qb-player"
              value={formData.player_name}
              onChange={(e) => setFormData({ ...formData, player_name: e.target.value })}
              className="input-modern w-full"
              required
            >
              <option value="">Select a player</option>
              {players.map((player) => (
                <option key={player.id} value={player.name}>
                  {player.jersey_number ? `#${player.jersey_number}` : ''} {player.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Passing TDs</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setFormData({ ...formData, passing_tds: Math.max(0, formData.passing_tds - 1) })}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min="0"
                  value={formData.passing_tds}
                  onChange={(e) => setFormData({ ...formData, passing_tds: Number(e.target.value) })}
                  className="text-center"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setFormData({ ...formData, passing_tds: formData.passing_tds + 1 })}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Completions</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setFormData({ ...formData, passes_completed: Math.max(0, formData.passes_completed - 1) })}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min="0"
                  value={formData.passes_completed}
                  onChange={(e) => setFormData({ ...formData, passes_completed: Number(e.target.value) })}
                  className="text-center"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setFormData({ ...formData, passes_completed: formData.passes_completed + 1 })}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Attempts</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setFormData({ ...formData, passes_attempted: Math.max(0, formData.passes_attempted - 1) })}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min="0"
                  value={formData.passes_attempted}
                  onChange={(e) => setFormData({ ...formData, passes_attempted: Number(e.target.value) })}
                  className="text-center"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setFormData({ ...formData, passes_attempted: formData.passes_attempted + 1 })}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label>Interceptions</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setFormData({ ...formData, interceptions_thrown: Math.max(0, formData.interceptions_thrown - 1) })}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min="0"
                  value={formData.interceptions_thrown}
                  onChange={(e) => setFormData({ ...formData, interceptions_thrown: Number(e.target.value) })}
                  className="text-center"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setFormData({ ...formData, interceptions_thrown: formData.interceptions_thrown + 1 })}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full">
            Log QB Stats
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function ReceiverStatsForm({ 
  game, 
  players, 
  onSubmit 
}: { 
  game: Game
  players: Player[]
  onSubmit: (stats: StatSubmission) => void 
}) {
  const [formData, setFormData] = useState({
    player_name: '',
    receptions: 0,
    targets: 0,
    receiving_tds: 0,
    drops: 0,
    first_downs: 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      game_week: game.week,
      game_season: game.season,
      league: game.league,
      team1_name: game.team1_name,
      team2_name: game.team2_name,
    })
    setFormData({
      player_name: '',
      receptions: 0,
      targets: 0,
      receiving_tds: 0,
      drops: 0,
      first_downs: 0,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Receiver Stats Entry
        </CardTitle>
        <CardDescription>
          Enter receiver statistics for {game.team1_name} vs {game.team2_name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="receiver-player">Select Receiver</Label>
            <select
              id="receiver-player"
              value={formData.player_name}
              onChange={(e) => setFormData({ ...formData, player_name: e.target.value })}
              className="input-modern w-full"
              required
            >
              <option value="">Select a player</option>
              {players.map((player) => (
                <option key={player.id} value={player.name}>
                  {player.jersey_number ? `#${player.jersey_number}` : ''} {player.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'receptions', label: 'Receptions' },
              { key: 'targets', label: 'Targets' },
              { key: 'receiving_tds', label: 'Receiving TDs' },
              { key: 'drops', label: 'Drops' },
              { key: 'first_downs', label: 'First Downs' },
            ].map(({ key, label }) => (
              <div key={key}>
                <Label>{label}</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setFormData({ ...formData, [key]: Math.max(0, (formData[key as keyof typeof formData] as number) - 1) })}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min="0"
                    value={formData[key as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [key]: Number(e.target.value) })}
                    className="text-center"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setFormData({ ...formData, [key]: (formData[key as keyof typeof formData] as number) + 1 })}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full">
            Log Receiver Stats
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function RushingStatsForm({ 
  game, 
  players, 
  onSubmit 
}: { 
  game: Game
  players: Player[]
  onSubmit: (stats: StatSubmission) => void 
}) {
  const [formData, setFormData] = useState({
    player_name: '',
    rush_attempts: 0,
    rushing_tds: 0,
    first_downs: 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      game_week: game.week,
      game_season: game.season,
      league: game.league,
      team1_name: game.team1_name,
      team2_name: game.team2_name,
    })
    setFormData({
      player_name: '',
      rush_attempts: 0,
      rushing_tds: 0,
      first_downs: 0,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Rushing Stats Entry
        </CardTitle>
        <CardDescription>
          Enter rushing statistics for {game.team1_name} vs {game.team2_name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="rushing-player">Select Rusher</Label>
            <select
              id="rushing-player"
              value={formData.player_name}
              onChange={(e) => setFormData({ ...formData, player_name: e.target.value })}
              className="input-modern w-full"
              required
            >
              <option value="">Select a player</option>
              {players.map((player) => (
                <option key={player.id} value={player.name}>
                  {player.jersey_number ? `#${player.jersey_number}` : ''} {player.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'rush_attempts', label: 'Attempts' },
              { key: 'rushing_tds', label: 'Rushing TDs' },
              { key: 'first_downs', label: 'First Downs' },
            ].map(({ key, label }) => (
              <div key={key}>
                <Label>{label}</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setFormData({ ...formData, [key]: Math.max(0, (formData[key as keyof typeof formData] as number) - 1) })}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min="0"
                    value={formData[key as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [key]: Number(e.target.value) })}
                    className="text-center"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setFormData({ ...formData, [key]: (formData[key as keyof typeof formData] as number) + 1 })}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full">
            Log Rushing Stats
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function DefenseStatsForm({ 
  game, 
  players, 
  onSubmit 
}: { 
  game: Game
  players: Player[]
  onSubmit: (stats: StatSubmission) => void 
}) {
  const [formData, setFormData] = useState({
    player_name: '',
    flag_pulls: 0,
    interceptions: 0,
    pass_breakups: 0,
    def_td: 0,
    sacks: 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      game_week: game.week,
      game_season: game.season,
      league: game.league,
      team1_name: game.team1_name,
      team2_name: game.team2_name,
    })
    setFormData({
      player_name: '',
      flag_pulls: 0,
      interceptions: 0,
      pass_breakups: 0,
      def_td: 0,
      sacks: 0,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Defense Stats Entry
        </CardTitle>
        <CardDescription>
          Enter defensive statistics for {game.team1_name} vs {game.team2_name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="defense-player">Select Defender</Label>
            <select
              id="defense-player"
              value={formData.player_name}
              onChange={(e) => setFormData({ ...formData, player_name: e.target.value })}
              className="input-modern w-full"
              required
            >
              <option value="">Select a player</option>
              {players.map((player) => (
                <option key={player.id} value={player.name}>
                  {player.jersey_number ? `#${player.jersey_number}` : ''} {player.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'flag_pulls', label: 'Flag Pulls' },
              { key: 'sacks', label: 'Sacks' },
              { key: 'interceptions', label: 'Interceptions' },
              { key: 'pass_breakups', label: 'Pass Breakups' },
              { key: 'def_td', label: 'Defensive TDs' },
            ].map(({ key, label }) => (
              <div key={key}>
                <Label>{label}</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setFormData({ ...formData, [key]: Math.max(0, (formData[key as keyof typeof formData] as number) - 1) })}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min="0"
                    value={formData[key as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [key]: Number(e.target.value) })}
                    className="text-center"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setFormData({ ...formData, [key]: (formData[key as keyof typeof formData] as number) + 1 })}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full">
            Log Defense Stats
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
