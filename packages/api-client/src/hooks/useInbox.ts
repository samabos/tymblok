import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { InboxApi } from '../api/inbox';
import type {
  InboxItemDto,
  CreateInboxItemRequest,
  UpdateInboxItemRequest,
} from '../types/inbox';

// Query key factory
export const inboxKeys = {
  all: ['inbox'] as const,
  lists: () => [...inboxKeys.all, 'list'] as const,
  list: () => [...inboxKeys.lists()] as const,
  details: () => [...inboxKeys.all, 'detail'] as const,
  detail: (id: string) => [...inboxKeys.details(), id] as const,
};

export const createInboxHooks = (inboxApi: InboxApi) => {
  const useInboxItems = () => {
    return useQuery({
      queryKey: inboxKeys.list(),
      queryFn: () => inboxApi.list(),
    });
  };

  const useInboxItem = (id: string) => {
    return useQuery({
      queryKey: inboxKeys.detail(id),
      queryFn: () => inboxApi.getById(id),
      enabled: !!id,
    });
  };

  const useCreateInboxItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: CreateInboxItemRequest) => inboxApi.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: inboxKeys.lists() });
      },
    });
  };

  const useUpdateInboxItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: UpdateInboxItemRequest }) =>
        inboxApi.update(id, data),

      // Optimistic update
      onMutate: async ({ id, data }) => {
        await queryClient.cancelQueries({ queryKey: inboxKeys.detail(id) });

        const previousItem = queryClient.getQueryData<InboxItemDto>(inboxKeys.detail(id));

        if (previousItem) {
          queryClient.setQueryData<InboxItemDto>(inboxKeys.detail(id), {
            ...previousItem,
            ...data,
          });
        }

        return { previousItem };
      },

      onError: (err, { id }, context) => {
        if (context?.previousItem) {
          queryClient.setQueryData(inboxKeys.detail(id), context.previousItem);
        }
      },

      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: inboxKeys.lists() });
      },
    });
  };

  const useDismissInboxItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id: string) => inboxApi.dismiss(id),

      // Optimistic update - mark as dismissed
      onMutate: async (id) => {
        await queryClient.cancelQueries({ queryKey: inboxKeys.lists() });

        const previousItems = queryClient.getQueryData<InboxItemDto[]>(inboxKeys.list());

        if (previousItems) {
          queryClient.setQueryData<InboxItemDto[]>(
            inboxKeys.list(),
            previousItems.map(item =>
              item.id === id
                ? { ...item, isDismissed: true, dismissedAt: new Date().toISOString() }
                : item
            )
          );
        }

        return { previousItems };
      },

      onError: (err, id, context) => {
        if (context?.previousItems) {
          queryClient.setQueryData(inboxKeys.list(), context.previousItems);
        }
      },

      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: inboxKeys.lists() });
      },
    });
  };

  const useDeleteInboxItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id: string) => inboxApi.delete(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: inboxKeys.lists() });
      },
    });
  };

  return {
    useInboxItems,
    useInboxItem,
    useCreateInboxItem,
    useUpdateInboxItem,
    useDismissInboxItem,
    useDeleteInboxItem,
    inboxKeys,
  };
};
