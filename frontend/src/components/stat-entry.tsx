'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api, Game, Player } from '@/lib/api'
import { Plus, Minus, Target, Zap, Shield } from 'lucide-react'
import { useGamesWithRealtime, usePlayersWithRealtime } from '@/hooks'

export function StatEntry() {
  const queryClient = useQueryClient()

  // Queries with realtime updates
  const { data: games = [] } = useGamesWithRealtime()
  const { data: players = [] } = usePlayersWithRealtime()

  // Mutations
  const createStatsMutation = useMutation({
    mutationFn: api.createPlayerStats,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  const [selectedGame, setSelectedGame] = useState<Game | null>(null)

  const activePlayers = players.filter(player => player.is_active)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Stat Entry</h2>
        <p className="text-gray-600 dark:text-gray-400">Enter player statistics for each game</p>
      </div>
      
      <Card className="card-modern">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-red-600" />
            Select Game
          </CardTitle>
          <CardDescription>
            Choose a game to enter stats for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <select
            value={selectedGame?.id || ''}
            onChange={(e) => {
              const gameId = Number(e.target.value)
              const game = games.find(g => g.id === gameId)
              setSelectedGame(game || null)
            }}
            className="input-modern w-full"
          >
            <option value="">Select a game</option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                Week {game.week} - {game.league} Season {game.season}: {game.team1_name} vs {game.team2_name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedGame && (
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
  onSubmit: (stats: any) => void 
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
  onSubmit: (stats: any) => void 
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
  onSubmit: (stats: any) => void 
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
  onSubmit: (stats: any) => void 
}) {
  const [formData, setFormData] = useState({
    player_name: '',
    flag_pulls: 0,
    interceptions: 0,
    pass_breakups: 0,
    def_td: 0,
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
