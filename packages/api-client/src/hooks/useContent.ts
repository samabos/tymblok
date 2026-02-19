import { useQuery } from '@tanstack/react-query';
import type { ContentApi } from '../api/content';

export const contentKeys = {
  all: ['content'] as const,
  detail: (slug: string) => [...contentKeys.all, slug] as const,
  list: () => [...contentKeys.all, 'list'] as const,
};

export const createContentHooks = (contentApi: ContentApi) => {
  const useSupportContent = (slug: string) => {
    return useQuery({
      queryKey: contentKeys.detail(slug),
      queryFn: () => contentApi.getBySlug(slug),
      enabled: !!slug,
    });
  };

  const useSupportContents = () => {
    return useQuery({
      queryKey: contentKeys.list(),
      queryFn: () => contentApi.listPublished(),
    });
  };

  return {
    useSupportContent,
    useSupportContents,
    contentKeys,
  };
};
