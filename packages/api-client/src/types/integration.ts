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
  name: string;
  externalUsername: string | null;
  externalAvatarUrl: string | null;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  createdAt: string;
}

export interface IntegrationsResponse {
  integrations: IntegrationDto[];
}

export interface ConnectIntegrationRequest {
  name?: string;
}

export interface ConnectIntegrationResponse {
  authUrl: string;
  state: string;
}

export interface IntegrationCallbackRequest {
  code: string;
  state: string;
  redirectUri?: string;
  name?: string;
}

export interface RenameIntegrationRequest {
  name: string;
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
