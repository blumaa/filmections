/**
 * Supabase Authentication Service
 *
 * Handles user authentication and admin role checking.
 */

import type { SupabaseClient, Session, AuthError } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string | undefined;
  isAdmin: boolean;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
}

/**
 * SupabaseAuth
 *
 * Manages authentication state and operations.
 */
export class SupabaseAuth {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Sign in with email and password
   */
  async signIn(credentials: SignInCredentials): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return { user: null, error };
      }

      if (!data.user) {
        return { user: null, error: { message: 'No user returned', name: 'AuthError', status: 400 } as AuthError };
      }

      // Read admin status from JWT metadata (instant, no database call)
      const isAdmin = data.user.app_metadata?.is_admin === true;

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          isAdmin,
        },
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        error: error as AuthError,
      };
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(credentials: SignUpCredentials): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return { user: null, error };
      }

      if (!data.user) {
        return { user: null, error: { message: 'No user returned', name: 'AuthError', status: 400 } as AuthError };
      }

      // New users are not admin by default
      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          isAdmin: false,
        },
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        error: error as AuthError,
      };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Get current user session
   */
  async getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    try {
      const { data, error } = await this.supabase.auth.getSession();
      return { session: data.session, error };
    } catch (error) {
      return { session: null, error: error as AuthError };
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await this.supabase.auth.getUser();

      if (error) {
        return { user: null, error };
      }

      if (!data.user) {
        return { user: null, error: null };
      }

      // Read admin status from JWT metadata (instant, no database call)
      const isAdmin = data.user.app_metadata?.is_admin === true;

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          isAdmin,
        },
        error: null,
      };
    } catch (error) {
      return { user: null, error: error as AuthError };
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return this.supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Read admin status from JWT metadata (instant, no database call)
        const isAdmin = session.user.app_metadata?.is_admin === true;
        callback({
          id: session.user.id,
          email: session.user.email,
          isAdmin,
        });
      } else {
        callback(null);
      }
    });
  }

  /**
   * Reset password for email
   */
  async resetPasswordForEmail(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }
}
