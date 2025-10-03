'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, Team } from '@/lib/api'
import { Calendar, Copy, Archive, AlertTriangle } from 'lucide-react'

export function SeasonManagement() {
  const queryClient = useQueryClient()

  // Queries
  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: api.getTeams,
  })

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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Season Management</h2>
      
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5" />
          End Current Season
        </CardTitle>
        <CardDescription>
          Mark all teams from a season as inactive. This should be done when transitioning to a new season.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="end-season">Select Season to End</Label>
            <select
              id="end-season"
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
            >
              {activeSeasons.map(season => (
                <option key={season} value={season}>Season {season}</option>
              ))}
            </select>
          </div>
          
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Copy className="h-5 w-5" />
          Start New Season
        </CardTitle>
        <CardDescription>
          Copy teams from a previous season to create a new season with reset records.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="copy-from">Copy Teams From Season</Label>
            <select
              id="copy-from"
              value={formData.fromSeason}
              onChange={(e) => setFormData({ ...formData, fromSeason: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-md"
            >
              {allSeasons.map(season => (
                <option key={season} value={season}>Season {season}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="new-season">New Season Number</Label>
            <Input
              id="new-season"
              type="number"
              min="1"
              value={formData.toSeason}
              onChange={(e) => setFormData({ ...formData, toSeason: Number(e.target.value) })}
              required
            />
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm text-blue-800">
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
            className="w-full"
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Season Overview
        </CardTitle>
        <CardDescription>
          Overview of all seasons and their teams
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedSeasons.map(season => {
            const seasonTeams = seasonGroups[season]
            const activeTeams = seasonTeams.filter(team => team.is_active === 1)
            const inactiveTeams = seasonTeams.filter(team => team.is_active === 0)

            return (
              <div key={season} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">Season {season}</h3>
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      {activeTeams.length} active
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      {inactiveTeams.length} inactive
                    </span>
                  </div>
                </div>
                
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {seasonTeams.map(team => (
                    <div 
                      key={team.id} 
                      className={`p-2 rounded text-sm ${
                        team.is_active === 1 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="font-medium">{team.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {team.league} • {team.wins}-{team.losses}-{team.ties}
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
