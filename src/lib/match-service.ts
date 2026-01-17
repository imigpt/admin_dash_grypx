import { api } from './api';

// Types
export interface Match {
  matchId: number;
  id?: number;
  sportId: number;
  sportName?: string;
  matchFormat: string;
  matchType: 'TOURNAMENT' | 'PRACTICE' | 'FRIENDLY';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  team1Id: number;
  team2Id: number;
  team1Name?: string;
  team2Name?: string;
  scoreTeam1?: number;
  scoreTeam2?: number;
  team1Score?: number;
  team2Score?: number;
  winnerId?: number;
  winnerTag?: 'TEAM_A' | 'TEAM_B';
  finalScoreA?: number;
  finalScoreB?: number;
  startTime?: string;
  endTime?: string;
  venue?: string;
  tournamentId?: number;
  isAbandoned?: boolean;
  createdByUserId: number;
}

export interface StartMatchRequest {
  sportId: number;
  matchFormat: string;
  matchType: 'TOURNAMENT' | 'PRACTICE' | 'FRIENDLY';
  createdByUserId: number;
  team1Id: number;
  team2Id: number;
  membersTeam1?: Array<{ id: number }>;
  membersTeam2?: Array<{ id: number }>;
  tournamentId?: number;
  venue?: string;
}

export interface AddPointRequest {
  playerId?: number;
  teamId: number;
  points?: number;
  eventType?: string;
}

export interface LiveScore {
  matchId: number;
  scoreTeam1: number;
  scoreTeam2: number;
  status: string;
  lastUpdate: string;
}

export interface Sport {
  id: number;
  name: string;
  category: string;
  maxPlayers: number;
}

// Match Service
export const matchService = {
  // Get all matches
  async getAll(): Promise<Match[]> {
    return api.get<Match[]>('/api/match');
  },

  // Get match by ID
  async getById(id: number): Promise<Match> {
    return api.get<Match>(`/api/match/${id}`);
  },

  // Start a new match
  async start(data: StartMatchRequest): Promise<Match> {
    return api.post<Match>('/api/match/start', data);
  },

  // Complete match
  async complete(matchId: number): Promise<any> {
    return api.post(`/api/match-scoring/match/${matchId}/complete`);
  },

  // Abandon match
  async abandon(matchId: number, reason?: string): Promise<any> {
    return api.post(`/api/match/${matchId}/abandon`, { reason });
  },

  // Add point to match
  async addPoint(matchId: number, data: AddPointRequest): Promise<any> {
    return api.post(`/api/match-scoring/match/${matchId}/point`, data);
  },

  // Get live score
  async getLiveScore(matchId: number): Promise<LiveScore> {
    return api.get<LiveScore>(`/api/match-scoring/match/${matchId}/live-score`);
  },

  // Get match stats
  async getStats(matchId: number): Promise<any> {
    return api.get(`/api/stats/match/${matchId}`);
  },

  // Get matches by status
  async getByStatus(status: string): Promise<Match[]> {
    const matches = await this.getAll();
    return matches.filter(m => m.status === status);
  },

  // Get live matches
  async getLiveMatches(): Promise<Match[]> {
    return this.getByStatus('IN_PROGRESS');
  }
};

// Sport Service
export const sportService = {
  // Get all sports
  async getAll(): Promise<Sport[]> {
    return api.get<Sport[]>('/api/sports');
  },

  // Get sport by ID
  async getById(id: number): Promise<Sport> {
    return api.get<Sport>(`/api/sports/${id}`);
  }
};