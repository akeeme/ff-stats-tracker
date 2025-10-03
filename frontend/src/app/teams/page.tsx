'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, Team } from '@/lib/api'
import { Plus, Trophy, Edit, Trash2 } from 'lucide-react'

export default function TeamsPage() {
  const queryClient = useQueryClient()
  const [selectedSeason, setSelectedSeason] = useState<number>(1)

  // Queries
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: api.getTeams,
  })

  // Mutations
  const createTeamMutation = useMutation({
    mutationFn: api.createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })

  const updateTeamMutation = useMutation({
    mutationFn: ({ id, team, version }: { id: number; team: Partial<Team>; version: number }) =>
      api.updateTeam(id, team, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })

  const deleteTeamMutation = useMutation({
    mutationFn: ({ id, version }: { id: number; version: number }) =>
      api.deleteTeam(id, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })

  // Get unique seasons with null checks
  const seasons = teams ? Array.from(new Set(teams.map(team => team.season))).sort((a, b) => b - a) : []
  const currentSeasonTeams = teams ? teams.filter(team => team.season === selectedSeason) : []

  // Show loading state
  if (teamsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teams...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Team Management</h2>
          <p className="text-gray-600">Manage your teams for each season</p>
        </div>
        <div className="flex items-center space-x-3">
          <Label htmlFor="season-select" className="text-sm font-medium text-gray-700">Season:</Label>
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

      {/* Create Team Form */}
      <CreateTeamForm onSubmit={(team) => createTeamMutation.mutate(team)} />
      
      {/* Teams Grid */}
      {currentSeasonTeams.length === 0 ? (
        <div className="card-modern p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No teams found</h3>
          <p className="text-gray-600">Create your first team to get started with Season {selectedSeason}</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {currentSeasonTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onUpdate={(updatedTeam) => updateTeamMutation.mutate({
                id: team.id,
                team: updatedTeam,
                version: team.version
              })}
              onDelete={() => deleteTeamMutation.mutate({
                id: team.id,
                version: team.version
              })}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CreateTeamForm({ onSubmit }: { onSubmit: (team: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    season: 1,
    league: '',
    wins: 0,
    losses: 0,
    ties: 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({ name: '', season: 1, league: '', wins: 0, losses: 0, ties: 0 })
  }

  return (
    <div className="card-modern p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
          <Plus className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Create New Team</h3>
          <p className="text-gray-600 text-sm">Add a new team to the current season</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="name" className="text-sm font-semibold text-gray-700 mb-2 block">Team Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-modern"
              placeholder="Enter team name"
              required
            />
          </div>
          <div>
            <Label htmlFor="league" className="text-sm font-semibold text-gray-700 mb-2 block">League</Label>
            <Input
              id="league"
              value={formData.league}
              onChange={(e) => setFormData({ ...formData, league: e.target.value })}
              className="input-modern"
              placeholder="Enter league name"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="wins" className="text-sm font-semibold text-gray-700 mb-2 block">Wins</Label>
            <Input
              id="wins"
              type="number"
              min="0"
              value={formData.wins}
              onChange={(e) => setFormData({ ...formData, wins: Number(e.target.value) })}
              className="input-modern text-center"
            />
          </div>
          <div>
            <Label htmlFor="losses" className="text-sm font-semibold text-gray-700 mb-2 block">Losses</Label>
            <Input
              id="losses"
              type="number"
              min="0"
              value={formData.losses}
              onChange={(e) => setFormData({ ...formData, losses: Number(e.target.value) })}
              className="input-modern text-center"
            />
          </div>
          <div>
            <Label htmlFor="ties" className="text-sm font-semibold text-gray-700 mb-2 block">Ties</Label>
            <Input
              id="ties"
              type="number"
              min="0"
              value={formData.ties}
              onChange={(e) => setFormData({ ...formData, ties: Number(e.target.value) })}
              className="input-modern text-center"
            />
          </div>
        </div>
        
        <Button type="submit" className="btn-primary w-full">
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </form>
    </div>
  )
}

function TeamCard({ 
  team, 
  onUpdate, 
  onDelete 
}: { 
  team: Team
  onUpdate: (team: Partial<Team>) => void
  onDelete: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: team.name,
    league: team.league,
    wins: team.wins,
    losses: team.losses,
    ties: team.ties,
  })

  const handleSave = () => {
    onUpdate(editData)
    setIsEditing(false)
  }

  return (
    <div className="card-bubbly p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div>
            {isEditing ? (
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="text-lg font-bold border-0 bg-transparent p-0 focus:ring-0"
              />
            ) : (
              <h3 className="text-lg font-bold text-gray-900">{team.name}</h3>
            )}
            {isEditing ? (
              <Input
                value={editData.league}
                onChange={(e) => setEditData({ ...editData, league: e.target.value })}
                className="text-sm text-gray-600 border-0 bg-transparent p-0 focus:ring-0"
                placeholder="League"
              />
            ) : (
              <p className="text-sm text-gray-600">{team.league}</p>
            )}
          </div>
        </div>
        
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
              <Button size="sm" onClick={onDelete} className="btn-ghost text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-green-50 rounded-xl p-4">
          <div className="text-3xl font-bold text-green-600 mb-1">
            {isEditing ? (
              <Input
                type="number"
                min="0"
                value={editData.wins}
                onChange={(e) => setEditData({ ...editData, wins: Number(e.target.value) })}
                className="text-center text-3xl font-bold text-green-600 border-0 bg-transparent p-0 focus:ring-0"
              />
            ) : (
              team.wins
            )}
          </div>
          <div className="text-sm font-medium text-green-700">Wins</div>
        </div>
        
        <div className="bg-red-50 rounded-xl p-4">
          <div className="text-3xl font-bold text-red-600 mb-1">
            {isEditing ? (
              <Input
                type="number"
                min="0"
                value={editData.losses}
                onChange={(e) => setEditData({ ...editData, losses: Number(e.target.value) })}
                className="text-center text-3xl font-bold text-red-600 border-0 bg-transparent p-0 focus:ring-0"
              />
            ) : (
              team.losses
            )}
          </div>
          <div className="text-sm font-medium text-red-700">Losses</div>
        </div>
        
        <div className="bg-yellow-50 rounded-xl p-4">
          <div className="text-3xl font-bold text-yellow-600 mb-1">
            {isEditing ? (
              <Input
                type="number"
                min="0"
                value={editData.ties}
                onChange={(e) => setEditData({ ...editData, ties: Number(e.target.value) })}
                className="text-center text-3xl font-bold text-yellow-600 border-0 bg-transparent p-0 focus:ring-0"
              />
            ) : (
              team.ties
            )}
          </div>
          <div className="text-sm font-medium text-yellow-700">Ties</div>
        </div>
      </div>
    </div>
  )
}
