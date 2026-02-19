// Re-export types
export * from './types/common';
export * from './types/category';
export * from './types/inbox';
export * from './types/block';
export * from './types/integration';
export * from './types/content';
export * from './types/settings';
export * from './types/stats';

// Re-export API creators
export { createCategoriesApi, type CategoriesApi } from './api/categories';
export { createInboxApi, type InboxApi } from './api/inbox';
export { createBlocksApi, type BlocksApi, type ApiClient } from './api/blocks';
export { createIntegrationsApi, type IntegrationsApi } from './api/integrations';
export { createContentApi, type ContentApi } from './api/content';
export { createSettingsApi, type SettingsApi } from './api/settings';
export { createStatsApi, type StatsApi } from './api/stats';

// Re-export hook creators
export { createCategoryHooks, categoryKeys } from './hooks/useCategories';
export { createInboxHooks, inboxKeys } from './hooks/useInbox';
export { createBlockHooks, blockKeys } from './hooks/useBlocks';
export { createIntegrationHooks, integrationKeys } from './hooks/useIntegrations';
export { createContentHooks, contentKeys } from './hooks/useContent';
export { createSettingsHooks, settingsKeys } from './hooks/useSettings';
export { createStatsHooks, statsKeys } from './hooks/useStats';

// Factory to create all hooks at once
import type { ApiClient } from './api/blocks';
import { createCategoriesApi } from './api/categories';
import { createInboxApi } from './api/inbox';
import { createBlocksApi } from './api/blocks';
import { createIntegrationsApi } from './api/integrations';
import { createContentApi } from './api/content';
import { createSettingsApi } from './api/settings';
import { createStatsApi } from './api/stats';
import { createCategoryHooks } from './hooks/useCategories';
import { createInboxHooks } from './hooks/useInbox';
import { createBlockHooks } from './hooks/useBlocks';
import { createIntegrationHooks } from './hooks/useIntegrations';
import { createContentHooks } from './hooks/useContent';
import { createSettingsHooks } from './hooks/useSettings';
import { createStatsHooks } from './hooks/useStats';

export const createApiHooks = (apiClient: ApiClient) => {
  const categoriesApi = createCategoriesApi(apiClient);
  const inboxApi = createInboxApi(apiClient);
  const blocksApi = createBlocksApi(apiClient);
  const integrationsApi = createIntegrationsApi(apiClient);
  const contentApi = createContentApi(apiClient);
  const settingsApi = createSettingsApi(apiClient);
  const statsApi = createStatsApi(apiClient);

  return {
    categories: createCategoryHooks(categoriesApi),
    inbox: createInboxHooks(inboxApi),
    blocks: createBlockHooks(blocksApi),
    integrations: createIntegrationHooks(integrationsApi),
    content: createContentHooks(contentApi),
    settings: createSettingsHooks(settingsApi),
    stats: createStatsHooks(statsApi),
  };
};
