import type {
  BlockDto,
  CreateBlockRequest,
  UpdateBlockRequest,
  GetBlocksParams,
  BlocksResponse,
  CarryOverResponse,
} from '../types/block';
import type { ApiResponse } from '../types/common';

// ApiClient type based on the mobile api service
export interface ApiClient {
  get: <T>(endpoint: string, options?: Record<string, unknown>) => Promise<T>;
  post: <T>(endpoint: string, body?: unknown, options?: Record<string, unknown>) => Promise<T>;
  patch: <T>(endpoint: string, body?: unknown, options?: Record<string, unknown>) => Promise<T>;
  delete: <T>(endpoint: string, options?: Record<string, unknown>) => Promise<T>;
}

export const createBlocksApi = (api: ApiClient) => ({
  async list(params?: GetBlocksParams): Promise<BlockDto[]> {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const query = queryParams.toString();
    const endpoint = query ? `/blocks?${query}` : '/blocks';

    const response = await api.get<ApiResponse<BlocksResponse>>(endpoint);
    return response.data.blocks;
  },

  async getById(id: string): Promise<BlockDto> {
    const response = await api.get<ApiResponse<BlockDto>>(`/blocks/${id}`);
    return response.data;
  },

  async create(data: CreateBlockRequest): Promise<BlockDto> {
    const response = await api.post<ApiResponse<BlockDto>>('/blocks', data);
    return response.data;
  },

  async update(id: string, data: UpdateBlockRequest): Promise<BlockDto> {
    const response = await api.patch<ApiResponse<BlockDto>>(`/blocks/${id}`, data);
    return response.data;
  },

  async complete(id: string): Promise<BlockDto> {
    const response = await api.post<ApiResponse<BlockDto>>(`/blocks/${id}/complete`);
    return response.data;
  },

  async start(id: string): Promise<BlockDto> {
    const response = await api.post<ApiResponse<BlockDto>>(`/blocks/${id}/start`);
    return response.data;
  },

  async pause(id: string): Promise<BlockDto> {
    const response = await api.post<ApiResponse<BlockDto>>(`/blocks/${id}/pause`);
    return response.data;
  },

  async resume(id: string): Promise<BlockDto> {
    const response = await api.post<ApiResponse<BlockDto>>(`/blocks/${id}/resume`);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/blocks/${id}`);
  },

  async restore(id: string): Promise<BlockDto> {
    const response = await api.post<ApiResponse<BlockDto>>(`/blocks/${id}/restore`);
    return response.data;
  },

  async carryOver(): Promise<CarryOverResponse> {
    const response = await api.post<ApiResponse<CarryOverResponse>>('/blocks/carry-over');
    return response.data;
  },
});

export type BlocksApi = ReturnType<typeof createBlocksApi>;
