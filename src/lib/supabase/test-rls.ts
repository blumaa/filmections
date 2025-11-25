/**
 * Row Level Security (RLS) Policy Tests
 *
 * Run this script directly to test RLS policies:
 * bun src/lib/supabase/test-rls.ts
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Create public (unauthenticated) client with NO session persistence
// This ensures we're truly anonymous and not using a cached admin session
const publicClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,  // Don't persist sessions
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// Test counters
let passed = 0;
let failed = 0;

function logTest(name: string, success: boolean, message?: string) {
  if (success) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    if (message) console.log(`   ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('🧪 Testing RLS Policies\n');
  console.log('='.repeat(50));
  console.log('PUBLIC USER ACCESS (Unauthenticated)');
  console.log('='.repeat(50) + '\n');

  // Test 1: Can read published puzzles
  try {
    const { error } = await publicClient
      .from('puzzles')
      .select('id, status')
      .eq('status', 'published')
      .limit(1);

    logTest(
      'Public can read published puzzles',
      error === null,
      error?.message
    );
  } catch (e) {
    logTest('Public can read published puzzles', false, String(e));
  }

  // Test 2: Cannot read pending puzzles
  try {
    const { data, error } = await publicClient
      .from('puzzles')
      .select('id, status')
      .eq('status', 'pending')
      .limit(1);

    // Should return empty array due to RLS, not an error
    logTest(
      'Public cannot read pending puzzles',
      error === null && data?.length === 0,
      error ? error.message : data?.length ? 'Returned pending puzzles!' : undefined
    );
  } catch (e) {
    logTest('Public cannot read pending puzzles', false, String(e));
  }

  // Test 3: Cannot insert puzzles
  try {
    const { error } = await publicClient
      .from('puzzles')
      .insert({
        puzzle_date: '2099-12-31',
        films: [],
        groups: [],
        status: 'pending',
        quality_score: 50,
        connection_types: [],
      } as never);

    logTest(
      'Public cannot insert puzzles',
      error !== null && error.code === '42501',
      error ? `Error code: ${error.code}, Message: ${error.message}` : 'No error - insertion succeeded!'
    );
  } catch (e) {
    logTest('Public cannot insert puzzles', true, String(e));
  }

  // Test 4: Can read admin_users (for isAdmin checks)
  try {
    const { error } = await publicClient
      .from('admin_users')
      .select('email')
      .limit(1);

    logTest(
      'Public can read admin_users table',
      error === null,
      error?.message
    );
  } catch (e) {
    logTest('Public can read admin_users table', false, String(e));
  }

  // Test 5: Cannot read user_stats
  try {
    const { data, error } = await publicClient
      .from('user_stats')
      .select('*')
      .limit(1);

    logTest(
      'Public cannot read user_stats',
      data?.length === 0,
      error?.message || (data?.length ? 'Returned user stats!' : undefined)
    );
  } catch (e) {
    logTest('Public cannot read user_stats', false, String(e));
  }

  // Test 6: Cannot read gameplay
  try {
    const { data, error } = await publicClient
      .from('gameplay')
      .select('*')
      .limit(1);

    logTest(
      'Public cannot read gameplay',
      data?.length === 0,
      error?.message || (data?.length ? 'Returned gameplay records!' : undefined)
    );
  } catch (e) {
    logTest('Public cannot read gameplay', false, String(e));
  }

  // Test 7: Cannot read generator_configs
  try {
    const { data, error } = await publicClient
      .from('generator_configs')
      .select('name')
      .limit(1);

    logTest(
      'Public cannot read generator_configs',
      data?.length === 0,
      error?.message || (data?.length ? 'Returned configs!' : undefined)
    );
  } catch (e) {
    logTest('Public cannot read generator_configs', false, String(e));
  }

  console.log('\n' + '='.repeat(50));
  console.log('HELPER FUNCTIONS');
  console.log('='.repeat(50) + '\n');

  // Test 8: get_daily_puzzle function
  try {
    const { error } = await publicClient
      .rpc('get_daily_puzzle', { puzzle_date_param: '2025-01-01' } as never);

    logTest(
      'get_daily_puzzle() returns data',
      error === null,
      error?.message
    );
  } catch (e) {
    logTest('get_daily_puzzle() returns data', false, String(e));
  }

  // Test 9: get_next_available_date function
  try {
    const { data, error } = await publicClient
      .rpc('get_next_available_date');

    logTest(
      'get_next_available_date() returns date',
      error === null && typeof data === 'string',
      error?.message || `Returned: ${data}`
    );
  } catch (e) {
    logTest('get_next_available_date() returns date', false, String(e));
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total:  ${passed + failed}`);

  if (failed === 0) {
    console.log('\n🎉 All RLS policies are working correctly!\n');
  } else {
    console.log('\n⚠️  Some tests failed. Review RLS policies.\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test suite error:', error);
  process.exit(1);
});
