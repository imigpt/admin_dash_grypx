import { api } from './api';

// Dashboard Types
export interface DashboardStats {
  liveMatches: number;
  upcomingMatches: number;
  totalPlayers: number;
  activeTournaments: number;
  totalMatches?: number;
  completedMatches?: number;
}

export interface MatchSummary {
  matchId: number;
  sportType: string;
  teamAName: string;
  teamBName: string;
  scoreA?: number;
  scoreB?: number;
  status: 'LIVE' | 'UPCOMING' | 'COMPLETED' | 'SCHEDULED';
  startTime?: string;
  venueName?: string;
  tournamentId?: number;
  tournamentName?: string;
  timerState?: {
    elapsedTimeInSeconds: number;
    currentHalf: string;
    lastUpdatedAt: string;
    remainingSeconds: number;
    running: boolean;
    totalHalves: number;
  };
  
  // Legacy fields for compatibility
  id?: number;
  sportId?: number;
  sportName?: string;
  matchFormat?: string;
  matchType?: string;
  team1Id?: number;
  team2Id?: number;
  team1Name?: string;
  team2Name?: string;
  team1Score?: number;
  team2Score?: number;
  scoreTeam1?: number;
  scoreTeam2?: number;
  winnerId?: number;
  endTime?: string;
}

// Dashboard Service
export const dashboardService = {
  // Get dashboard statistics
  async getStats(): Promise<DashboardStats> {
    try {
      // Try to use the dedicated dashboard stats endpoint first
      try {
        const stats = await api.get<any>('/api/dashboard/stats');
        return {
          liveMatches: stats.liveMatches || 0,
          upcomingMatches: stats.upcomingMatches || 0,
          totalPlayers: stats.totalPlayers || 0,
          activeTournaments: stats.activeTournaments || 0,
          totalMatches: stats.totalMatches || 0,
          completedMatches: stats.completedMatches || 0,
        };
      } catch (e) {
        console.log('Dashboard stats endpoint not available, falling back to individual calls');
      }

      // Fallback: Use individual endpoints
      const [matches, tournaments] = await Promise.all([
        api.get<any[]>('/api/match'),
        api.get<any[]>('/api/tournament')
      ]);

      // Count matches by status
      const liveMatches = matches.filter(m => m.status === 'LIVE').length;
      const upcomingMatches = matches.filter(m => m.status === 'scheduled' || m.status === 'UPCOMING').length;
      const completedMatches = matches.filter(m => m.status === 'COMPLETED').length;
      const totalMatches = matches.length;
      const activeTournaments = tournaments.filter(t => t.status === 'ACTIVE' || t.status === 'IN_PROGRESS').length;

      // Try to get users count, fallback to 0 if endpoint doesn't exist
      let totalPlayers = 0;
      try {
        const users = await api.get<any[]>('/api/users');
        totalPlayers = users.length;
      } catch (e) {
        console.log('Users endpoint not available');
      }

      return {
        liveMatches,
        upcomingMatches,
        totalPlayers,
        activeTournaments,
        totalMatches,
        completedMatches,
      };
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Return default values on error
      return {
        liveMatches: 0,
        upcomingMatches: 0,
        totalPlayers: 0,
        activeTournaments: 0,
        totalMatches: 0,
        completedMatches: 0,
      };
    }
  },

  // Get all live matches
  async getLiveMatches(): Promise<MatchSummary[]> {
    try {
      const matches = await api.get<any[]>('/api/match');
      return matches.filter(m => m.status === 'LIVE');
    } catch (error) {
      console.error('Failed to fetch live matches:', error);
      return [];
    }
  },

  // Get all upcoming matches
  async getUpcomingMatches(): Promise<MatchSummary[]> {
    try {
      const matches = await api.get<any[]>('/api/match');
      return matches.filter(m => m.status === 'scheduled' || m.status === 'UPCOMING');
    } catch (error) {
      console.error('Failed to fetch upcoming matches:', error);
      return [];
    }
  },

  // Get all completed matches
  async getCompletedMatches(): Promise<MatchSummary[]> {
    try {
      const matches = await api.get<any[]>('/api/match');
      return matches.filter(m => m.status === 'COMPLETED');
    } catch (error) {
      console.error('Failed to fetch completed matches:', error);
      return [];
    }
  },

  // Get dashboard matches (all active)
  async getDashboardMatches(): Promise<MatchSummary[]> {
    try {
      return api.get<MatchSummary[]>('/api/match');
    } catch (error) {
      console.error('Failed to fetch dashboard matches:', error);
      return [];
    }
  },

  // Get matches by sport
  async getMatchesBySport(sportType: string): Promise<MatchSummary[]> {
    return api.get<MatchSummary[]>(`/api/matches/sport/${sportType}`);
  }
};
