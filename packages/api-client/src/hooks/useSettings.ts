import { useMutation } from '@tanstack/react-query';
import type { SettingsApi } from '../api/settings';
import type { UpdateSettingsRequest } from '../types/settings';

export const settingsKeys = {
  all: ['settings'] as const,
};

export const createSettingsHooks = (settingsApi: SettingsApi) => {
  const useUpdateSettings = () => {
    return useMutation({
      mutationFn: (data: UpdateSettingsRequest) => settingsApi.updateSettings(data),
    });
  };

  return {
    useUpdateSettings,
    settingsKeys,
  };
};
