import { useQuery } from '@tanstack/react-query';
import { api, endpoints } from '@/lib/api';

// Types
interface Match {
  matchId: number;
  sportId: number;
  sportName?: string;
  matchFormat: string;
  matchType: string;
  status: string;
  createdByUserId: number;
  team1Id: number;
  team2Id: number;
  scoreTeam1?: number;
  scoreTeam2?: number;
  startTime?: string;
  endTime?: string;
  winnerId?: number;
  winnerTag?: string;
  finalScoreA?: number;
  finalScoreB?: number;
}

interface PlayerStats {
  playerId: number;
  playerName: string;
  sportId: number;
  sportName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  totalPointsScored: number;
  winPercentage: number;
}

interface TeamStats {
  teamId: number;
  teamName: string;
  sportId: number;
  sportName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  totalPointsScored: number;
  winPercentage: number;
}

// Custom Hooks

// Fetch all matches
export const useMatches = () => {
  return useQuery<Match[]>({
    queryKey: ['matches'],
    queryFn: () => api.get<Match[]>(endpoints.matches.list),
  });
};

// Fetch match by ID
export const useMatch = (matchId: number) => {
  return useQuery<Match>({
    queryKey: ['match', matchId],
    queryFn: () => api.get<Match>(endpoints.matches.getById(matchId)),
    enabled: !!matchId,
  });
};

// Fetch player stats
export const usePlayerStats = (playerId: number, sportId?: number) => {
  return useQuery<PlayerStats>({
    queryKey: ['playerStats', playerId, sportId],
    queryFn: () => 
      sportId 
        ? api.get<PlayerStats>(endpoints.stats.player(playerId, sportId))
        : api.get<PlayerStats>(endpoints.stats.playerAll(playerId)),
    enabled: !!playerId,
  });
};

// Fetch team stats
export const useTeamStats = (teamId: number, sportId?: number) => {
  return useQuery<TeamStats>({
    queryKey: ['teamStats', teamId, sportId],
    queryFn: () => 
      sportId 
        ? api.get<TeamStats>(endpoints.stats.team(teamId, sportId))
        : api.get<TeamStats>(endpoints.stats.teamAll(teamId)),
    enabled: !!teamId,
  });
};

// Fetch live score
export const useLiveScore = (matchId: number) => {
  return useQuery({
    queryKey: ['liveScore', matchId],
    queryFn: () => api.get(endpoints.matchScoring.liveScore(matchId)),
    enabled: !!matchId,
    refetchInterval: 5000, // Refetch every 5 seconds for live updates
  });
};

// Mutations

// Start a match
export const startMatch = async (matchData: {
  sportId: number;
  matchFormat: string;
  matchType: string;
  createdByUserId: number;
  team1Id: number;
  team2Id: number;
  membersTeam1?: Array<{ id: number }>;
  membersTeam2?: Array<{ id: number }>;
  tournamentId?: number;
}) => {
  return api.post<Match>(endpoints.matches.start, matchData);
};

// Complete a match
export const completeMatch = async (matchId: number) => {
  return api.post(endpoints.matchScoring.complete(matchId));
};

// Abandon a match
export const abandonMatch = async (matchId: number) => {
  return api.post(endpoints.matches.abandon(matchId));
};

// Add point to match
export const addPoint = async (matchId: number, pointData: {
  playerId?: number;
  teamId: number;
  points?: number;
  eventType?: string;
}) => {
  return api.post(endpoints.matchScoring.addPoint(matchId), pointData);
};
