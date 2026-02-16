// Re-export types
export * from './types/common';
export * from './types/category';
export * from './types/inbox';
export * from './types/block';

// Re-export API creators
export { createCategoriesApi, type CategoriesApi } from './api/categories';
export { createInboxApi, type InboxApi } from './api/inbox';
export { createBlocksApi, type BlocksApi, type ApiClient } from './api/blocks';

// Re-export hook creators
export { createCategoryHooks, categoryKeys } from './hooks/useCategories';
export { createInboxHooks, inboxKeys } from './hooks/useInbox';
export { createBlockHooks, blockKeys } from './hooks/useBlocks';

// Factory to create all hooks at once
import type { ApiClient } from './api/blocks';
import { createCategoriesApi } from './api/categories';
import { createInboxApi } from './api/inbox';
import { createBlocksApi } from './api/blocks';
import { createCategoryHooks } from './hooks/useCategories';
import { createInboxHooks } from './hooks/useInbox';
import { createBlockHooks } from './hooks/useBlocks';

export const createApiHooks = (apiClient: ApiClient) => {
  const categoriesApi = createCategoriesApi(apiClient);
  const inboxApi = createInboxApi(apiClient);
  const blocksApi = createBlocksApi(apiClient);

  return {
    categories: createCategoryHooks(categoriesApi),
    inbox: createInboxHooks(inboxApi),
    blocks: createBlockHooks(blocksApi),
  };
};
