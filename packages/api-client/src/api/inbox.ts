import type {
  InboxItemDto,
  CreateInboxItemRequest,
  UpdateInboxItemRequest,
  InboxItemsResponse,
} from '../types/inbox';
import type { ApiResponse } from '../types/common';
import type { ApiClient } from './blocks';

export const createInboxApi = (api: ApiClient) => ({
  async list(): Promise<InboxItemDto[]> {
    const response = await api.get<ApiResponse<InboxItemsResponse>>('/inbox');
    return response.data.items;
  },

  async getById(id: string): Promise<InboxItemDto> {
    const response = await api.get<ApiResponse<InboxItemDto>>(`/inbox/${id}`);
    return response.data;
  },

  async create(data: CreateInboxItemRequest): Promise<InboxItemDto> {
    const response = await api.post<ApiResponse<InboxItemDto>>('/inbox', data);
    return response.data;
  },

  async update(id: string, data: UpdateInboxItemRequest): Promise<InboxItemDto> {
    const response = await api.patch<ApiResponse<InboxItemDto>>(`/inbox/${id}`, data);
    return response.data;
  },

  async dismiss(id: string): Promise<InboxItemDto> {
    const response = await api.patch<ApiResponse<InboxItemDto>>(`/inbox/${id}/dismiss`);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/inbox/${id}`);
  },
});

export type InboxApi = ReturnType<typeof createInboxApi>;
