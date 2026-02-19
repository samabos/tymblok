import type { SupportContentDto, SupportContentsResponse } from '../types/content';
import type { ApiResponse } from '../types/common';
import type { ApiClient } from './blocks';

export const createContentApi = (api: ApiClient) => ({
  async getBySlug(slug: string): Promise<SupportContentDto> {
    const response = await api.get<ApiResponse<SupportContentDto>>(`/support-content/${slug}`);
    return response.data;
  },

  async listPublished(): Promise<SupportContentDto[]> {
    const response = await api.get<ApiResponse<SupportContentsResponse>>('/support-content');
    return response.data.contents;
  },
});

export type ContentApi = ReturnType<typeof createContentApi>;
