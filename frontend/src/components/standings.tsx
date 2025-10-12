'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Team } from '@/lib/api'
import { Trophy, Medal, Award } from 'lucide-react'
import { calculateWinPercentage, formatWinPercentage } from '@/lib/utils'
import { useTeamsWithRealtime } from '@/hooks'

export function Standings() {
  const { data: teams = [], isLoading } = useTeamsWithRealtime()
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)

  if (isLoading) {
    return <div>Loading standings...</div>
  }

  // Get unique seasons
  const seasons = Array.from(new Set(teams.map(team => team.season))).sort((a, b) => b - a)
  
  // Set initial season if not set
  if (selectedSeason === null && seasons.length > 0) {
    setSelectedSeason(seasons[0])
  }

  // Filter teams by selected season (don't filter by is_active since ended seasons are marked inactive)
  const filteredTeams = selectedSeason 
    ? teams.filter(team => team.season === selectedSeason)
    : teams

  // Group teams by league
  const teamGroups: { [key: string]: Team[] } = {}
  filteredTeams.forEach(team => {
    const key = team.league
    if (!teamGroups[key]) {
      teamGroups[key] = []
    }
    teamGroups[key].push(team)
  })

  // Sort groups by league name
  const sortedGroups = Object.entries(teamGroups).sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="space-y-8">
      {/* Header with Season Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Standings</h2>
          <p className="text-gray-600 dark:text-gray-400">Current league standings and rankings</p>
        </div>
        <div className="flex items-center space-x-3">
          <Label htmlFor="season-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">Season:</Label>
          <select
            id="season-select"
            value={selectedSeason || ''}
            onChange={(e) => setSelectedSeason(Number(e.target.value))}
            className="input-modern w-40"
          >
            {seasons.map(season => (
              <option key={season} value={season}>Season {season}</option>
            ))}
          </select>
        </div>
      </div>
      
      {sortedGroups.length === 0 ? (
        <div className="card-modern p-12 text-center">
          <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Active Teams</h3>
          <p className="text-gray-600 dark:text-gray-400">Create some teams to see standings.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedGroups.map(([league, leagueTeams]) => {
            const sortedTeams = sortTeamsByRecord(leagueTeams)
            
            return (
              <div key={league} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/30">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{league}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Season {selectedSeason}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {sortedTeams.map((team, index) => {
                    const gamesPlayed = team.wins + team.losses + team.ties
                    const winPercentage = calculateWinPercentage(team.wins, team.losses, team.ties)
                    const rank = getRank(sortedTeams, index)
                    
                    return (
                      <div 
                        key={team.id} 
                        className={`relative card-bubbly p-5 border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${
                          index === 0 
                            ? 'border-yellow-400/60 dark:border-yellow-500/60 bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-900/20 dark:to-gray-800 shadow-lg shadow-yellow-500/20' 
                            : index === 1
                            ? 'border-gray-300/60 dark:border-gray-500/60 bg-gradient-to-br from-gray-50 to-white dark:from-gray-700/20 dark:to-gray-800'
                            : index === 2
                            ? 'border-amber-300/60 dark:border-amber-600/60 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-800'
                            : 'border-gray-200/50 dark:border-gray-600/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80'
                        }`}
                      >
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-400/10 to-transparent rounded-bl-full"></div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
                          <div className="flex items-center gap-3 sm:gap-4 flex-1">
                            {/* Rank */}
                            <div className="flex items-center gap-2 min-w-[50px] sm:min-w-[60px]">
                              {index === 0 && <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />}
                              {index === 1 && <Medal className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />}
                              {index === 2 && <Award className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />}
                              <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{rank}</span>
                            </div>
                            
                            {/* Team Name */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">{team.name}</h4>
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{gamesPlayed} games played</p>
                            </div>
                          </div>
                          
                          {/* Stats */}
                          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
                            <div className="text-center px-2 sm:px-3 py-1.5 sm:py-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                              <div className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-300">{team.wins}</div>
                              <div className="text-xs font-medium text-green-600 dark:text-green-400">W</div>
                            </div>
                            <div className="text-center px-2 sm:px-3 py-1.5 sm:py-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                              <div className="text-xl sm:text-2xl font-bold text-red-700 dark:text-red-300">{team.losses}</div>
                              <div className="text-xs font-medium text-red-600 dark:text-red-400">L</div>
                            </div>
                            <div className="text-center px-2 sm:px-3 py-1.5 sm:py-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                              <div className="text-xl sm:text-2xl font-bold text-yellow-700 dark:text-yellow-300">{team.ties}</div>
                              <div className="text-xs font-medium text-yellow-600 dark:text-yellow-400">T</div>
                            </div>
                            <div className="text-center px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg border-2 border-blue-300 dark:border-blue-700">
                              <div className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300 font-mono">{formatWinPercentage(winPercentage)}</div>
                              <div className="text-xs font-medium text-blue-600 dark:text-blue-400">PCT</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
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
