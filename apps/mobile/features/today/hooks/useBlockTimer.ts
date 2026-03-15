import { useMemo } from 'react';
import type { BlockDto } from '@tymblok/api-client';
import { mapBlockToTaskCard } from '../../../utils/mappers';
import type { TaskCardData } from '@tymblok/ui';

/**
 * Hook that maps blocks to TaskCardData.
 * Live elapsed time is now computed inside each TaskCard,
 * so this hook no longer needs a timer tick.
 */
export function useBlockTimer(blocks: BlockDto[] | undefined) {
  const allTasks: TaskCardData[] = useMemo(() => {
    if (!blocks) return [];
    return blocks.map(block => mapBlockToTaskCard(block));
  }, [blocks]);

  const activeTasks = useMemo(() => allTasks.filter(t => !t.completed), [allTasks]);
  const completedTasks = useMemo(() => allTasks.filter(t => t.completed), [allTasks]);

  return { allTasks, activeTasks, completedTasks };
}
