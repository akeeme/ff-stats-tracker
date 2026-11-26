'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { buildPeople, byRecent, seasonsOf, withPerson } from '@/lib/derive'

const opts = { staleTime: 60_000 }

/** Everything the option-A pages need, fetched once and shared through the react-query cache. */
export function useRhinos() {
  const games = useQuery({ queryKey: ['games'], queryFn: api.getGames, ...opts })
  const stats = useQuery({ queryKey: ['stats'], queryFn: () => api.getPlayerStats(), ...opts })
  const players = useQuery({ queryKey: ['players'], queryFn: api.getPlayers, ...opts })
  const teams = useQuery({ queryKey: ['teams'], queryFn: api.getTeams, ...opts })
  // extras (nickname/avatar) are optional: the page still works if this call fails
  const extras = useQuery({ queryKey: ['people'], queryFn: api.getPeople, ...opts, retry: 1 })

  const data = useMemo(() => {
    if (!games.data || !stats.data || !players.data) return null
    const gameList = games.data.filter(g => !g.is_deleted).sort(byRecent)
    const rows = withPerson(stats.data, players.data)
    return {
      games: gameList,
      gameById: new Map(gameList.map(g => [g.id, g])),
      rows,
      gamesWithStats: new Set(rows.map(r => r.game_id)),
      people: buildPeople(players.data, extras.data ?? []),
      teams: teams.data ?? [],
      seasons: seasonsOf(gameList),
    }
  }, [games.data, stats.data, players.data, teams.data, extras.data])

  const error = games.error || stats.error || players.error
  return { data, error, isLoading: !data && !error }
}
export type Rhinos = NonNullable<ReturnType<typeof useRhinos>['data']>
