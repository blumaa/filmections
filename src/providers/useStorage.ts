/**
 * useStorage Hook
 *
 * Hook to access puzzle storage from context.
 */

import { useContext } from 'react';
import { StorageContext } from './useStorageContext';

export function useStorage() {
  return useContext(StorageContext);
}
