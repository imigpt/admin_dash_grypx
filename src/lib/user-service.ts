import { api } from './api';

// Types
export interface User {
  id: number;
  name: string;
  phoneNumber: string;
  email?: string;
  role: 'ADMIN' | 'PLAYER' | 'ORGANIZER' | 'VIEWER';
  createdAt?: string;
  isActive?: boolean;
}

export interface CreateUserRequest {
  name: string;
  phoneNumber: string;
  email?: string;
  role: 'ADMIN' | 'PLAYER' | 'ORGANIZER' | 'VIEWER';
}

export interface Player {
  id: number;
  name: string;
  position?: string;
  jerseyNumber?: number;
  teamId?: number;
  teamName?: string;
  photoUrl?: string;
  dateOfBirth?: string;
  height?: number;
  weight?: number;
  nationality?: string;
}

export interface CreatePlayerRequest {
  name: string;
  position?: string;
  jerseyNumber?: number;
  teamId?: number;
  photoUrl?: string;
  dateOfBirth?: string;
  height?: number;
  weight?: number;
  nationality?: string;
}

// User Service
export const userService = {
  // Get all users
  async getAll(): Promise<User[]> {
    return api.get<User[]>('/api/users');
  },

  // Get user by ID
  async getById(id: number): Promise<User> {
    return api.get<User>(`/api/users/${id}`);
  },

  // Create user
  async create(data: CreateUserRequest): Promise<User> {
    return api.post<User>('/api/users', data);
  },

  // Update user
  async update(id: number, data: Partial<CreateUserRequest>): Promise<User> {
    return api.put<User>(`/api/users/${id}`, data);
  },

  // Delete user
  async delete(id: number): Promise<void> {
    return api.delete(`/api/users/${id}`);
  },

  // Update user role
  async updateRole(userId: number, role: string): Promise<User> {
    return api.put<User>(`/api/users/${userId}/role`, { role });
  }
};

// Player Service
export const playerService = {
  // Get all players
  async getAll(): Promise<Player[]> {
    return api.get<Player[]>('/api/players');
  },

  // Get player by ID
  async getById(id: number): Promise<Player> {
    return api.get<Player>(`/api/players/${id}`);
  },

  // Create player
  async create(data: CreatePlayerRequest): Promise<Player> {
    return api.post<Player>('/api/players', data);
  },

  // Update player
  async update(id: number, data: Partial<CreatePlayerRequest>): Promise<Player> {
    return api.put<Player>(`/api/players/${id}`, data);
  },

  // Delete player
  async delete(id: number): Promise<void> {
    return api.delete(`/api/players/${id}`);
  },

  // Get player stats
  async getStats(playerId: number, sportId?: number): Promise<any> {
    const endpoint = sportId 
      ? `/api/stats/player/${playerId}/sport/${sportId}`
      : `/api/stats/player/${playerId}`;
    return api.get(endpoint);
  }
};
