import type { ApiClient } from './blocks';
import type { ApiResponse } from '../types/common';
import type {
  IntegrationDto,
  IntegrationsResponse,
  ConnectIntegrationResponse,
  IntegrationCallbackRequest,
  IntegrationProvider,
  SyncIntegrationResponse,
  SyncAllResponse,
} from '../types/integration';

export const createIntegrationsApi = (api: ApiClient) => ({
  async list(): Promise<IntegrationDto[]> {
    const response = await api.get<ApiResponse<IntegrationsResponse>>('/integrations');
    return response.data.integrations;
  },

  async connect(
    provider: IntegrationProvider,
    redirectUri?: string
  ): Promise<ConnectIntegrationResponse> {
    const query = redirectUri ? `?redirectUri=${encodeURIComponent(redirectUri)}` : '';
    const response = await api.post<ApiResponse<ConnectIntegrationResponse>>(
      `/integrations/${provider}/connect${query}`
    );
    return response.data;
  },

  async callback(
    provider: IntegrationProvider,
    data: IntegrationCallbackRequest
  ): Promise<IntegrationDto> {
    const response = await api.post<ApiResponse<IntegrationDto>>(
      `/integrations/${provider}/callback`,
      data
    );
    return response.data;
  },

  async disconnect(provider: IntegrationProvider): Promise<void> {
    await api.delete(`/integrations/${provider}`);
  },

  async sync(provider: IntegrationProvider): Promise<SyncIntegrationResponse> {
    const response = await api.post<ApiResponse<SyncIntegrationResponse>>(
      `/integrations/${provider}/sync`
    );
    return response.data;
  },

  async syncAll(): Promise<SyncAllResponse> {
    const response = await api.post<ApiResponse<SyncAllResponse>>('/integrations/sync-all');
    return response.data;
  },
});

export type IntegrationsApi = ReturnType<typeof createIntegrationsApi>;
