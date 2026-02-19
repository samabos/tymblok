import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { IntegrationsApi } from '../api/integrations';
import type { IntegrationProvider, IntegrationCallbackRequest } from '../types/integration';
import { inboxKeys } from './useInbox';
import { blockKeys } from './useBlocks';

export const integrationKeys = {
  all: ['integrations'] as const,
  lists: () => [...integrationKeys.all, 'list'] as const,
  list: () => [...integrationKeys.lists()] as const,
};

export const createIntegrationHooks = (integrationsApi: IntegrationsApi) => {
  const useIntegrations = () => {
    return useQuery({
      queryKey: integrationKeys.list(),
      queryFn: () => integrationsApi.list(),
    });
  };

  const useConnectIntegration = () => {
    return useMutation({
      mutationFn: ({
        provider,
        redirectUri,
      }: {
        provider: IntegrationProvider;
        redirectUri?: string;
      }) => integrationsApi.connect(provider, redirectUri),
    });
  };

  const useIntegrationCallback = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({
        provider,
        data,
      }: {
        provider: IntegrationProvider;
        data: IntegrationCallbackRequest;
      }) => integrationsApi.callback(provider, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: integrationKeys.lists() });
      },
    });
  };

  const useDisconnectIntegration = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (provider: IntegrationProvider) => integrationsApi.disconnect(provider),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: integrationKeys.lists() });
      },
    });
  };

  const useSyncIntegration = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (provider: IntegrationProvider) => integrationsApi.sync(provider),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: integrationKeys.lists() });
        queryClient.invalidateQueries({ queryKey: inboxKeys.all });
        queryClient.invalidateQueries({ queryKey: blockKeys.all });
      },
    });
  };

  const useSyncAllIntegrations = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: () => integrationsApi.syncAll(),
      onSuccess: data => {
        if (data.totalItemsSynced > 0) {
          queryClient.invalidateQueries({ queryKey: integrationKeys.lists() });
          queryClient.invalidateQueries({ queryKey: inboxKeys.all });
          queryClient.invalidateQueries({ queryKey: blockKeys.all });
        }
      },
    });
  };

  return {
    useIntegrations,
    useConnectIntegration,
    useIntegrationCallback,
    useDisconnectIntegration,
    useSyncIntegration,
    useSyncAllIntegrations,
    integrationKeys,
  };
};
