'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, Player, Team } from '@/lib/api'
import { Plus, Users } from 'lucide-react'
import { useAdmin } from '@/hooks'

export default function PlayersPage() {
  const queryClient = useQueryClient()
  const [selectedSeason, setSelectedSeason] = useState<number>(1)
  const { isAdmin, isLoading: adminLoading } = useAdmin()

  // Queries
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: api.getTeams,
  })

  const { data: players = [], isLoading: playersLoading } = useQuery({
    queryKey: ['players'],
    queryFn: api.getPlayers,
  })

  // Mutations
  const createPlayerMutation = useMutation({
    mutationFn: api.createPlayer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] })
    },
  })

  // Get unique seasons with null checks
  const seasons = teams ? Array.from(new Set(teams.map(team => team.season))).sort((a, b) => b - a) : []
  const currentSeasonTeams = teams ? teams.filter(team => team.season === selectedSeason) : []
  const currentSeasonPlayers = players ? players.filter(player => player.season === selectedSeason) : []

  // Show loading state
  if (teamsLoading || playersLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading players...</p>
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
            {isAdmin ? 'Player Management' : 'Players'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isAdmin ? 'Manage your players for each season' : 'View players for each season'}
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

      {/* Create Player Form */}
      {isAdmin && (
        <CreatePlayerForm 
          teams={currentSeasonTeams}
          season={selectedSeason}
          onSubmit={(player) => createPlayerMutation.mutate(player)}
        />
      )}
      
      {/* Players Grid */}
      {currentSeasonPlayers.length === 0 ? (
        <div className="card-modern p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No players found</h3>
          <p className="text-gray-600">Add players to teams for Season {selectedSeason}</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {currentSeasonPlayers.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      )}
    </div>
  )
}

function CreatePlayerForm({ 
  teams, 
  season, 
  onSubmit 
}: { 
  teams: Team[]
  season: number
  onSubmit: (player: any) => void 
}) {
  const [formData, setFormData] = useState({
    name: '',
    team_name: '',
    jersey_number: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      season,
      jersey_number: formData.jersey_number || undefined,
    })
    setFormData({ name: '', team_name: '', jersey_number: '' })
  }

  return (
    <div className="card-modern p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
          <Users className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Add New Player</h3>
          <p className="text-gray-600 text-sm">Add a player to a team for the current season</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="player-name" className="text-sm font-semibold text-gray-700 mb-2 block">Player Name</Label>
          <Input
            id="player-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-modern"
            placeholder="Enter player name"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="team-select" className="text-sm font-semibold text-gray-700 mb-2 block">Team</Label>
          <select
            id="team-select"
            value={formData.team_name}
            onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
            className="input-modern"
            required
          >
            <option value="">Select a team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.name}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <Label htmlFor="jersey" className="text-sm font-semibold text-gray-700 mb-2 block">Jersey Number (Optional)</Label>
          <Input
            id="jersey"
            value={formData.jersey_number}
            onChange={(e) => setFormData({ ...formData, jersey_number: e.target.value })}
            className="input-modern"
            placeholder="Enter jersey number"
          />
        </div>
        
        <Button type="submit" className="btn-primary w-full">
          <Users className="h-4 w-4 mr-2" />
          Add Player
        </Button>
      </form>
    </div>
  )
}

function PlayerCard({ player }: { player: Player }) {
  return (
    <div className="relative card-bubbly p-6 border-2 border-gray-200/50 dark:border-gray-600/50 hover:border-blue-400/60 dark:hover:border-blue-500/60 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80">
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/10 to-transparent rounded-bl-full"></div>
      
      <div className="flex items-center gap-4 mb-4 relative z-10">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/20">
          <Users className="h-7 w-7 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {player.jersey_number && (
              <span className="inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm font-bold mr-2">
                #{player.jersey_number}
              </span>
            )}
            {player.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{player.team_name}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${player.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {player.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">Season {player.season}</span>
      </div>
    </div>
  )
}
