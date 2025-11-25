/**
 * Test Supabase Connection
 *
 * Run this to verify Supabase is configured correctly.
 */

import { supabase, isAdmin } from './client';

export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  try {
    // Test 1: Basic connection
    const { error: puzzlesError } = await supabase
      .from('puzzles')
      .select('count');

    if (puzzlesError) {
      console.error('❌ Failed to connect to puzzles table:', puzzlesError);
      return false;
    }
    console.log('✅ Connected to puzzles table');

    // Test 2: Generator configs
    const { data: configs, error: configsError } = await supabase
      .from('generator_configs')
      .select('name')
      .limit(5);

    if (configsError) {
      console.error('❌ Failed to read generator configs:', configsError);
      return false;
    }
    console.log('✅ Generator configs found:', configs?.length || 0);
    configs?.forEach((c: { name: string }) => console.log(`   - ${c.name}`));

    // Test 3: Admin check (will return false if not logged in, which is expected)
    const isAdminUser = await isAdmin();
    console.log('✅ Admin check function works (logged in:', isAdminUser, ')');

    console.log('\n🎉 All tests passed! Supabase is configured correctly.\n');
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testSupabaseConnection();
}
