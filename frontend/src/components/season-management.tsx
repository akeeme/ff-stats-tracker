'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, Team } from '@/lib/api'
import { Calendar, Copy, Archive, AlertTriangle, Lock } from 'lucide-react'
import { useTeamsWithRealtime, useAdmin } from '@/hooks'

export function SeasonManagement() {
  const queryClient = useQueryClient()
  const { isAdmin } = useAdmin()

  // Queries with realtime updates
  const { data: teams = [] } = useTeamsWithRealtime()

  // Mutations
  const endSeasonMutation = useMutation({
    mutationFn: api.endSeason,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })

  const copyTeamsMutation = useMutation({
    mutationFn: ({ fromSeason, toSeason }: { fromSeason: number; toSeason: number }) =>
      api.copyTeamsToSeason(fromSeason, toSeason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })

  // Get unique seasons
  const allSeasons = Array.from(new Set(teams.map(team => team.season))).sort((a, b) => b - a)
  const activeSeasons = allSeasons.filter(season => 
    teams.some(team => team.season === season && team.is_active === 1)
  )

  // If not admin, show read-only message
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Season Management</h2>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Lock className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Admin Access Required
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                Season management features are only available to administrators. 
                You can view season information in the Season Overview below.
              </p>
            </div>
          </CardContent>
        </Card>

        <SeasonOverview teams={teams} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Season Management</h2>
        <p className="text-gray-600 dark:text-gray-400">Manage seasons, end current seasons, and start new ones</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <EndSeasonCard 
          activeSeasons={activeSeasons}
          onEndSeason={(season) => endSeasonMutation.mutate(season)}
          isLoading={endSeasonMutation.isPending}
        />
        
        <StartNewSeasonCard 
          allSeasons={allSeasons}
          onCopyTeams={(fromSeason, toSeason) => copyTeamsMutation.mutate({ fromSeason, toSeason })}
          isLoading={copyTeamsMutation.isPending}
        />
      </div>

      <SeasonOverview teams={teams} />
    </div>
  )
}

function EndSeasonCard({ 
  activeSeasons, 
  onEndSeason, 
  isLoading 
}: { 
  activeSeasons: number[]
  onEndSeason: (season: number) => void
  isLoading: boolean
}) {
  const [selectedSeason, setSelectedSeason] = useState<number>(activeSeasons[0] || 1)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onEndSeason(selectedSeason)
  }

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5 text-red-600" />
          End Current Season
        </CardTitle>
        <CardDescription>
          Mark all teams from a season as inactive. This should be done when transitioning to a new season.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="end-season" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Select Season to End</Label>
            <select
              id="end-season"
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(Number(e.target.value))}
              className="input-modern w-full"
            >
              {activeSeasons.map(season => (
                <option key={season} value={season}>Season {season}</option>
              ))}
            </select>
          </div>
          
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-300">
                <p className="font-medium">Warning:</p>
                <p>This will mark all teams from Season {selectedSeason} as inactive. Teams that will continue in the new season can be copied over using the "Start New Season" section.</p>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            variant="destructive" 
            className="w-full"
            disabled={isLoading || activeSeasons.length === 0}
          >
            {isLoading ? 'Ending Season...' : 'End Selected Season'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function StartNewSeasonCard({ 
  allSeasons, 
  onCopyTeams, 
  isLoading 
}: { 
  allSeasons: number[]
  onCopyTeams: (fromSeason: number, toSeason: number) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    fromSeason: allSeasons[0] || 1,
    toSeason: Math.max(...allSeasons, 0) + 1,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCopyTeams(formData.fromSeason, formData.toSeason)
  }

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Copy className="h-5 w-5 text-red-600" />
          Start New Season
        </CardTitle>
        <CardDescription>
          Copy teams from a previous season to create a new season with reset records.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="copy-from" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Copy Teams From Season</Label>
            <select
              id="copy-from"
              value={formData.fromSeason}
              onChange={(e) => setFormData({ ...formData, fromSeason: Number(e.target.value) })}
              className="input-modern w-full"
            >
              {allSeasons.map(season => (
                <option key={season} value={season}>Season {season}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="new-season" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">New Season Number</Label>
            <Input
              id="new-season"
              type="number"
              min="1"
              value={formData.toSeason}
              onChange={(e) => setFormData({ ...formData, toSeason: Number(e.target.value) })}
              className="input-modern"
              required
            />
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl">
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium">What this does:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Creates new teams with the same names and leagues</li>
                <li>Resets all records to 0 wins, 0 losses, 0 ties</li>
                <li>Sets teams as active for the new season</li>
                <li>Players will need to be re-added to teams</li>
              </ul>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full btn-primary"
            disabled={isLoading || allSeasons.length === 0}
          >
            {isLoading ? 'Creating New Season...' : 'Copy Teams to New Season'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function SeasonOverview({ teams }: { teams: Team[] }) {
  // Group teams by season
  const seasonGroups: { [season: number]: Team[] } = {}
  teams.forEach(team => {
    if (!seasonGroups[team.season]) {
      seasonGroups[team.season] = []
    }
    seasonGroups[team.season].push(team)
  })

  const sortedSeasons = Object.keys(seasonGroups)
    .map(Number)
    .sort((a, b) => b - a)

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-red-600" />
          Season Overview
        </CardTitle>
        <CardDescription>
          Overview of all seasons and their teams
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sortedSeasons.map(season => {
            const seasonTeams = seasonGroups[season]
            const activeTeams = seasonTeams.filter(team => team.is_active === 1)
            const inactiveTeams = seasonTeams.filter(team => team.is_active === 0)

            return (
              <div key={season} className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Season {season}</h3>
                  <div className="flex gap-3 text-sm">
                    <span className="flex items-center gap-1.5 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-medium text-green-700 dark:text-green-300">{activeTeams.length} active</span>
                    </span>
                    <span className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                      <div className="w-2.5 h-2.5 bg-gray-400 rounded-full"></div>
                      <span className="font-medium text-gray-600 dark:text-gray-400">{inactiveTeams.length} inactive</span>
                    </span>
                  </div>
                </div>
                
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {seasonTeams.map(team => (
                    <div 
                      key={team.id} 
                      className={`relative p-4 rounded-xl text-sm transition-all duration-200 hover:shadow-md ${
                        team.is_active === 1 
                          ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700' 
                          : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/30 dark:to-gray-800/30 border-2 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className="font-bold text-gray-900 dark:text-white mb-1">{team.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {team.league}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded font-bold">
                          {team.wins}W
                        </span>
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded font-bold">
                          {team.losses}L
                        </span>
                        <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 rounded font-bold">
                          {team.ties}T
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
