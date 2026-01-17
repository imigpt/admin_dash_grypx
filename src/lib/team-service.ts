import { api } from './api';

// Types
export interface Team {
  id: number;
  name: string;
  teamName?: string;
  sportId: number;
  sportName?: string;
  logoUrl?: string;
  foundedYear?: number;
  homeGround?: string;
  captain?: string;
  coach?: string;
  description?: string;
  createdAt?: string;
}

export interface CreateTeamRequest {
  name: string;
  sportId: number;
  logoUrl?: string;
  foundedYear?: number;
  homeGround?: string;
  captain?: string;
  coach?: string;
}

// Team Service
export const teamService = {
  // Get all teams
  async getAll(): Promise<Team[]> {
    return api.get<Team[]>('/api/teams');
  },

  // Get team by ID
  async getById(id: number): Promise<Team> {
    return api.get<Team>(`/api/teams/${id}`);
  },

  // Create team
  async create(data: CreateTeamRequest): Promise<Team> {
    return api.post<Team>('/api/teams', data);
  },

  // Update team
  async update(id: number, data: Partial<CreateTeamRequest>): Promise<Team> {
    return api.put<Team>(`/api/teams/${id}`, data);
  },

  // Delete team
  async delete(id: number): Promise<void> {
    return api.delete(`/api/teams/${id}`);
  },

  // Get team stats
  async getStats(teamId: number, sportId?: number): Promise<any> {
    const endpoint = sportId 
      ? `/api/stats/team/${teamId}/sport/${sportId}`
      : `/api/stats/team/${teamId}`;
    return api.get(endpoint);
  }
};
