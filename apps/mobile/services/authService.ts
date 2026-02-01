import { api, ApiResponse } from './api';

export interface UserDto {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  theme: string;
  highContrast: boolean;
  reduceMotion: boolean;
  textSize: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserDto;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export const authService = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data, { skipAuth: true });
    return response.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data, { skipAuth: true });
    return response.data;
  },

  async refresh(data: RefreshRequest): Promise<RefreshResponse> {
    const response = await api.post<ApiResponse<RefreshResponse>>('/auth/refresh', data, { skipAuth: true });
    return response.data;
  },
};
