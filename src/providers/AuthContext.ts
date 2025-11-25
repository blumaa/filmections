/**
 * Auth Context
 *
 * Context for authentication state.
 * Separated from provider for React Fast Refresh compliance.
 */

import { createContext } from 'react';
import { supabase } from '../lib/supabase/client';
import { SupabaseAuth } from '../lib/supabase/auth';
import type { AuthUser } from '../lib/supabase/auth';

export interface AuthContextValue {
  auth: SupabaseAuth;
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
}

// Create auth instance (singleton)
const auth = new SupabaseAuth(supabase);

// Default context value
const defaultContext: AuthContextValue = {
  auth,
  user: null,
  isLoading: true,
  signIn: async () => ({ error: new Error('AuthProvider not initialized') }),
  signUp: async () => ({ error: new Error('AuthProvider not initialized') }),
  signOut: async () => ({ error: new Error('AuthProvider not initialized') }),
};

export const AuthContext = createContext<AuthContextValue>(defaultContext);
