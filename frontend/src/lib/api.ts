// Same-origin: next.config rewrites /api/* to the Go API, so the httpOnly admin/device cookies are first-party.
const API_BASE_URL = '/api';

function getHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json' };
}

async function json<T>(res: Response, what: string): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Failed to ${what}`);
  }
  return res.json();
}

export interface PersonExtra {
  id: number;
  name: string;
  nickname?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
}

export interface GameSocial {
  reactions: Record<string, number>;
  mine: string[];
  mvp: { person_id: number; votes: number }[];
  my_vote: number | null;
}

export interface Team {
  id: number;
  name: string;
  season: number;
  league: string;
  wins: number;
  losses: number;
  ties: number;
  is_active: number;
  display_name: string;
  record_manual?: boolean;
  version: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Player {
  id: number;
  name: string;
  team_id: number;
  team_name?: string;
  season: number;
  is_active: boolean;
  jersey_number?: string;
  canonical_player_id?: number;
  display_name?: string;
  version: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Game {
  id: number;
  week: number;
  league: string;
  season: number;
  game_type: 'regular' | 'playoff' | 'championship';
  team1_id: number;
  team1_name: string;
  team1_score: number;
  team2_id: number;
  team2_name: string;
  team2_score: number;
  winning_team_id?: number;
  winning_team_name?: string;
  version: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface PlayerStats {
  id: number;
  player_id: number;
  player_name: string;
  game_id: number;
  game_week: number;
  game_season: number;
  league: string;
  team1_name: string;
  team2_name: string;
  passing_tds: number;
  passes_completed: number;
  passes_attempted: number;
  interceptions_thrown: number;
  receptions: number;
  targets: number;
  receiving_tds: number;
  drops: number;
  first_downs: number;
  rushing_tds: number;
  rush_attempts: number;
  flag_pulls: number;
  interceptions: number;
  pass_breakups: number;
  def_td: number;
  sacks: number;
  safeties: number;
  version: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// API Functions
export const api = {
  // Admin session (key -> httpOnly cookie)
  async adminSession(): Promise<{ admin: boolean }> {
    return json(await fetch(`${API_BASE_URL}/admin/session`, { cache: 'no-store' }), 'check admin');
  },
  async adminLogin(key: string): Promise<{ admin: boolean }> {
    return json(await fetch(`${API_BASE_URL}/admin/session`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ key }) }), 'sign in');
  },
  async adminLogout(): Promise<{ admin: boolean }> {
    return json(await fetch(`${API_BASE_URL}/admin/session`, { method: 'DELETE' }), 'sign out');
  },

  // People (one per human) + game social
  async getPeople(): Promise<PersonExtra[]> {
    return json(await fetch(`${API_BASE_URL}/people`), 'fetch people');
  },
  async updatePerson(id: number, body: { nickname?: string; bio?: string; avatar_url?: string }) {
    return json(await fetch(`${API_BASE_URL}/people/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }), 'update person');
  },
  async uploadAvatar(id: number, file: File): Promise<{ avatar_url: string }> {
    const body = new FormData();
    body.append('file', file);
    return json(await fetch(`${API_BASE_URL}/people/${id}/avatar`, { method: 'POST', body }), 'upload photo');
  },
  async deleteAvatar(id: number): Promise<{ removed: boolean }> {
    return json(await fetch(`${API_BASE_URL}/people/${id}/avatar`, { method: 'DELETE' }), 'remove photo');
  },
  // Stat entry: absolute values. Create by ids (409 if the row already exists), edit with optimistic version.
  async createStatsById(body: { player_id: number; game_id: number } & Partial<Record<string, number>>) {
    return json<{ data: PlayerStats }>(await fetch(`${API_BASE_URL}/stats`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }), 'save stats');
  },
  async saveStats(id: number, version: number, body: Partial<Record<string, number>>) {
    return json<{ data: PlayerStats }>(await fetch(`${API_BASE_URL}/stats/${id}?version=${version}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }), 'save stats');
  },
  async getGameSocial(gameId: number): Promise<GameSocial> {
    return json(await fetch(`${API_BASE_URL}/games/${gameId}/social`, { cache: 'no-store' }), 'fetch reactions');
  },
  async react(gameId: number, emoji: string) {
    return json(await fetch(`${API_BASE_URL}/games/${gameId}/react`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ emoji }) }), 'react');
  },
  async voteMvp(gameId: number, personId: number, voterName?: string) {
    return json(await fetch(`${API_BASE_URL}/games/${gameId}/mvp`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ person_id: personId, voter_name: voterName || '' }) }), 'vote');
  },

  // Teams
  async getTeams(): Promise<Team[]> {
    const response = await fetch(`${API_BASE_URL}/teams`);
    if (!response.ok) throw new Error('Failed to fetch teams');
    return response.json();
  },

  async getTeam(id: number): Promise<Team> {
    const response = await fetch(`${API_BASE_URL}/teams/${id}`);
    if (!response.ok) throw new Error('Failed to fetch team');
    return response.json();
  },

  async createTeam(team: Omit<Team, 'id' | 'version' | 'is_deleted' | 'created_at' | 'updated_at' | 'deleted_at' | 'display_name'>) {
    const response = await fetch(`${API_BASE_URL}/teams`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(team),
    });
    if (!response.ok) throw new Error('Failed to create team');
    return response.json();
  },

  async updateTeam(id: number, team: Partial<Team>, version: number) {
    const response = await fetch(`${API_BASE_URL}/teams/${id}?version=${version}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(team),
    });
    if (!response.ok) throw new Error('Failed to update team');
    return response.json();
  },

  async deleteTeam(id: number, version: number) {
    const response = await fetch(`${API_BASE_URL}/teams/${id}?version=${version}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete team');
    return response.json();
  },

  // Players
  async getPlayers(): Promise<Player[]> {
    const response = await fetch(`${API_BASE_URL}/players`);
    if (!response.ok) throw new Error('Failed to fetch players');
    return response.json();
  },

  async getPlayer(id: number): Promise<Player> {
    const response = await fetch(`${API_BASE_URL}/players/${id}`);
    if (!response.ok) throw new Error('Failed to fetch player');
    return response.json();
  },

  async createPlayer(player: {
    name: string;
    team_name: string;
    season: number;
    is_active?: boolean;
    jersey_number?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/players`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(player),
    });
    if (!response.ok) throw new Error('Failed to create player');
    return response.json();
  },

  async updatePlayer(id: number, player: Partial<Player>, version: number) {
    const response = await fetch(`${API_BASE_URL}/players/${id}?version=${version}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(player),
    });
    if (!response.ok) throw new Error('Failed to update player');
    return response.json();
  },

  async deletePlayer(id: number, version: number) {
    const response = await fetch(`${API_BASE_URL}/players/${id}?version=${version}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete player');
    return response.json();
  },

  // Games
  async getGames(): Promise<Game[]> {
    const response = await fetch(`${API_BASE_URL}/games`);
    if (!response.ok) throw new Error('Failed to fetch games');
    return response.json();
  },

  async getGame(id: number): Promise<Game> {
    const response = await fetch(`${API_BASE_URL}/games/${id}`);
    if (!response.ok) throw new Error('Failed to fetch game');
    return response.json();
  },

  async createGame(game: {
    week: number;
    league: string;
    season: number;
    team1_name: string;
    team1_score?: number;
    team2_name: string;
    team2_score?: number;
    winning_team_name?: string;
    game_type?: Game['game_type'];
  }) {
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(game),
    });
    if (!response.ok) throw new Error('Failed to create game');
    return response.json();
  },

  async updateGame(id: number, game: Partial<Game>, version: number) {
    const response = await fetch(`${API_BASE_URL}/games/${id}?version=${version}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(game),
    });
    if (!response.ok) throw new Error('Failed to update game');
    return response.json();
  },

  async deleteGame(id: number, version: number) {
    const response = await fetch(`${API_BASE_URL}/games/${id}?version=${version}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete game');
    return response.json();
  },

  // Player Stats
  async getPlayerStats(params?: { season?: number; gameId?: number }): Promise<PlayerStats[]> {
    const queryParams = new URLSearchParams();
    if (params?.season) queryParams.append('season', params.season.toString());
    if (params?.gameId) queryParams.append('game_id', params.gameId.toString());
    
    const url = `${API_BASE_URL}/stats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch player stats');
    return response.json();
  },

  async getPlayerStat(id: number): Promise<PlayerStats> {
    const response = await fetch(`${API_BASE_URL}/stats/${id}`);
    if (!response.ok) throw new Error('Failed to fetch player stat');
    return response.json();
  },

  async createPlayerStats(stats: {
    player_name: string;
    game_week: number;
    game_season: number;
    league: string;
    team1_name: string;
    team2_name: string;
    passing_tds?: number;
    passes_completed?: number;
    passes_attempted?: number;
    interceptions_thrown?: number;
    receptions?: number;
    targets?: number;
    receiving_tds?: number;
    drops?: number;
    first_downs?: number;
    rushing_tds?: number;
    rush_attempts?: number;
    flag_pulls?: number;
    interceptions?: number;
    pass_breakups?: number;
    def_td?: number;
    sacks?: number;
    safeties?: number;
  }) {
    const response = await fetch(`${API_BASE_URL}/stats`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(stats),
    });
    if (!response.ok) throw new Error('Failed to create player stats');
    return response.json();
  },

  async updatePlayerStats(id: number, stats: Partial<PlayerStats>, version: number) {
    const response = await fetch(`${API_BASE_URL}/stats/${id}?version=${version}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(stats),
    });
    if (!response.ok) throw new Error('Failed to update player stats');
    return response.json();
  },

  async deletePlayerStats(id: number, version: number) {
    const response = await fetch(`${API_BASE_URL}/stats/${id}?version=${version}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete player stats');
    return response.json();
  },

  // Season Management
  async endSeason(season: number) {
    const response = await fetch(`${API_BASE_URL}/teams/end-season`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ season }),
    });
    if (!response.ok) throw new Error('Failed to end season');
    return response.json();
  },

  async copyTeamsToSeason(fromSeason: number, toSeason: number) {
    const response = await fetch(`${API_BASE_URL}/teams/copy-to-season`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ from_season: fromSeason, to_season: toSeason }),
    });
    if (!response.ok) throw new Error('Failed to copy teams to season');
    return response.json();
  },
};
