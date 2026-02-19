import type { StatsResponse } from '../types/stats';
import type { ApiResponse } from '../types/common';
import type { ApiClient } from './blocks';

export const createStatsApi = (api: ApiClient) => ({
  async get(): Promise<StatsResponse> {
    const response = await api.get<ApiResponse<StatsResponse>>('/stats');
    return response.data;
  },
});

export type StatsApi = ReturnType<typeof createStatsApi>;
