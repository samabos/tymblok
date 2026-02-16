import { createApiHooks } from '@tymblok/api-client';
import { api } from './api';

// Create and export all hooks
export const {
  categories: categoryHooks,
  inbox: inboxHooks,
  blocks: blockHooks,
} = createApiHooks(api);

// Convenience exports
export const {
  useCategories,
  useCategory,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} = categoryHooks;

export const {
  useInboxItems,
  useInboxItem,
  useCreateInboxItem,
  useUpdateInboxItem,
  useDismissInboxItem,
  useDeleteInboxItem,
} = inboxHooks;

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
  useRestoreBlock,
  useUpdateBlocksSortOrder,
} = blockHooks;
