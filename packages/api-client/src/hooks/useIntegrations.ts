import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { IntegrationsApi } from '../api/integrations';
import type { IntegrationProvider } from '../types/integration';
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
        name,
      }: {
        provider: IntegrationProvider;
        redirectUri?: string;
        name?: string;
      }) => integrationsApi.connect(provider, redirectUri, name),
    });
  };

  const useDisconnectIntegration = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (integrationId: string) => integrationsApi.disconnect(integrationId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: integrationKeys.lists() });
      },
    });
  };

  const useRenameIntegration = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ integrationId, name }: { integrationId: string; name: string }) =>
        integrationsApi.rename(integrationId, name),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: integrationKeys.lists() });
      },
    });
  };

  const useSyncIntegration = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (integrationId: string) => integrationsApi.sync(integrationId),
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
    useDisconnectIntegration,
    useRenameIntegration,
    useSyncIntegration,
    useSyncAllIntegrations,
    integrationKeys,
  };
};
