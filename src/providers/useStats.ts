/**
 * useStats Hook
 *
 * Hook to access stats storage from context.
 */

import { useContext } from 'react';
import { StatsContext } from './useStatsContext';

export function useStats() {
  return useContext(StatsContext);
}
