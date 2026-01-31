import { api, endpoints } from './api';

// Types
export interface LoginRequest {
  identifier: string; // username, email or phone
  password: string;
}

export interface User {
  id: number;
  name: string;
  username?: string;
  mobileNumber?: string;
  emailId?: string;
  role?: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  userId?: number;
  user?: User;
  name?: string;
  username?: string;
  phoneNumber?: string;
  email?: string;
  role?: string;
  token?: string;
  jwtToken?: string;
  message?: string;
}

// Authentication Service
export const authService = {
  // Login with username/email/phone and password
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', data);
    if (response.success && response.token) {
      this.storeAuthData(response);
    }
    return response;
  },

  // Get current user
  async getCurrentUser(): Promise<User> {
    const userId = localStorage.getItem('userId');
    if (!userId) throw new Error('Not authenticated');
    return api.get<User>(`/api/users/${userId}`);
  },

  // Logout
  logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('userId') && !!localStorage.getItem('authToken');
  },

  // Get user role
  getUserRole(): string | null {
    return localStorage.getItem('userRole');
  },

  // Get auth token
  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  },

  // Store auth data
  storeAuthData(data: AuthResponse) {
    // Backend returns userId directly (not nested in user object)
    if (data.userId) {
      localStorage.setItem('userId', data.userId.toString());
    }
    
    // Fallback to nested user object if present
    if (!data.userId && data.user?.id) {
      localStorage.setItem('userId', data.user.id.toString());
    }
    
    if (data.role) {
      localStorage.setItem('userRole', data.role);
    }
    if (data.name) {
      localStorage.setItem('userName', data.name);
    }
    if (data.username) {
      localStorage.setItem('username', data.username);
    }
    
    // Backend returns 'token' (not 'jwtToken')
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    } else if (data.jwtToken) {
      localStorage.setItem('authToken', data.jwtToken);
    }
  }
};
