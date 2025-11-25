/**
 * Storage Provider
 *
 * Provides puzzle storage instance throughout the app.
 * Makes storage available to all components via context.
 */

import { ReactNode } from 'react';
import { supabase } from '../lib/supabase/client';
import { SupabaseStorage } from '../lib/supabase/storage';
import { StorageContext } from './useStorageContext';

// Create storage instance (singleton)
const storage = new SupabaseStorage(supabase);

interface StorageProviderProps {
  children: ReactNode;
}

/**
 * Provides storage context to children.
 * Single storage instance shared across the app.
 */
export function StorageProvider({ children }: StorageProviderProps) {
  return <StorageContext.Provider value={storage}>{children}</StorageContext.Provider>;
}
