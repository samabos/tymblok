import { api, ApiResponse, API_URL } from './api';

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
  linkedProviders?: string[];
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

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export type OAuthProvider = 'google' | 'github';

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

  async forgotPassword(email: string): Promise<void> {
    await api.post<ApiResponse<void>>('/auth/forgot-password', { email } as ForgotPasswordRequest, { skipAuth: true });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post<ApiResponse<void>>('/auth/reset-password', { token, newPassword } as ResetPasswordRequest, { skipAuth: true });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post<ApiResponse<void>>('/auth/change-password', { currentPassword, newPassword } as ChangePasswordRequest);
  },

  async resendVerificationEmail(): Promise<void> {
    await api.post<ApiResponse<void>>('/auth/resend-verification');
  },

  async getLinkedProviders(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>('/auth/external/providers');
    return response.data;
  },

  async hasPassword(): Promise<boolean> {
    const response = await api.get<ApiResponse<{ hasPassword: boolean }>>('/auth/has-password');
    return response.data.hasPassword;
  },

  async unlinkProvider(provider: OAuthProvider): Promise<void> {
    await api.delete<ApiResponse<void>>(`/auth/external/link/${provider}`);
  },

  getExternalLoginUrl(provider: OAuthProvider): string {
    return `${API_URL}/api/auth/external/${provider}?mobile=true`;
  },
};
