/**
 * Check RLS Status in Database
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

const client = createClient(supabaseUrl, supabaseAnonKey);

async function checkRLS() {
  console.log('🔍 Checking RLS Configuration\n');

  // Check RLS status
  const { data: tables, error: tablesError } = await client
    .from('pg_tables')
    .select('tablename, rowsecurity')
    .eq('schemaname', 'public')
    .in('tablename', ['puzzles', 'user_stats', 'gameplay', 'admin_users', 'generator_configs']);

  if (tablesError) {
    console.error('❌ Error checking tables:', tablesError.message);
    return;
  }

  console.log('📋 RLS Status:');
  console.log(tables);

  // Check policies
  const { data: policies, error: policiesError } = await client
    .from('pg_policies')
    .select('*')
    .eq('schemaname', 'public')
    .in('tablename', ['puzzles', 'user_stats', 'gameplay', 'admin_users', 'generator_configs']);

  if (policiesError) {
    console.error('❌ Error checking policies:', policiesError.message);
    return;
  }

  console.log('\n📜 Policies:');
  console.log(JSON.stringify(policies, null, 2));
}

checkRLS();
