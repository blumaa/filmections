/**
 * Generate Test Puzzle SQL Script
 *
 * Generates a test puzzle and outputs SQL to insert it.
 * Run with: bun run scripts/generateTestPuzzleSQL.ts
 * Then copy the SQL and run in Supabase SQL Editor.
 */

/* eslint-disable no-undef */

import { generateTestPuzzle } from '../src/services/puzzleGenerator';
import { getTodayDate } from '../src/utils/date';

async function main() {
  console.log('🎬 Generating test puzzle...\n');

  // Generate puzzle
  const puzzle = await generateTestPuzzle();

  console.log('✅ Puzzle generated:');
  console.log(`   - ${puzzle.films.length} films`);
  console.log(`   - ${puzzle.groups.length} groups`);
  puzzle.groups.forEach((group, i) => {
    console.log(`     ${i + 1}. ${group.connection} (${group.difficulty})`);
  });

  // Get today's date
  const today = getTodayDate();
  const id = crypto.randomUUID();

  // Extract connection types
  const connectionTypes = puzzle.groups.map((g) => g.connection);

  // Create SQL
  const sql = `
-- Insert test puzzle for ${today}
INSERT INTO puzzles (
  id,
  puzzle_date,
  films,
  groups,
  status,
  quality_score,
  connection_types,
  metadata
)
VALUES (
  '${id}',
  '${today}',
  '${JSON.stringify(puzzle.films).replace(/'/g, "''")}'::jsonb,
  '${JSON.stringify(puzzle.groups).replace(/'/g, "''")}'::jsonb,
  'published',
  75,
  ARRAY[${connectionTypes.map((c) => `'${c.replace(/'/g, "''")}'`).join(', ')}],
  '{"generatedBy": "test-script"}'::jsonb
);
`;

  console.log('\n📋 Copy and run this SQL in Supabase SQL Editor:\n');
  console.log('─'.repeat(80));
  console.log(sql);
  console.log('─'.repeat(80));
  console.log('\n💡 Go to: https://supabase.com/dashboard → SQL Editor → New Query\n');
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
