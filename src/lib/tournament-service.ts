import { api } from './api';

// Types
export interface Tournament {
  id: number;
  name: string;
  sportId: number;
  sportName?: string;
  tournamentType: 'LEAGUE' | 'KNOCKOUT' | 'ROUND_ROBIN';
  startDate: string;
  endDate: string;
  location?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'SCHEDULED';
  description?: string;
  maxTeams?: number;
  currentTeams?: number;
  prizeMoney?: number;
  createdByUserId?: number;
  createdByUserName?: string;
  createdByUserPhone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTournamentRequest {
  name: string;
  sportId: number;
  tournamentType: 'LEAGUE' | 'KNOCKOUT' | 'ROUND_ROBIN';
  startDate: string;
  endDate: string;
  location?: string;
  description?: string;
  maxTeams?: number;
  prizeMoney?: number;
}

export interface TournamentStanding {
  rank: number;
  teamId: number;
  teamName: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference?: number;
  points: number;
}

// Tournament Service
export const tournamentService = {
  // Get all tournaments
  async getAll(): Promise<Tournament[]> {
    return api.get<Tournament[]>('/api/tournament');
  },

  // Get tournament by ID
  async getById(id: number): Promise<Tournament> {
    return api.get<Tournament>(`/api/tournament/${id}`);
  },

  // Create tournament
  async create(data: CreateTournamentRequest): Promise<Tournament> {
    return api.post<Tournament>('/api/tournament', data);
  },

  // Update tournament
  async update(id: number, data: Partial<CreateTournamentRequest>): Promise<Tournament> {
    return api.put<Tournament>(`/api/tournament/${id}`, data);
  },

  // Delete tournament
  async delete(id: number): Promise<void> {
    return api.delete(`/api/tournament/${id}`);
  },

  // Get tournament standings
  async getStandings(id: number): Promise<{ tournamentId: number; tournamentName: string; standings: TournamentStanding[] }> {
    return api.get(`/api/tournament/${id}/standings`);
  },

  // Add match to tournament
  async addMatch(tournamentId: number, matchData: any): Promise<any> {
    return api.post(`/api/tournament/${tournamentId}/matches`, matchData);
  },

  // Get tournament stats
  async getStats(id: number): Promise<any> {
    return api.get(`/api/stats/tournament/${id}`);
  }
};
