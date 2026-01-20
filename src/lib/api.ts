const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://34.131.53.32:8080'; // GCP backend server

console.log('🔧 API Configuration:', {
  'API_BASE_URL': API_BASE_URL,
  'VITE_API_BASE_URL': import.meta.env.VITE_API_BASE_URL,
  'Using': API_BASE_URL,
  'Mode': import.meta.env.MODE
});

// Helper function for API calls
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log('📡 API Request:', url);
  
  // Get auth token
  const authToken = localStorage.getItem('authToken');
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add Authorization header if token exists
  if (authToken) {
    defaultHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
}

export const api = {
  // Base URL
  baseUrl: API_BASE_URL,

  // Helper function for API calls
  request,

  // GET request
  get<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: 'GET' });
  },

  // POST request
  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // PUT request
  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // DELETE request
  delete<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: 'DELETE' });
  },
};

// API endpoints
export const endpoints = {
  // Match endpoints
  matches: {
    list: '/api/match',
    start: '/api/match/start',
    getById: (id: number) => `/api/match/${id}`,
    abandon: (id: number) => `/api/match/${id}/abandon`,
  },
  
  // Match Scoring endpoints
  matchScoring: {
    addPoint: (matchId: number) => `/api/match-scoring/match/${matchId}/point`,
    complete: (matchId: number) => `/api/match-scoring/match/${matchId}/complete`,
    liveScore: (matchId: number) => `/api/match-scoring/match/${matchId}/live-score`,
  },

  // Stats endpoints
  stats: {
    player: (playerId: number, sportId: number) => `/api/stats/player/${playerId}/sport/${sportId}`,
    playerAll: (playerId: number) => `/api/stats/player/${playerId}`,
    team: (teamId: number, sportId: number) => `/api/stats/team/${teamId}/sport/${sportId}`,
    teamAll: (teamId: number) => `/api/stats/team/${teamId}`,
    tournament: (tournamentId: number) => `/api/stats/tournament/${tournamentId}`,
    match: (matchId: number) => `/api/stats/match/${matchId}`,
  },

  // Tournament endpoints
  tournaments: {
    list: '/api/tournament',
    create: '/api/tournament',
    getById: (id: number) => `/api/tournament/${id}`,
    update: (id: number) => `/api/tournament/${id}`,
    delete: (id: number) => `/api/tournament/${id}`,
    standings: (id: number) => `/api/tournament/${id}/standings`,
    addMatch: (id: number) => `/api/tournament/${id}/matches`,
  },

  // User endpoints
  users: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    list: '/api/users',
    getById: (id: number) => `/api/users/${id}`,
  },

  // Team endpoints
  teams: {
    list: '/api/teams',
    create: '/api/teams',
    getById: (id: number) => `/api/teams/${id}`,
    update: (id: number) => `/api/teams/${id}`,
    delete: (id: number) => `/api/teams/${id}`,
  },

  // Player endpoints
  players: {
    list: '/api/players',
    create: '/api/players',
    getById: (id: number) => `/api/players/${id}`,
    update: (id: number) => `/api/players/${id}`,
    delete: (id: number) => `/api/players/${id}`,
  },

  // Sports endpoints
  sports: {
    list: '/api/sports',
    getById: (id: number) => `/api/sports/${id}`,
  },
};
