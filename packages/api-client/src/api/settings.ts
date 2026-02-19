import type { UpdateSettingsRequest, UserSettingsDto } from '../types/settings';
import type { ApiResponse } from '../types/common';
import type { ApiClient } from './blocks';

export const createSettingsApi = (api: ApiClient) => ({
  async updateSettings(data: UpdateSettingsRequest): Promise<UserSettingsDto> {
    const response = await api.patch<ApiResponse<UserSettingsDto>>('/auth/settings', data);
    return response.data;
  },
});

export type SettingsApi = ReturnType<typeof createSettingsApi>;
