import { useState, useEffect } from 'react';
import type { BlockDto } from '@tymblok/api-client';
import { mapBlockToTaskCard } from '../../../utils/mappers';
import type { TaskCardData } from '@tymblok/ui';

/**
 * Hook that maps blocks to TaskCardData and computes live elapsed time
 * for running timers by ticking every second.
 */
export function useBlockTimer(blocks: BlockDto[] | undefined) {
  const [timerTick, setTimerTick] = useState(0);

  // Tick every second to re-render running timers
  useEffect(() => {
    const hasRunning = blocks?.some(b => b.timerState === 'Running');
    if (!hasRunning) return;

    const interval = setInterval(() => {
      setTimerTick(t => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [blocks]);

  // Map API data to UI format, computing live elapsed from backend timestamps
  const allTasks: TaskCardData[] = (() => {
    if (!blocks) return [];
    return blocks.map(block => {
      const card = mapBlockToTaskCard(block);
      if (block.timerState === 'Running') {
        const resumedAt = block.resumedAt || block.startedAt;
        if (resumedAt) {
          const currentRunSeconds = Math.floor((Date.now() - new Date(resumedAt).getTime()) / 1000);
          card.elapsedSeconds = (block.elapsedSeconds || 0) + Math.max(0, currentRunSeconds);
        }
      }
      return card;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  })();

  const activeTasks = allTasks.filter(t => !t.completed);
  const completedTasks = allTasks.filter(t => t.completed);

  return { allTasks, activeTasks, completedTasks, timerTick };
}
