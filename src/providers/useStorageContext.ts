/**
 * Storage Context
 *
 * React context for accessing puzzle storage throughout the app.
 */

import { createContext } from 'react';
import { supabase } from '../lib/supabase/client';
import { SupabaseStorage } from '../lib/supabase/storage';
import type { IPuzzleStorage } from '../lib/supabase/storage';

// Create storage instance (singleton)
const storage = new SupabaseStorage(supabase);

// Create context with the storage instance
export const StorageContext = createContext<IPuzzleStorage>(storage);
