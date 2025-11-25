/**
 * useAuth Hook
 *
 * Hook to access authentication from context.
 */

import { useContext } from 'react';
import { AuthContext } from './AuthContext';

export function useAuth() {
  return useContext(AuthContext);
}
