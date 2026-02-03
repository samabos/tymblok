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
  hasPassword: boolean;
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
  email: string;
  token: string;
  newPassword: string;
}

export interface ResendVerificationRequest {
  userId: string;
}

export interface VerifyEmailRequest {
  userId: string;
  token: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface SessionDto {
  id: string;
  deviceType: string | null;
  deviceName: string | null;
  deviceOs: string | null;
  ipAddress: string | null;
  isCurrent: boolean;
  lastActiveAt: string;
  createdAt: string;
}

export interface SessionsResponse {
  sessions: SessionDto[];
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

  async resetPassword(email: string, token: string, newPassword: string): Promise<void> {
    await api.post<ApiResponse<void>>('/auth/reset-password', { email, token, newPassword } as ResetPasswordRequest, { skipAuth: true });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post<ApiResponse<void>>('/auth/change-password', { currentPassword, newPassword } as ChangePasswordRequest);
  },

  async setPassword(password: string): Promise<void> {
    await api.post<ApiResponse<void>>('/auth/set-password', { password });
  },

  async updateProfile(name: string): Promise<UserDto> {
    const response = await api.patch<ApiResponse<UserDto>>('/auth/profile', { name });
    return response.data;
  },

  async uploadAvatar(imageUri: string): Promise<{ avatarUrl: string }> {
    // Create form data for file upload
    const formData = new FormData();

    // Get the file name from the URI
    const fileName = imageUri.split('/').pop() || 'avatar.jpg';

    // Determine MIME type from extension
    const extension = fileName.split('.').pop()?.toLowerCase();
    const mimeType = extension === 'png' ? 'image/png' :
                     extension === 'gif' ? 'image/gif' :
                     extension === 'webp' ? 'image/webp' : 'image/jpeg';

    // Append the file to form data
    formData.append('file', {
      uri: imageUri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob);

    const response = await api.uploadFile<ApiResponse<{ avatarUrl: string }>>('/auth/avatar', formData);
    return response.data;
  },

  async deleteAvatar(): Promise<void> {
    await api.delete<ApiResponse<void>>('/auth/avatar');
  },

  async resendVerificationEmail(userId: string): Promise<void> {
    await api.post<ApiResponse<void>>('/auth/resend-verification', { userId } as ResendVerificationRequest);
  },

  async verifyEmail(userId: string, token: string): Promise<void> {
    await api.post<ApiResponse<void>>('/auth/verify-email', { userId, token } as VerifyEmailRequest, { skipAuth: true });
  },

  async getLinkedProviders(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>('/auth/external/providers');
    return response.data;
  },

  async hasPassword(): Promise<boolean> {
    const response = await api.get<ApiResponse<boolean>>('/auth/has-password');
    return response.data;
  },

  async unlinkProvider(provider: OAuthProvider): Promise<void> {
    await api.delete<ApiResponse<void>>(`/auth/external/link/${provider}`);
  },

  getExternalLoginUrl(provider: OAuthProvider, redirectUrl?: string): string {
    let url = `${API_URL}/api/auth/external/${provider}?mobile=true`;
    if (redirectUrl) {
      url += `&redirectUrl=${encodeURIComponent(redirectUrl)}`;
    }
    return url;
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post<ApiResponse<void>>('/auth/logout', { refreshToken }, { skipAuth: true });
  },

  async getSessions(): Promise<SessionDto[]> {
    const response = await api.get<ApiResponse<SessionsResponse>>('/auth/sessions');
    return response.data.sessions;
  },

  async revokeSession(sessionId: string): Promise<void> {
    await api.delete<ApiResponse<void>>(`/auth/sessions/${sessionId}`);
  },

  async revokeAllSessions(exceptSessionId?: string): Promise<void> {
    const url = exceptSessionId
      ? `/auth/sessions?exceptSessionId=${exceptSessionId}`
      : '/auth/sessions';
    await api.delete<ApiResponse<void>>(url);
  },
};
