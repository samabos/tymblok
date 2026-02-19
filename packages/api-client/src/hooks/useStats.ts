import { useQuery } from '@tanstack/react-query';
import type { StatsApi } from '../api/stats';

export const statsKeys = {
  all: ['stats'] as const,
  summary: () => [...statsKeys.all, 'summary'] as const,
};

export const createStatsHooks = (statsApi: StatsApi) => {
  const useStats = () => {
    return useQuery({
      queryKey: statsKeys.summary(),
      queryFn: () => statsApi.get(),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  return {
    useStats,
    statsKeys,
  };
};
