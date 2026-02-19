import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { BlocksApi } from '../api/blocks';
import type {
  BlockDto,
  CreateBlockRequest,
  UpdateBlockRequest,
  GetBlocksParams,
} from '../types/block';

// Query key factory for efficient invalidation
export const blockKeys = {
  all: ['blocks'] as const,
  lists: () => [...blockKeys.all, 'list'] as const,
  list: (params?: GetBlocksParams) => [...blockKeys.lists(), params] as const,
  details: () => [...blockKeys.all, 'detail'] as const,
  detail: (id: string) => [...blockKeys.details(), id] as const,
};

export const createBlockHooks = (blocksApi: BlocksApi) => {
  const useBlocks = (
    params?: GetBlocksParams,
    options?: Pick<UseQueryOptions<BlockDto[]>, 'enabled'>,
  ) => {
    return useQuery({
      queryKey: blockKeys.list(params),
      queryFn: () => blocksApi.list(params),
      ...options,
    });
  };

  const useBlock = (id: string) => {
    return useQuery({
      queryKey: blockKeys.detail(id),
      queryFn: () => blocksApi.getById(id),
      enabled: !!id,
    });
  };

  const useCreateBlock = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: CreateBlockRequest) => blocksApi.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: blockKeys.lists() });
      },
    });
  };

  const useUpdateBlock = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: UpdateBlockRequest }) =>
        blocksApi.update(id, data),

      // Optimistic update
      onMutate: async ({ id, data }) => {
        await queryClient.cancelQueries({ queryKey: blockKeys.detail(id) });

        const previousBlock = queryClient.getQueryData<BlockDto>(blockKeys.detail(id));

        if (previousBlock) {
          queryClient.setQueryData<BlockDto>(blockKeys.detail(id), {
            ...previousBlock,
            ...data,
          });
        }

        return { previousBlock };
      },

      // Rollback on error
      onError: (err, { id }, context) => {
        if (context?.previousBlock) {
          queryClient.setQueryData(blockKeys.detail(id), context.previousBlock);
        }
      },

      // Refetch on success
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: blockKeys.lists() });
      },
    });
  };

  const useCompleteBlock = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id: string) => blocksApi.complete(id),
      onSuccess: (data, id) => {
        queryClient.setQueryData(blockKeys.detail(id), data);
        queryClient.invalidateQueries({ queryKey: blockKeys.lists() });
      },
    });
  };

  const useStartBlock = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id: string) => blocksApi.start(id),
      onSuccess: (data, id) => {
        queryClient.setQueryData(blockKeys.detail(id), data);
        queryClient.invalidateQueries({ queryKey: blockKeys.lists() });
      },
    });
  };

  const usePauseBlock = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id: string) => blocksApi.pause(id),
      onSuccess: (data, id) => {
        queryClient.setQueryData(blockKeys.detail(id), data);
        queryClient.invalidateQueries({ queryKey: blockKeys.lists() });
      },
    });
  };

  const useResumeBlock = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id: string) => blocksApi.resume(id),
      onSuccess: (data, id) => {
        queryClient.setQueryData(blockKeys.detail(id), data);
        queryClient.invalidateQueries({ queryKey: blockKeys.lists() });
      },
    });
  };

  const useDeleteBlock = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id: string) => blocksApi.delete(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: blockKeys.lists() });
      },
    });
  };

  const useRestoreBlock = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id: string) => blocksApi.restore(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: blockKeys.lists() });
      },
    });
  };

  const useCarryOver = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: () => blocksApi.carryOver(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: blockKeys.lists() });
      },
    });
  };

  // Special hook for drag-and-drop reordering
  const useUpdateBlocksSortOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (updates: Array<{ id: string; sortOrder: number }>) => {
        // Batch update
        await Promise.all(updates.map(({ id, sortOrder }) => blocksApi.update(id, { sortOrder })));
      },

      // Optimistic update
      onMutate: async updates => {
        await queryClient.cancelQueries({ queryKey: blockKeys.lists() });

        const previousBlocks = queryClient.getQueriesData({ queryKey: blockKeys.lists() });

        // Update all matching queries
        queryClient.setQueriesData<BlockDto[]>({ queryKey: blockKeys.lists() }, old => {
          if (!old) return old;

          const updateMap = new Map(updates.map(u => [u.id, u.sortOrder]));

          return old
            .map(block => {
              const newSortOrder = updateMap.get(block.id);
              return newSortOrder !== undefined ? { ...block, sortOrder: newSortOrder } : block;
            })
            .sort((a, b) => a.sortOrder - b.sortOrder);
        });

        return { previousBlocks };
      },

      onError: (err, updates, context) => {
        if (context?.previousBlocks) {
          context.previousBlocks.forEach(([queryKey, data]) => {
            queryClient.setQueryData(queryKey, data);
          });
        }
      },
    });
  };

  return {
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
    useCarryOver,
    blockKeys,
  };
};
