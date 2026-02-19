export enum IntegrationProvider {
  GitHub = 'GitHub',
  Jira = 'Jira',
  GoogleCalendar = 'GoogleCalendar',
  Slack = 'Slack',
  Notion = 'Notion',
  Linear = 'Linear',
}

export interface IntegrationDto {
  id: string;
  provider: IntegrationProvider;
  externalUsername: string | null;
  externalAvatarUrl: string | null;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  createdAt: string;
}

export interface IntegrationsResponse {
  integrations: IntegrationDto[];
}

export interface ConnectIntegrationResponse {
  authUrl: string;
  state: string;
}

export interface IntegrationCallbackRequest {
  code: string;
  state: string;
  redirectUri?: string;
}

export interface SyncIntegrationResponse {
  itemsSynced: number;
  lastSyncAt: string;
}

export interface SyncAllResponse {
  totalItemsSynced: number;
  integrationsSynced: number;
  syncedAt: string;
}
