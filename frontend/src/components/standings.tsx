'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api, Team } from '@/lib/api'
import { Trophy, Medal, Award } from 'lucide-react'
import { calculateWinPercentage, formatWinPercentage } from '@/lib/utils'

export function Standings() {
  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: api.getTeams,
  })

  if (isLoading) {
    return <div>Loading standings...</div>
  }

  // Group teams by league and season
  const teamGroups: { [key: string]: Team[] } = {}
  teams.forEach(team => {
    if (team.is_active === 1) {
      const key = `${team.league}-${team.season}`
      if (!teamGroups[key]) {
        teamGroups[key] = []
      }
      teamGroups[key].push(team)
    }
  })

  // Sort groups by season (descending) then league
  const sortedGroups = Object.entries(teamGroups).sort(([a], [b]) => {
    const [leagueA, seasonA] = a.split('-')
    const [leagueB, seasonB] = b.split('-')
    const seasonNumA = parseInt(seasonA)
    const seasonNumB = parseInt(seasonB)
    
    if (seasonNumA !== seasonNumB) {
      return seasonNumB - seasonNumA
    }
    return leagueA.localeCompare(leagueB)
  })

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Standings</h2>
      
      {sortedGroups.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              No active teams found. Create some teams to see standings.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedGroups.map(([key, leagueTeams]) => {
            const [league, season] = key.split('-')
            const sortedTeams = sortTeamsByRecord(leagueTeams)
            
            return (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-6 w-6" />
                    {league} - Season {season}
                  </CardTitle>
                  <CardDescription>
                    Current standings for {league} league
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 font-semibold">Rank</th>
                          <th className="text-left p-2 font-semibold">Team</th>
                          <th className="text-center p-2 font-semibold">W</th>
                          <th className="text-center p-2 font-semibold">L</th>
                          <th className="text-center p-2 font-semibold">T</th>
                          <th className="text-center p-2 font-semibold">PCT</th>
                          <th className="text-center p-2 font-semibold">GP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedTeams.map((team, index) => {
                          const gamesPlayed = team.wins + team.losses + team.ties
                          const winPercentage = calculateWinPercentage(team.wins, team.losses, team.ties)
                          const rank = getRank(sortedTeams, index)
                          
                          return (
                            <tr key={team.id} className="border-b hover:bg-muted/50">
                              <td className="p-2">
                                <div className="flex items-center gap-2">
                                  {index < 3 && (
                                    <div className="flex items-center">
                                      {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                                      {index === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                                      {index === 2 && <Award className="h-4 w-4 text-amber-600" />}
                                    </div>
                                  )}
                                  <span className="font-medium">{rank}</span>
                                </div>
                              </td>
                              <td className="p-2 font-medium">{team.name}</td>
                              <td className="p-2 text-center text-green-600 font-semibold">{team.wins}</td>
                              <td className="p-2 text-center text-red-600 font-semibold">{team.losses}</td>
                              <td className="p-2 text-center text-yellow-600 font-semibold">{team.ties}</td>
                              <td className="p-2 text-center font-mono">{formatWinPercentage(winPercentage)}</td>
                              <td className="p-2 text-center">{gamesPlayed}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function sortTeamsByRecord(teams: Team[]): Team[] {
  return teams.sort((a, b) => {
    const aWinPct = calculateWinPercentage(a.wins, a.losses, a.ties)
    const bWinPct = calculateWinPercentage(b.wins, b.losses, b.ties)
    
    // First sort by win percentage
    if (aWinPct !== bWinPct) {
      return bWinPct - aWinPct
    }
    
    // Then by wins
    if (a.wins !== b.wins) {
      return b.wins - a.wins
    }
    
    // Then by losses (fewer losses is better)
    if (a.losses !== b.losses) {
      return a.losses - b.losses
    }
    
    // Finally by ties (more ties is better)
    return b.ties - a.ties
  })
}

function getRank(teams: Team[], index: number): string {
  if (index === 0) return '1st'
  
  const currentTeam = teams[index]
  const previousTeam = teams[index - 1]
  
  const currentWinPct = calculateWinPercentage(currentTeam.wins, currentTeam.losses, currentTeam.ties)
  const previousWinPct = calculateWinPercentage(previousTeam.wins, previousTeam.losses, previousTeam.ties)
  
  // Check if tied with previous team
  if (currentWinPct === previousWinPct && 
      currentTeam.wins === previousTeam.wins && 
      currentTeam.losses === previousTeam.losses) {
    return 'T-' + (index)
  }
  
  const suffixes = ['th', 'st', 'nd', 'rd']
  const v = (index + 1) % 100
  return (index + 1) + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0])
}
