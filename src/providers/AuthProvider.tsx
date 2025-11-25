/**
 * Auth Provider
 *
 * Provides authentication state and methods throughout the app.
 */

import { ReactNode, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { supabase } from '../lib/supabase/client';
import { SupabaseAuth } from '../lib/supabase/auth';
import type { AuthUser } from '../lib/supabase/auth';

// Create auth instance (singleton)
const auth = new SupabaseAuth(supabase);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provides authentication context to children.
 * Manages auth state and subscribes to auth changes.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    auth.getCurrentUser().then(({ user }) => {
      setUser(user);
      setIsLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = auth.onAuthStateChange((user) => {
      setUser(user);
      setIsLoading(false);
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in wrapper
  const signIn = async (email: string, password: string) => {
    const { user, error } = await auth.signIn({ email, password });
    if (user) {
      setUser(user);
    }
    return { error };
  };

  // Sign up wrapper
  const signUp = async (email: string, password: string) => {
    const { user, error } = await auth.signUp({ email, password });
    if (user) {
      setUser(user);
    }
    return { error };
  };

  // Sign out wrapper
  const signOut = async () => {
    const { error } = await auth.signOut();
    if (!error) {
      setUser(null);
    }
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        auth,
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
