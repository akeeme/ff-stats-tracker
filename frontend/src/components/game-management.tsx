'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, Game, Team } from '@/lib/api'
import { Plus, Calendar, Trophy, Users } from 'lucide-react'
import { useTeamsWithRealtime, useGamesWithRealtime, useAdmin } from '@/hooks'

export function GameManagement() {
  const queryClient = useQueryClient()
  const { isAdmin } = useAdmin()

  // Queries with realtime updates
  const { data: teams = [] } = useTeamsWithRealtime()
  const { data: games = [] } = useGamesWithRealtime()

  // Mutations
  const createGameMutation = useMutation({
    mutationFn: api.createGame,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] })
    },
  })

  const updateGameMutation = useMutation({
    mutationFn: ({ id, game, version }: { id: number; game: Partial<Game>; version: number }) =>
      api.updateGame(id, game, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] })
    },
  })

  const deleteGameMutation = useMutation({
    mutationFn: ({ id, version }: { id: number; version: number }) =>
      api.deleteGame(id, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] })
    },
  })

  // Get active teams
  const activeTeams = teams.filter(team => team.is_active === 1)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Game Management</h2>
      
      {isAdmin && (
        <CreateGameForm 
          teams={activeTeams}
          onSubmit={(game) => createGameMutation.mutate(game)}
        />
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            teams={activeTeams}
            isAdmin={isAdmin}
            onUpdate={(updatedGame) => updateGameMutation.mutate({
              id: game.id,
              game: updatedGame,
              version: game.version
            })}
            onDelete={() => deleteGameMutation.mutate({
              id: game.id,
              version: game.version
            })}
          />
        ))}
      </div>
    </div>
  )
}

function CreateGameForm({ 
  teams, 
  onSubmit 
}: { 
  teams: Team[]
  onSubmit: (game: { week: number; league: string; season: number; team1_name: string; team1_score: number; team2_name: string; team2_score: number; winning_team_name?: string }) => void 
}) {
  const [formData, setFormData] = useState({
    week: 1,
    league: '',
    season: 1,
    team1_name: '',
    team1_score: 0,
    team2_name: '',
    team2_score: 0,
    winning_team_name: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Determine winning team based on scores
    let winningTeam = ''
    if (formData.team1_score > formData.team2_score) {
      winningTeam = formData.team1_name
    } else if (formData.team2_score > formData.team1_score) {
      winningTeam = formData.team2_name
    }

    onSubmit({
      ...formData,
      winning_team_name: winningTeam || undefined,
    })
    
    setFormData({
      week: 1,
      league: '',
      season: 1,
      team1_name: '',
      team1_score: 0,
      team2_name: '',
      team2_score: 0,
      winning_team_name: '',
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create New Game
        </CardTitle>
        <CardDescription>
          Add a new game to the schedule
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="week">Week</Label>
              <Input
                id="week"
                type="number"
                min="1"
                value={formData.week}
                onChange={(e) => setFormData({ ...formData, week: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <Label htmlFor="league">League</Label>
              <Input
                id="league"
                value={formData.league}
                onChange={(e) => setFormData({ ...formData, league: e.target.value })}
                required
              />
              
            </div>
            <div>
              <Label htmlFor="season">Season</Label>
              <Input
                id="season"
                type="number"
                min="1"
                value={formData.season}
                onChange={(e) => setFormData({ ...formData, season: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="team1">Team 1</Label>
              <select
                id="team1"
                value={formData.team1_name}
                onChange={(e) => setFormData({ ...formData, team1_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">Select Team 1</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.name}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="team1_score">Team 1 Score</Label>
              <Input
                id="team1_score"
                type="number"
                min="0"
                value={formData.team1_score}
                onChange={(e) => setFormData({ ...formData, team1_score: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="team2">Team 2</Label>
              <select
                id="team2"
                value={formData.team2_name}
                onChange={(e) => setFormData({ ...formData, team2_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">Select Team 2</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.name}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="team2_score">Team 2 Score</Label>
              <Input
                id="team2_score"
                type="number"
                min="0"
                value={formData.team2_score}
                onChange={(e) => setFormData({ ...formData, team2_score: Number(e.target.value) })}
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Create Game
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function GameCard({ 
  game, 
  teams,
  isAdmin,
  onUpdate, 
  onDelete 
}: { 
  game: Game
  teams: Team[]
  isAdmin: boolean
  onUpdate: (game: Partial<Game>) => void
  onDelete: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    week: game.week,
    league: game.league,
    season: game.season,
    team1_name: game.team1_name,
    team1_score: game.team1_score,
    team2_name: game.team2_name,
    team2_score: game.team2_score,
  })

  const handleSave = () => {
    onUpdate(editData)
    setIsEditing(false)
  }

  const getWinner = () => {
    if (game.team1_score > game.team2_score) return game.team1_name
    if (game.team2_score > game.team1_score) return game.team2_name
    return 'Tie'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Week {isAdmin && isEditing ? (
              <Input
                type="number"
                min="1"
                value={editData.week}
                onChange={(e) => setEditData({ ...editData, week: Number(e.target.value) })}
                className="w-20"
              />
            ) : (
              game.week
            )}
          </CardTitle>
          {isAdmin && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={handleSave}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={onDelete}>
                    Delete
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
        <CardDescription>
          {isAdmin && isEditing ? (
            <Input
              value={editData.league}
              onChange={(e) => setEditData({ ...editData, league: e.target.value })}
            />
          ) : (
            `${game.league} - Season ${game.season}`
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {isAdmin && isEditing ? (
                <select
                  value={editData.team1_name}
                  onChange={(e) => setEditData({ ...editData, team1_name: e.target.value })}
                  className="px-2 py-1 border rounded"
                >
                  {teams.map((team) => (
                    <option key={team.id} value={team.name}>
                      {team.name}
                    </option>
                  ))}
                </select>
              ) : (
                game.team1_name
              )}
            </div>
            <div className="text-2xl font-bold">
              {isAdmin && isEditing ? (
                <Input
                  type="number"
                  min="0"
                  value={editData.team1_score}
                  onChange={(e) => setEditData({ ...editData, team1_score: Number(e.target.value) })}
                  className="w-16 text-center"
                />
              ) : (
                game.team1_score
              )}
            </div>
          </div>

          <div className="text-center text-muted-foreground">vs</div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {isAdmin && isEditing ? (
                <select
                  value={editData.team2_name}
                  onChange={(e) => setEditData({ ...editData, team2_name: e.target.value })}
                  className="px-2 py-1 border rounded"
                >
                  {teams.map((team) => (
                    <option key={team.id} value={team.name}>
                      {team.name}
                    </option>
                  ))}
                </select>
              ) : (
                game.team2_name
              )}
            </div>
            <div className="text-2xl font-bold">
              {isAdmin && isEditing ? (
                <Input
                  type="number"
                  min="0"
                  value={editData.team2_score}
                  onChange={(e) => setEditData({ ...editData, team2_score: Number(e.target.value) })}
                  className="w-16 text-center"
                />
              ) : (
                game.team2_score
              )}
            </div>
          </div>

          {!isEditing && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-lg font-semibold">
                <Trophy className="h-5 w-5" />
                Winner: {getWinner()}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
