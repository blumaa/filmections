/**
 * Test what auth.uid() returns for anon key requests
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

const client = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthUid() {
  console.log('🔍 Testing auth.uid() for anon key requests\n');

  // Check current user
  const { data: { user }, error } = await client.auth.getUser();
  console.log('Current user:', user);
  console.log('Error:', error);
  console.log('User ID:', user?.id || 'NULL');

  // Try to query a function that returns auth.uid()
  const { data: uid, error: uidError } = await client
    .rpc('auth.uid' as never);

  console.log('\nDirect auth.uid() call:');
  console.log('UID:', uid);
  console.log('Error:', uidError);

  // Check session
  const { data: { session } } = await client.auth.getSession();
  console.log('\nSession:', session);
  console.log('Session user ID:', session?.user?.id || 'NULL');
}

testAuthUid();
