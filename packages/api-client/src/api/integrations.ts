import type { ApiClient } from './blocks';
import type { ApiResponse } from '../types/common';
import type {
  IntegrationDto,
  IntegrationsResponse,
  ConnectIntegrationRequest,
  ConnectIntegrationResponse,
  IntegrationCallbackRequest,
  IntegrationProvider,
  RenameIntegrationRequest,
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
    redirectUri?: string,
    name?: string
  ): Promise<ConnectIntegrationResponse> {
    const query = redirectUri ? `?redirectUri=${encodeURIComponent(redirectUri)}` : '';
    const body: ConnectIntegrationRequest | undefined = name ? { name } : undefined;
    const response = await api.post<ApiResponse<ConnectIntegrationResponse>>(
      `/integrations/${provider}/connect${query}`,
      body
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

  async disconnect(integrationId: string): Promise<void> {
    await api.delete(`/integrations/${integrationId}`);
  },

  async rename(integrationId: string, name: string): Promise<IntegrationDto> {
    const body: RenameIntegrationRequest = { name };
    const response = await api.patch<ApiResponse<IntegrationDto>>(
      `/integrations/${integrationId}`,
      body
    );
    return response.data;
  },

  async sync(integrationId: string): Promise<SyncIntegrationResponse> {
    const response = await api.post<ApiResponse<SyncIntegrationResponse>>(
      `/integrations/${integrationId}/sync`
    );
    return response.data;
  },

  async syncAll(): Promise<SyncAllResponse> {
    const response = await api.post<ApiResponse<SyncAllResponse>>('/integrations/sync-all');
    return response.data;
  },
});

export type IntegrationsApi = ReturnType<typeof createIntegrationsApi>;
