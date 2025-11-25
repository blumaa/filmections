/**
 * Stats Context
 *
 * Context for stats storage instance.
 * Separated from provider for React Fast Refresh compliance.
 */

import { createContext } from 'react';
import { LocalStatsStorage } from '../services/LocalStatsStorage';
import type { IStatsStorage } from '../types';

// Create singleton instance
const statsStorage = new LocalStatsStorage();

export const StatsContext = createContext<IStatsStorage>(statsStorage);
