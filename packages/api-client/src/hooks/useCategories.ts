import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CategoriesApi } from '../api/categories';
import type {
  CategoryDto,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../types/category';

// Query key factory
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: () => [...categoryKeys.lists()] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
};

export const createCategoryHooks = (categoriesApi: CategoriesApi) => {
  const useCategories = () => {
    return useQuery({
      queryKey: categoryKeys.list(),
      queryFn: () => categoriesApi.list(),
    });
  };

  const useCategory = (id: string) => {
    return useQuery({
      queryKey: categoryKeys.detail(id),
      queryFn: () => categoriesApi.getById(id),
      enabled: !!id,
    });
  };

  const useCreateCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: CreateCategoryRequest) => categoriesApi.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      },
    });
  };

  const useUpdateCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
        categoriesApi.update(id, data),

      // Optimistic update
      onMutate: async ({ id, data }) => {
        await queryClient.cancelQueries({ queryKey: categoryKeys.detail(id) });

        const previousCategory = queryClient.getQueryData<CategoryDto>(categoryKeys.detail(id));

        if (previousCategory) {
          queryClient.setQueryData<CategoryDto>(categoryKeys.detail(id), {
            ...previousCategory,
            ...data,
          });
        }

        return { previousCategory };
      },

      onError: (err, { id }, context) => {
        if (context?.previousCategory) {
          queryClient.setQueryData(categoryKeys.detail(id), context.previousCategory);
        }
      },

      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      },
    });
  };

  const useDeleteCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id: string) => categoriesApi.delete(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      },
    });
  };

  return {
    useCategories,
    useCategory,
    useCreateCategory,
    useUpdateCategory,
    useDeleteCategory,
    categoryKeys,
  };
};
