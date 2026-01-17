import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamService, type Team, type CreateTeamRequest } from '@/lib/team-service';
import { tournamentService, type Tournament, type CreateTournamentRequest } from '@/lib/tournament-service';
import { userService, playerService, type User, type Player, type CreateUserRequest, type CreatePlayerRequest } from '@/lib/user-service';
import { matchService, sportService, type Match, type StartMatchRequest, type Sport } from '@/lib/match-service';
import { dashboardService, type DashboardStats, type MatchSummary } from '@/lib/dashboard-service';

// Dashboard Hooks
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useLiveMatches = () => {
  return useQuery({
    queryKey: ['matches', 'live'],
    queryFn: () => dashboardService.getLiveMatches(),
    refetchInterval: 5000, // Refetch every 5 seconds for live updates
  });
};

export const useUpcomingMatches = () => {
  return useQuery({
    queryKey: ['matches', 'upcoming'],
    queryFn: () => dashboardService.getUpcomingMatches(),
  });
};

export const useCompletedMatches = () => {
  return useQuery({
    queryKey: ['matches', 'completed'],
    queryFn: () => dashboardService.getCompletedMatches(),
  });
};

export const useDashboardMatches = () => {
  return useQuery({
    queryKey: ['matches', 'dashboard'],
    queryFn: () => dashboardService.getDashboardMatches(),
    refetchInterval: 10000, // Refetch every 10 seconds
  });
};

// Sport Hooks
export const useSports = () => {
  return useQuery({
    queryKey: ['sports'],
    queryFn: () => sportService.getAll(),
  });
};

export const useSport = (id: number) => {
  return useQuery({
    queryKey: ['sport', id],
    queryFn: () => sportService.getById(id),
    enabled: !!id,
  });
};

// Match Hooks
export const useMatches = () => {
  return useQuery({
    queryKey: ['matches'],
    queryFn: () => matchService.getAll(),
  });
};

export const useMatch = (id: number) => {
  return useQuery({
    queryKey: ['match', id],
    queryFn: () => matchService.getById(id),
    enabled: !!id,
  });
};

export const useStartMatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StartMatchRequest) => matchService.start(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
};

export const useCompleteMatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (matchId: number) => matchService.complete(matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
};

export const useAbandonMatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ matchId, reason }: { matchId: number; reason?: string }) => 
      matchService.abandon(matchId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
};

// Team Hooks
export const useTeams = () => {
  return useQuery({
    queryKey: ['teams'],
    queryFn: () => teamService.getAll(),
  });
};

export const useTeam = (id: number) => {
  return useQuery({
    queryKey: ['team', id],
    queryFn: () => teamService.getById(id),
    enabled: !!id,
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTeamRequest) => teamService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

export const useUpdateTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateTeamRequest> }) => 
      teamService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => teamService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

// Tournament Hooks
export const useTournaments = () => {
  return useQuery({
    queryKey: ['tournaments'],
    queryFn: () => tournamentService.getAll(),
  });
};

export const useTournament = (id: number) => {
  return useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentService.getById(id),
    enabled: !!id,
  });
};

export const useCreateTournament = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTournamentRequest) => tournamentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });
};

export const useUpdateTournament = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateTournamentRequest> }) => 
      tournamentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });
};

export const useDeleteTournament = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tournamentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });
};

export const useTournamentStandings = (id: number) => {
  return useQuery({
    queryKey: ['tournament-standings', id],
    queryFn: () => tournamentService.getStandings(id),
    enabled: !!id,
  });
};

// User Hooks
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAll(),
  });
};

export const useUser = (id: number) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getById(id),
    enabled: !!id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserRequest) => userService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateUserRequest> }) => 
      userService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => userService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// Player Hooks
export const usePlayers = () => {
  return useQuery({
    queryKey: ['players'],
    queryFn: () => playerService.getAll(),
  });
};

export const usePlayer = (id: number) => {
  return useQuery({
    queryKey: ['player', id],
    queryFn: () => playerService.getById(id),
    enabled: !!id,
  });
};

export const useCreatePlayer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePlayerRequest) => playerService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });
};

export const useUpdatePlayer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreatePlayerRequest> }) => 
      playerService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });
};

export const useDeletePlayer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => playerService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });
};

// Match Hooks  
export const useMatchStats = (matchId: number) => {
  return useQuery({
    queryKey: ['match-stats', matchId],
    queryFn: () => matchService.getStats(matchId),
    enabled: !!matchId,
  });
};
