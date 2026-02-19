import { createApiHooks } from '@tymblok/api-client';
import { api } from './api';

// Create and export all hooks
export const {
  categories: categoryHooks,
  inbox: inboxHooks,
  blocks: blockHooks,
  integrations: integrationHooks,
  content: contentHooks,
  settings: settingsHooks,
  stats: statsHooks,
} = createApiHooks(api);

// Convenience exports
export const {
  useCategories,
  useCategory,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} = categoryHooks;

export const { useInboxItems, useCreateInboxItem, useUpdateInboxItem, useDismissInboxItem } =
  inboxHooks;

export const {
  useBlocks,
  useBlock,
  useCreateBlock,
  useUpdateBlock,
  useCompleteBlock,
  useStartBlock,
  usePauseBlock,
  useResumeBlock,
  useDeleteBlock,
  useUpdateBlocksSortOrder,
  useCarryOver,
} = blockHooks;

export const {
  useIntegrations,
  useConnectIntegration,
  useDisconnectIntegration,
  useSyncIntegration,
  useSyncAllIntegrations,
} = integrationHooks;

export const { useSupportContent } = contentHooks;

export const { useUpdateSettings } = settingsHooks;

export const { useStats } = statsHooks;
