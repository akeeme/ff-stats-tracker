'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, Game, Team } from '@/lib/api'
import { Calendar, Trophy, Edit, Trash2 } from 'lucide-react'
import { useAdmin } from '@/hooks'

export default function GamesPage() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [selectedSeason, setSelectedSeason] = useState<number>(1)
  const { isAdmin, isLoading: adminLoading } = useAdmin()

  // Queries
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: api.getTeams,
  })

  const { data: games = [], isLoading: gamesLoading } = useQuery({
    queryKey: ['games'],
    queryFn: api.getGames,
  })

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

  // Get unique seasons with null checks
  const seasons = teams ? Array.from(new Set(teams.map(team => team.season))).sort((a, b) => b - a) : []
  const currentSeasonTeams = teams ? teams.filter(team => team.season === selectedSeason) : []
  const currentSeasonGames = games ? games.filter(game => game.season === selectedSeason) : []

  // Show loading state
  if (teamsLoading || gamesLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading games...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isAdmin ? 'Game Management' : 'Games'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isAdmin ? 'Manage your games for each season' : 'View games for each season'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Label htmlFor="season-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">Season:</Label>
          <select
            id="season-select"
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(Number(e.target.value))}
            className="input-modern w-40"
          >
            {seasons.map(season => (
              <option key={season} value={season}>Season {season}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Create Game Form */}
      {isAdmin && (
        <CreateGameForm 
          teams={currentSeasonTeams}
          season={selectedSeason}
          onSubmit={(game) => createGameMutation.mutate(game)}
        />
      )}
      
      {/* Games Grid */}
      {currentSeasonGames.length === 0 ? (
        <div className="card-modern p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No games found</h3>
          <p className="text-gray-600">Create your first game for Season {selectedSeason}</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {currentSeasonGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              teams={currentSeasonTeams}
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
              onClick={() => router.push(`/stats?gameId=${game.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CreateGameForm({ 
  teams, 
  season, 
  onSubmit 
}: { 
  teams: Team[]
  season: number
  onSubmit: (game: { team1_name: string; team2_name: string; week: number; season: number; league: string }) => void 
}) {
  const [formData, setFormData] = useState({
    team1_name: '',
    team2_name: '',
    week: 1,
    winning_team_name: '',
    season: season,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Get league from the selected team
    const selectedTeam = teams.find(t => t.name === formData.team1_name)
    const league = selectedTeam?.league || ''
    onSubmit({ ...formData, league })
    setFormData({ 
      team1_name: '', 
      team2_name: '', 
      week: 1, 
      winning_team_name: '',
      season: season
    })
  }

  return (
    <div className="card-modern p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
          <Calendar className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Create New Game</h3>
          <p className="text-gray-600 text-sm">Add a new game for the current season</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="team1" className="text-sm font-semibold text-gray-700 mb-2 block">Team 1</Label>
            <select
              id="team1"
              value={formData.team1_name}
              onChange={(e) => setFormData({ ...formData, team1_name: e.target.value })}
              className="input-modern"
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
            <Label htmlFor="team2" className="text-sm font-semibold text-gray-700 mb-2 block">Team 2</Label>
            <select
              id="team2"
              value={formData.team2_name}
              onChange={(e) => setFormData({ ...formData, team2_name: e.target.value })}
              className="input-modern"
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
        </div>
        
        <div>
          <Label htmlFor="week" className="text-sm font-semibold text-gray-700 mb-2 block">Week</Label>
          <Input
            id="week"
            type="number"
            min="1"
            max="20"
            value={formData.week}
            onChange={(e) => setFormData({ ...formData, week: Number(e.target.value) })}
            className="input-modern"
            placeholder="Enter week number (1-20)"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="winning-team" className="text-sm font-semibold text-gray-700 mb-2 block">Winning Team</Label>
          <select
            id="winning-team"
            value={formData.winning_team_name}
            onChange={(e) => setFormData({ ...formData, winning_team_name: e.target.value })}
            className="input-modern"
          >
            <option value="">Select Winning Team (Optional)</option>
            {teams.map((team) => (
              <option key={team.id} value={team.name}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        
        <Button type="submit" className="btn-primary w-full">
          <Calendar className="h-4 w-4 mr-2" />
          Create Game
        </Button>
      </form>
    </div>
  )
}

function GameCard({ 
  game, 
  teams,
  isAdmin,
  onUpdate, 
  onDelete,
  onClick
}: { 
  game: Game
  teams: Team[]
  isAdmin: boolean
  onUpdate: (game: Partial<Game>) => void
  onDelete: () => void
  onClick: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    team1_name: game.team1_name,
    team2_name: game.team2_name,
    week: game.week,
    winning_team_name: game.winning_team_name || '',
  })

  const handleSave = () => {
    onUpdate(editData)
    setIsEditing(false)
  }

  return (
    <div 
      onClick={(e) => {
        // Don't navigate if clicking on buttons or inputs
        if (!(e.target as HTMLElement).closest('button, input, select')) {
          onClick()
        }
      }}
      className="relative card-bubbly p-6 border-2 border-gray-200/50 dark:border-gray-600/50 hover:border-green-400/60 dark:hover:border-green-500/60 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 cursor-pointer"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-400/10 to-transparent rounded-bl-full"></div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30 ring-2 ring-green-400/20">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            {isAdmin && isEditing ? (
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <select
                    value={editData.team1_name}
                    onChange={(e) => setEditData({ ...editData, team1_name: e.target.value })}
                    className="text-sm font-bold border rounded px-2 py-1"
                  >
                    {teams.map((team) => (
                      <option key={team.id} value={team.name}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-gray-400 font-bold">vs</span>
                  <select
                    value={editData.team2_name}
                    onChange={(e) => setEditData({ ...editData, team2_name: e.target.value })}
                    className="text-sm font-bold border rounded px-2 py-1"
                  >
                    {teams.map((team) => (
                      <option key={team.id} value={team.name}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={editData.week}
                  onChange={(e) => setEditData({ ...editData, week: Number(e.target.value) })}
                  className="w-24"
                  placeholder="Week"
                />
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {game.team1_name} <span className="text-gray-400 dark:text-gray-500">vs</span> {game.team2_name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-block px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-bold">
                    Week {game.week}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Season {game.season}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {isAdmin && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSave} className="btn-primary">
                  Save
                </Button>
                <Button size="sm" onClick={() => setIsEditing(false)} className="btn-secondary">
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" onClick={() => setIsEditing(true)} className="btn-ghost">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={onDelete} className="btn-ghost text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      
      {game.winning_team_name && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl p-3 text-center border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
              <span className="font-bold text-yellow-800 dark:text-yellow-300">
                Winner: {game.winning_team_name}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
